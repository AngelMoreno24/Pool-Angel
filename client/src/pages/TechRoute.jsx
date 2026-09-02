import React, { useState, useEffect, useMemo } from 'react'
import { UserAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getjobByTech } from '../services/jobService';
import { getVisits, createVisit, updateVisit } from '../services/visitService';
import { getPropertiesByCustomer } from '../services/propertyService';
import { getCustomers } from '../services/customerService';
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
 
  const [jobs, setJobs] = useState([]);
  const [visits, setVisits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
 
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
 
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
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadError(null);
 
        const [jobsResponse, visitsResponse, customersResponse] = await Promise.all([
          getjobByTech(session.user.id),
          getVisits(),
          getCustomers(),
        ]);
 
        const jobsList = Array.isArray(jobsResponse) ? jobsResponse : jobsResponse?.data || [];
        setJobs(jobsList);
 
        const visitsList = Array.isArray(visitsResponse) ? visitsResponse : visitsResponse?.data || [];
        setVisits(visitsList);
 
        const customersList = Array.isArray(customersResponse) ? customersResponse : customersResponse?.data || [];
        setCustomers(customersList);
 
        const allPropsTemp = [];
        for (const customer of customersList) {
          const response = await getPropertiesByCustomer(customer.id);
          const list = Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response?.properties)
                ? response.properties
                : [];
          allPropsTemp.push(...list);
        }
        setAllProperties(allPropsTemp);
      } catch (error) {
        console.error("Error loading route:", error);
        setLoadError("Couldn't load your route. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session.user.id]);
 
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
 
  const completedCount = stops.filter((s) => s.completed).length;
 
  const handleMarkComplete = async (stop) => {
    if (completingId) return;
    setCompletingId(stop.job.id);
    setActionError(null);
 
    try {
      const techId = stop.job.defaultTechId || selectedDayJobs[0]?.defaultTechId || session.user.id;
      const noteText = (noteDrafts[stop.job.id] ?? '').trim();

      if (stop.visit) {
        await updateVisit(stop.visit.id, {
          status: 'COMPLETED',
          notes: noteText || stop.visit.notes || stop.job.notes || undefined,
        });
        setVisits((prev) => prev.map((v) =>
          v.id === stop.visit.id
            ? { ...v, status: 'COMPLETED', notes: noteText || stop.visit.notes || stop.job.notes || v.notes }
            : v
        ));
      } else {
        // Uses the SELECTED date, not today - so marking a past or future
        // day complete records the visit against the day actually being viewed.
        const created = await createVisit({
          jobId: stop.job.id,
          assignedTechId: techId,
          scheduledDate: selectedDate,
          status: 'COMPLETED',
          notes: noteText || stop.job.notes || undefined,
        });
        setVisits((prev) => [...prev, created]);
      }

      setNoteDrafts((prev) => ({ ...prev, [stop.job.id]: '' }));
    } catch (error) {
      console.error("Error marking job complete:", error);
      setActionError("Couldn't mark that job complete. Please try again.");
    } finally {
      setCompletingId(null);
    }
  };
 
  const handleUndo = async (stop) => {
    if (completingId || !stop.visit) return;
    setCompletingId(stop.job.id);
    setActionError(null);
    try {
      await updateVisit(stop.visit.id, { status: 'SCHEDULED' });
      setVisits(visits.map((v) => v.id === stop.visit.id ? { ...v, status: 'SCHEDULED' } : v));
    } catch (error) {
      console.error("Error undoing completion:", error);
      setActionError("Couldn't undo that. Please try again.");
    } finally {
      setCompletingId(null);
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
                      stop.completed ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {stop.completed ? '✓' : index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${stop.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
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

                      {!stop.completed && (
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
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-end">
                        {stop.completed ? (
                          <button
                            onClick={() => handleUndo(stop)}
                            disabled={completingId === stop.job.id}
                            className="shrink-0 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
                          >
                            {completingId === stop.job.id ? <Spinner /> : "Undo"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkComplete(stop)}
                            disabled={completingId === stop.job.id}
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                          >
                            {completingId === stop.job.id && <Spinner />}
                            {completingId === stop.job.id ? "Saving..." : "Mark complete"}
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
