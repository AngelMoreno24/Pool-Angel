import React, { useState, useMemo } from 'react'
import { UserAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAllCustomerProperties, useCheckInVisit, useCompleteVisit, useCreateVisit, useCustomers, useJobs, useSkipVisit, useVisits } from '../hooks/useAppQueries';
import Spinner from '../components/Spinner';
 
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
 
const createStopIcon = (number, completed) => L.divIcon({
  className: 'route-numbered-marker',
  html: `<div style="background:${completed ? '#16a34a' : '#4f46e5'};color:white;border-radius:9999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);">${completed ? '✓' : number}</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13],
});
 
const DEFAULT_CENTER = [33.4484, -112.0740];
 
const dateKey = (date) => date.toISOString().split('T')[0];
 
const getMonday = (date) => {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return monday;
};
 
const TechRoute = () => {
  const { session } = UserAuth();
 
  const jobsQuery = useJobs({ technicianId: session.user.id });
  const visitsQuery = useVisits();
  const customersQuery = useCustomers();
  const jobs = jobsQuery.data || [];
  const visits = visitsQuery.data || [];
  const customers = customersQuery.data || [];
  const allPropertiesQuery = useAllCustomerProperties(customers);
  const allProperties = allPropertiesQuery.data || [];
  const createVisitMutation = useCreateVisit();
  const checkInMutation = useCheckInVisit();
  const completeVisitMutation = useCompleteVisit();
  const skipVisitMutation = useSkipVisit();
 
  const loading = jobsQuery.isLoading || visitsQuery.isLoading || customersQuery.isLoading || allPropertiesQuery.isLoading;
  const [loadError, setLoadError] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [readingDrafts, setReadingDrafts] = useState({});
  const [skipDrafts, setSkipDrafts] = useState({});
 
  const today = new Date();
  const todayKey = dateKey(today);
 
  // Mon-Fri of the CURRENT week, as actual dates - not just abstract
  // weekday numbers, since marking a job complete needs a real date to
  // save the Visit against.
  const weekDays = useMemo(() => {
    const monday = getMonday(today);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return { label, date, dow: date.getDay() };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  // Defaults to today if today is a work day, otherwise this week's Monday.
  const [selectedDate, setSelectedDate] = useState(() => {
    const dow = today.getDay();
    return (dow >= 1 && dow <= 5) ? today : getMonday(today);
  });
 
  const selectedKey = dateKey(selectedDate);
  const selectedDow = selectedDate.getDay();
 
  // Jobs scheduled for the SELECTED day, not just today.
  const selectedDayJobs = useMemo(() => {
    return jobs
      .filter((j) => j.dayOfWeek === selectedDow)
      .sort((a, b) => (a.routeOrder ?? 999) - (b.routeOrder ?? 999));
  }, [jobs, selectedDow]);
 
  // A visit for this job on the SELECTED date, not hardcoded to today.
  const visitForJob = (jobId) =>
    visits.find((v) => v.jobId === jobId && v.scheduledDate?.slice(0, 10) === selectedKey);
 
  const stops = useMemo(() => {
    return selectedDayJobs.map((job) => {
      const property = allProperties.find((p) => p.id === job.propertyId);
      const customer = customers.find((c) => c.id === job.customerId);
      const visit = visitForJob(job.id);
      return { job, property, customer, visit, completed: visit?.status === 'COMPLETED' };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDayJobs, allProperties, customers, visits, selectedKey]);
 
  const mappedStops = stops.filter((s) => s.property?.latitude && s.property?.longitude);
  const mapCenter = mappedStops.length > 0
    ? [mappedStops[0].property.latitude, mappedStops[0].property.longitude]
    : DEFAULT_CENTER;
  const polylinePositions = mappedStops.map((s) => [s.property.latitude, s.property.longitude]);
 
  const completedCount = stops.filter((s) => s.visit?.status === 'COMPLETED').length;

  const ensureVisit = async (stop) => {
    if (stop.visit) return stop.visit;
    return createVisitMutation.mutateAsync({
      jobId: stop.job.id,
      scheduledDate: selectedDate,
      status: 'SCHEDULED',
      notes: stop.job.notes || undefined,
    });
  };

  const handleCheckIn = async (stop) => {
    if (actionId) return;
    setActionId(stop.job.id);
    setActionError(null);
    try {
      const visit = await ensureVisit(stop);
      await checkInMutation.mutateAsync(visit.id);
    } catch (error) {
      console.error("Error checking in visit:", error);
      setActionError("Couldn't check in to that visit. Please try again.");
    } finally {
      setActionId(null);
    }
  };
 
  const handleMarkComplete = async (stop) => {
    if (actionId) return;
    setActionId(stop.job.id);
    setActionError(null);
 
    try {
      const noteText = (noteDrafts[stop.job.id] ?? '').trim();
      const visit = await ensureVisit(stop);
      const readings = Object.fromEntries(
        Object.entries(readingDrafts[stop.job.id] || {}).filter(([, value]) => value !== '')
      );
      await completeVisitMutation.mutateAsync({ id: visit.id, data: {
        notes: noteText || visit.notes || stop.job.notes || undefined,
        readings,
      } });

      setNoteDrafts((prev) => ({ ...prev, [stop.job.id]: '' }));
      setReadingDrafts((prev) => ({ ...prev, [stop.job.id]: {} }));
    } catch (error) {
      console.error("Error marking job complete:", error);
      setActionError("Couldn't mark that job complete. Please try again.");
    } finally {
      setActionId(null);
    }
  };
 
  const handleSkip = async (stop) => {
    if (actionId) return;
    const reason = (skipDrafts[stop.job.id] ?? '').trim();
    if (!reason) {
      setActionError("Add a reason before skipping this visit.");
      return;
    }
    setActionId(stop.job.id);
    setActionError(null);
    try {
      const visit = await ensureVisit(stop);
      await skipVisitMutation.mutateAsync({ id: visit.id, reason });
      setSkipDrafts((prev) => ({ ...prev, [stop.job.id]: '' }));
    } catch (error) {
      console.error("Error skipping visit:", error);
      setActionError("Couldn't skip that visit. Please try again.");
    } finally {
      setActionId(null);
    }
  };
 
  const selectedLabel = selectedKey === todayKey
    ? 'Today'
    : selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const getDirectionsUrl = (stop) => {
    if (!stop.property) return '#';

    const destination = stop.property.latitude && stop.property.longitude
      ? `${stop.property.latitude},${stop.property.longitude}`
      : encodeURIComponent(stop.property.address || `${stop.customer?.firstName || ''} ${stop.customer?.lastName || ''}`.trim());

    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
          <div className="h-6 w-40 bg-slate-200 rounded" />
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-64" />
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
 
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">My Route</h1>
          <p className="mt-1 text-sm text-slate-500">
            {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            {!loading && ` • ${completedCount} of ${stops.length} complete`}
          </p>
        </header>
 
        {/* Day tabs - Sun-Sat of the current week */}
        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 shadow-sm p-1.5">
          {weekDays.map((day) => {
            const isSelected = dateKey(day.date) === selectedKey;
            const isToday = dateKey(day.date) === todayKey;
            const count = jobs.filter((j) => j.dayOfWeek === day.dow).length;
            return (
              <button
                key={day.label}
                onClick={() => setSelectedDate(day.date)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative ${
                  isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {day.label}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    ({count})
                  </span>
                )}
                {isToday && (
                  <span className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
                )}
              </button>
            );
          })}
        </div>
 
        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}
        {actionError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}
 
        {/* Map */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-72">
            <MapContainer center={mapCenter} zoom={mappedStops.length > 0 ? 11 : 10} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {polylinePositions.length > 1 && (
                <Polyline positions={polylinePositions} pathOptions={{ color: "#4f46e5", weight: 3 }} />
              )}
              {mappedStops.map((stop, index) => (
                <Marker
                  key={stop.job.id}
                  position={[stop.property.latitude, stop.property.longitude]}
                  icon={createStopIcon(index + 1, stop.completed)}
                >
                  <Popup>
                    <p className="font-medium">{index + 1}. {stop.job.title}</p>
                    <p className="text-sm text-slate-500">{stop.property.address}</p>
                    {stop.completed && <p className="text-xs text-green-600 mt-1">Completed</p>}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </section>
 
        {/* Stop list */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-medium text-slate-900">{selectedLabel}'s stops</h2>
          </div>
 
          {stops.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-500">No jobs scheduled for {selectedLabel.toLowerCase() === 'today' ? 'today' : selectedLabel}.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stops.map((stop, index) => (
                <li key={stop.job.id} className={`px-5 py-4 ${stop.completed ? 'bg-green-50/40' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${
                      stop.visit?.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : stop.visit?.status === 'SKIPPED' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {stop.visit?.status === 'COMPLETED' ? '✓' : stop.visit?.status === 'SKIPPED' ? '–' : index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${stop.visit?.status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {stop.job.title}
                          </p>
                          <p className="text-sm text-slate-500 truncate">
                            {stop.customer ? `${stop.customer.firstName} ${stop.customer.lastName}` : "—"} • {stop.property?.address || "—"}
                          </p>
                        </div>

                        {stop.property && (
                          <a
                            href={getDirectionsUrl(stop)}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            Directions
                          </a>
                        )}
                      </div>

                      {(stop.job.notes || stop.visit?.notes) && (
                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                          <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                            {stop.visit?.notes || stop.job.notes}
                          </p>
                        </div>
                      )}

                      {stop.visit && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className={`rounded-full px-2 py-1 font-medium ${stop.visit.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : stop.visit.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : stop.visit.status === 'SKIPPED' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                            {stop.visit.status.replace('_', ' ')}
                          </span>
                          {stop.visit.checkInAt && <span>Checked in {new Date(stop.visit.checkInAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}
                          {stop.visit.checkOutAt && <span>Completed {new Date(stop.visit.checkOutAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}
                        </div>
                      )}

                      {stop.visit?.serviceData?.readings && Object.keys(stop.visit.serviceData.readings).length > 0 && (
                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Service readings</p>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-emerald-900">
                            {Object.entries(stop.visit.serviceData.readings).map(([field, value]) => (
                              <span key={field}>
                                {field === 'ph' ? 'pH' : field === 'waterTemperature' ? 'Water temp' : field.charAt(0).toUpperCase() + field.slice(1)}: {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {!['COMPLETED', 'SKIPPED'].includes(stop.visit?.status) && (
                        <div className="mt-3">
                          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Service note
                          </label>
                          <textarea
                            value={noteDrafts[stop.job.id] ?? ''}
                            onChange={(event) =>
                              setNoteDrafts((prev) => ({
                                ...prev,
                                [stop.job.id]: event.target.value,
                              }))
                            }
                            rows={2}
                            placeholder="Add a note for this visit when you complete it..."
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {[
                              ['chlorine', 'Chlorine'],
                              ['ph', 'pH'],
                              ['alkalinity', 'Alkalinity'],
                              ['waterTemperature', 'Water temp'],
                            ].map(([field, label]) => (
                              <label key={field} className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                {label}
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={readingDrafts[stop.job.id]?.[field] ?? ''}
                                  onChange={(event) => setReadingDrafts((prev) => ({
                                    ...prev,
                                    [stop.job.id]: { ...prev[stop.job.id], [field]: event.target.value },
                                  }))}
                                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm font-normal normal-case text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                        {!stop.visit || stop.visit.status === 'SCHEDULED' ? (
                          <button onClick={() => handleCheckIn(stop)} disabled={actionId === stop.job.id} className="rounded-lg border border-indigo-200 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">
                            {actionId === stop.job.id ? <Spinner /> : 'Check in'}
                          </button>
                        ) : null}
                        {stop.visit?.status === 'IN_PROGRESS' || stop.visit?.status === 'SCHEDULED' ? (
                          <button
                            onClick={() => handleMarkComplete(stop)}
                            disabled={actionId === stop.job.id}
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                          >
                            {actionId === stop.job.id && <Spinner />}
                            {actionId === stop.job.id ? "Saving..." : "Complete visit"}
                          </button>
                        ) : null}
                        {!['COMPLETED', 'SKIPPED'].includes(stop.visit?.status) && (
                          <input
                            value={skipDrafts[stop.job.id] ?? ''}
                            onChange={(event) => setSkipDrafts((prev) => ({ ...prev, [stop.job.id]: event.target.value }))}
                            placeholder="Reason to skip"
                            className="order-last w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 sm:order-0 sm:w-40"
                          />
                        )}
                        {!['COMPLETED', 'SKIPPED'].includes(stop.visit?.status) && (
                          <button onClick={() => handleSkip(stop)} disabled={actionId === stop.job.id} className="rounded-lg border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50">
                            Skip
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
 
export default TechRoute
