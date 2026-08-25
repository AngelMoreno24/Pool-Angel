import React, { useState, useEffect, useMemo } from 'react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getjob, getjobByTech, createjob, updatejob } from '../services/jobService';
import { getCustomers } from '../services/customerService';
import { getPropertiesByCustomer } from '../services/propertyService';
import { getTechs } from '../services/techService';
import FormField from '../components/FormField';
import Spinner from '../components/Spinner';
import JobEditModal from '../components/JobEditModal';
 
// react-leaflet's default marker icons reference image paths that don't
// resolve correctly under Vite's bundler - kept as a fallback for any
// marker that doesn't get a numbered icon below.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
 
// A small numbered circle marker, matching each stop's position in the
// route order - built fresh per stop since the number depends on index.
const createNumberedIcon = (number) => L.divIcon({
  className: 'route-numbered-marker',
  html: `<div style="background:#4f46e5;color:white;border-radius:9999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);">${number}</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13],
});
 
// Fallback map center if no job sites have coordinates yet (Phoenix, AZ)
const DEFAULT_CENTER = [33.4484, -112.0740];
 
// Work week only, using JS Date.getDay() values (0=Sun ... 6=Sat) so this
// lines up directly with Job.dayOfWeek and with new Date().getDay().
const WORK_DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
];
 
const Route = () => {
  const { session, signOut } = UserAuth();
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [techs, setTechs] = useState([]);
 
  const [title, setTitle] = useState("");
  const [jobType, setJobType] = useState("RECURRING_CLEANING");
  const [frequency, setFrequency] = useState("WEEKLY");
  const [customerId, setCustomerId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [defaultTechId, setDefaultTechId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1); // defaults to Monday
 
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
 
  // Which day's route is currently being viewed/edited - defaults to
  // today if today is a work day, otherwise Monday.
  const todayDow = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(
    WORK_DAYS.some((d) => d.value === todayDow) ? todayDow : 1
  );
 
  // Route reordering - a local working copy of just the selected day's jobs,
  // kept separate from the full `jobs` list so reordering one day never
  // touches another day's saved order until explicitly saved.
  const [dayOrder, setDayOrder] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderSaved, setOrderSaved] = useState(false);
  const [orderError, setOrderError] = useState(null);
 
  // The job currently open in the edit popup, if any
  const [editingJob, setEditingJob] = useState(null);
 
  // Travel time estimates between consecutive stops, fetched from OSRM's
  // free public routing demo whenever the route's stops or order change.
  const [travelLegs, setTravelLegs] = useState([]);
  const [travelLoading, setTravelLoading] = useState(false);
  const [travelError, setTravelError] = useState(null);
 
  const navigate = useNavigate();
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobsResponse, customersResponse, techsResponse] = await Promise.all([
          getjobByTech(session.user.id),
          getCustomers(),
          getTechs()
        ]);
        const jobsList = Array.isArray(jobsResponse) ? jobsResponse : jobsResponse?.data || [];
        setJobs(jobsList);
 
        const customersList = Array.isArray(customersResponse) ? customersResponse : customersResponse?.data || [];
        setCustomers(customersList);
        const techsList = Array.isArray(techsResponse)
          ? techsResponse
          : Array.isArray(techsResponse?.data)
            ? techsResponse.data
            : Array.isArray(techsResponse?.techs)
              ? techsResponse.techs
              : [];
        setTechs(techsList);
 
        // Fetch all properties for all customers
        try {
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
          console.error("Error fetching all properties:", error);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
 
  useEffect(() => {
    const fetchProperties = async () => {
      if (!customerId) {
        setProperties([]);
        return;
      }
      try {
        const response = await getPropertiesByCustomer(customerId);
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.properties)
              ? response.properties
              : [];
        setProperties(list);
      } catch (error) {
        console.error("Error fetching properties:", error);
      }
    }
    fetchProperties();
  }, [customerId]);
 
  // Jobs scheduled for the currently selected weekday only.
  const jobsForSelectedDay = useMemo(
    () => jobs.filter((job) => job.dayOfWeek === selectedDay),
    [jobs, selectedDay]
  );
 
  // Whenever the selected day (or the underlying job data) changes, reset
  // the local reorder-working-copy to match the server's saved order for
  // that day - this is what makes each day's route independent.
  useEffect(() => {
    const sorted = [...jobsForSelectedDay].sort((a, b) => {
      if (a.routeOrder == null && b.routeOrder == null) return 0;
      if (a.routeOrder == null) return 1;
      if (b.routeOrder == null) return -1;
      return a.routeOrder - b.routeOrder;
    });
    setDayOrder(sorted);
    setOrderSaved(false);
    setOrderError(null);
  }, [selectedDay, jobsForSelectedDay]);
 
  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };
 
  const handleCreate = async () => {
    if (submitting) return;
 
    if (!title.trim() || !customerId || !propertyId || !startDate) {
      setFieldErrors({
        title: !title.trim() ? ["Title is required"] : undefined,
        customerId: !customerId ? ["Customer is required"] : undefined,
        propertyId: !propertyId ? ["Property is required"] : undefined,
        startDate: !startDate ? ["Start date is required"] : undefined,
      });
      return;
    }
 
    setFieldErrors({});
    setSubmitError(null);
 
    try {
      setSubmitting(true);
      const jobData = {
        customerId,
        propertyId,
        title: title.trim(),
        jobType,
        frequency,
        startDate: new Date(startDate),
        status,
        dayOfWeek,
        ...(defaultTechId ? { defaultTechId } : {}),
      };
      const createdJob = await createjob(jobData);
      setJobs([...jobs, createdJob]);
      setTitle("");
      setJobType("RECURRING_CLEANING");
      setFrequency("WEEKLY");
      setCustomerId("");
      setPropertyId("");
      setStartDate("");
      setStatus("ACTIVE");
      setDefaultTechId("");
      // Leave dayOfWeek as-is - creating several jobs for the same day in a
      // row is the common case, no need to reset it each time.
    } catch (error) {
      console.error("Error creating job:", error);
      setSubmitError("Couldn't create that job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
 
  // Move a job up or down within the SELECTED DAY's route only (local until "Save")
  const moveJob = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= dayOrder.length) return;
    const reordered = [...dayOrder];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setDayOrder(reordered);
    setOrderSaved(false);
  };
 
  const handleSaveRouteOrder = async () => {
    if (savingOrder) return;
    try {
      setSavingOrder(true);
      setOrderError(null);
      // Only touches routeOrder on jobs belonging to the selected day -
      // every other day's saved order is completely untouched.
      await Promise.all(
        dayOrder.map((job, index) => updatejob(job.id, { routeOrder: index }))
      );
      const updatedIds = new Set(dayOrder.map((j) => j.id));
      setJobs(jobs.map((job) =>
        updatedIds.has(job.id)
          ? { ...job, routeOrder: dayOrder.findIndex((j) => j.id === job.id) }
          : job
      ));
      setOrderSaved(true);
      setTimeout(() => setOrderSaved(false), 2000);
    } catch (error) {
      console.error("Error saving route order:", error);
      setOrderError("Couldn't save the route order. Please try again.");
    } finally {
      setSavingOrder(false);
    }
  };
 
  // Job sites with valid coordinates, in the selected day's route order -
  // drives both the marker list and the connecting line on the map.
  // Memoized so the travel-time effect below only re-runs when the actual
  // set/order of stops changes, not on every unrelated render.
  const routeStops = useMemo(() => (
    dayOrder
      .map((job) => {
        const property = allProperties.find((p) => p.id === job.propertyId);
        if (!property?.latitude || !property?.longitude) return null;
        return { job, property };
      })
      .filter(Boolean)
  ), [dayOrder, allProperties]);
 
  // A stable key representing the current stops + their order - used as the
  // effect dependency instead of the routeStops array itself, since a new
  // array reference on every render would otherwise refetch constantly.
  const routeStopsKey = routeStops
    .map((s) => `${s.job.id}:${s.property.latitude},${s.property.longitude}`)
    .join('|');
 
  useEffect(() => {
    const fetchTravelTimes = async () => {
      if (routeStops.length < 2) {
        setTravelLegs([]);
        setTravelError(null);
        return;
      }
      try {
        setTravelLoading(true);
        setTravelError(null);
        const coords = routeStops
          .map((s) => `${s.property.longitude},${s.property.latitude}`)
          .join(';');
        // OSRM's free public demo server - fine for occasional use like this,
        // but it's rate-limited and has no uptime guarantee. Self-host OSRM
        // or switch to a paid routing API (Mapbox, Google) if this app sees
        // real production traffic.
        const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`;
        const response = await fetch(url);
        const data = await response.json();
 
        if (data.code !== 'Ok' || !data.routes?.[0]?.legs) {
          throw new Error('No route returned');
        }
 
        setTravelLegs(
          data.routes[0].legs.map((leg) => ({
            durationMin: Math.max(1, Math.round(leg.duration / 60)),
            distanceMi: (leg.distance / 1609.34).toFixed(1),
          }))
        );
      } catch (error) {
        console.error('Error fetching travel times:', error);
        setTravelError("Couldn't estimate travel times right now.");
        setTravelLegs([]);
      } finally {
        setTravelLoading(false);
      }
    };
    fetchTravelTimes();
  }, [routeStopsKey]);
 
  const totalTravel = travelLegs.reduce(
    (acc, leg) => ({
      minutes: acc.minutes + leg.durationMin,
      miles: acc.miles + parseFloat(leg.distanceMi),
    }),
    { minutes: 0, miles: 0 }
  );
 
  const mapCenter = routeStops.length > 0
    ? [routeStops[0].property.latitude, routeStops[0].property.longitude]
    : DEFAULT_CENTER;
 
  const polylinePositions = routeStops.map((stop) => [stop.property.latitude, stop.property.longitude]);
 
  const selectedDayLabel = WORK_DAYS.find((d) => d.value === selectedDay)?.label;
 
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
 
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Routes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Each day of the week has its own independent route - order jobs separately for each day.
          </p>
        </header>
 
        {/* Day tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 shadow-sm p-1.5">
          {WORK_DAYS.map((day) => {
            const count = jobs.filter((j) => j.dayOfWeek === day.value).length;
            const isActive = selectedDay === day.value;
            return (
              <button
                key={day.value}
                onClick={() => setSelectedDay(day.value)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {day.label}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
 
        {/* Route map for the selected day */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-base font-medium text-slate-900">{selectedDayLabel} route map</h2>
              {routeStops.length === 0 && !loading && (
                <p className="text-sm text-slate-400 mt-0.5">
                  {jobsForSelectedDay.length === 0
                    ? `No jobs scheduled for ${selectedDayLabel} yet.`
                    : "No job sites have coordinates yet - they're geocoded automatically when a property is added."}
                </p>
              )}
            </div>
            {routeStops.length > 1 && (
              <div className="text-sm text-slate-500 flex items-center gap-1.5">
                {travelLoading ? (
                  <>
                    <Spinner className="h-3.5 w-3.5" />
                    <span>Estimating drive time...</span>
                  </>
                ) : travelError ? (
                  <span className="text-slate-400">{travelError}</span>
                ) : travelLegs.length > 0 ? (
                  <span>
                    <span className="font-medium text-slate-700">~{totalTravel.minutes} min</span> drive
                    {' • '}
                    {totalTravel.miles.toFixed(1)} mi total
                  </span>
                ) : null}
              </div>
            )}
          </div>
          <div className="h-80">
            <MapContainer center={mapCenter} zoom={routeStops.length > 0 ? 11 : 10} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {polylinePositions.length > 1 && (
                <Polyline positions={polylinePositions} pathOptions={{ color: "#4f46e5", weight: 3 }} />
              )}
              {routeStops.map((stop, index) => (
                <Marker
                  key={stop.job.id}
                  position={[stop.property.latitude, stop.property.longitude]}
                  icon={createNumberedIcon(index + 1)}
                >
                  <Popup>
                    <p className="font-medium">{index + 1}. {stop.job.title}</p>
                    <p className="text-sm text-slate-500">{stop.property.address}</p>
                    {travelLegs[index] && (
                      <p className="text-xs text-indigo-600 mt-1">
                        ~{travelLegs[index].durationMin} min / {travelLegs[index].distanceMi} mi to next stop
                      </p>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </section>
 
        {/* This day's route order */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <h2 className="text-base font-medium text-slate-900">
              {selectedDayLabel} stops {!loading && (
                <span className="text-slate-400 font-normal">({dayOrder.length})</span>
              )}
            </h2>
            {dayOrder.length > 1 && (
              <button
                onClick={handleSaveRouteOrder}
                disabled={savingOrder}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {savingOrder && <Spinner />}
                {savingOrder ? "Saving..." : orderSaved ? "Saved!" : `Save ${selectedDayLabel} order`}
              </button>
            )}
          </div>
 
          {orderError && (
            <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {orderError}
            </div>
          )}
 
          {loading ? (
            <ul className="divide-y divide-slate-100">
              {[...Array(3)].map((_, i) => (
                <li key={i} className="px-5 py-4 flex items-center gap-3 animate-pulse">
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                </li>
              ))}
            </ul>
          ) : dayOrder.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-500">No jobs scheduled for {selectedDayLabel} yet.</p>
              <p className="text-sm text-slate-400 mt-1">Create one below and set its day to {selectedDayLabel}.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {dayOrder.map((job, index) => {
                const customer = customers.find(c => c.id === job.customerId);
                const property = allProperties.find(p => p.id === job.propertyId);
                const tech = techs.find(t => t.id === job.defaultTechId);
                // This job's position within routeStops (only jobs with valid
                // coordinates) - used to look up its travel leg "to next stop".
                const stopIndex = routeStops.findIndex((s) => s.job.id === job.id);
                const legToNext = stopIndex !== -1 ? travelLegs[stopIndex] : null;
                return (
                  <li key={job.id}>
                    <div className="px-5 py-4 flex items-center gap-3">
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          onClick={() => moveJob(index, -1)}
                          disabled={index === 0}
                          className="h-6 w-6 flex items-center justify-center rounded border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Move up"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveJob(index, 1)}
                          disabled={index === dayOrder.length - 1}
                          className="h-6 w-6 flex items-center justify-center rounded border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Move down"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
 
                      <span className="h-6 w-6 shrink-0 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </span>
 
                      <div
                        onClick={() => setEditingJob(job)}
                        className="min-w-0 flex-1 cursor-pointer"
                      >
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {job.title}
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                          {customer ? `${customer.firstName} ${customer.lastName}` : "—"} • {property?.address || "—"}
                          {!property?.latitude && " (not on map yet)"}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {job.frequency || "—"} • {job.jobType} • {tech ? `${tech.firstName} ${tech.lastName || ''}`.trim() : 'Unassigned'}
                        </p>
                      </div>
 
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 shrink-0">
                        {job.status || "ACTIVE"}
                      </span>
                    </div>
 
                    {legToNext && (
                      <div className="pl-[4.75rem] pb-2 -mt-1 flex items-center gap-1 text-xs text-indigo-600">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span>{legToNext.durationMin} min / {legToNext.distanceMi} mi to next stop</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
 
        {editingJob && (
          <JobEditModal
            job={editingJob}
            techs={techs}
            onClose={() => setEditingJob(null)}
            onSaved={(updatedJob) => {
              setJobs(jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
              setEditingJob(null);
            }}
          />
        )}
 
        {/* Create job form */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-medium text-slate-900 mb-4">Create a job</h2>
 
          {submitError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {submitError}
            </div>
          )}
 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 
            <FormField
              label="Title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); clearFieldError("title"); }}
              placeholder="Weekly Pool Cleaning"
              error={fieldErrors.title}
            />
 
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Day of week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {WORK_DAYS.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">Which day's route this job belongs to.</p>
            </div>
 
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Customer</label>
              <select
                value={customerId}
                onChange={(e) => { setCustomerId(e.target.value); setPropertyId(""); clearFieldError("customerId"); }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select a customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
              {fieldErrors.customerId && <p className="mt-1 text-sm text-red-600">{fieldErrors.customerId[0]}</p>}
            </div>
 
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Property</label>
              <select
                value={propertyId}
                onChange={(e) => { setPropertyId(e.target.value); clearFieldError("propertyId"); }}
                disabled={!customerId}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
              >
                <option value="">{customerId ? "Select a property" : "Select a customer first"}</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.address}</option>
                ))}
              </select>
              {fieldErrors.propertyId && <p className="mt-1 text-sm text-red-600">{fieldErrors.propertyId[0]}</p>}
            </div>
 
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); clearFieldError("startDate"); }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {fieldErrors.startDate && <p className="mt-1 text-sm text-red-600">{fieldErrors.startDate[0]}</p>}
            </div>
 
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Job Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="RECURRING_CLEANING">Recurring Cleaning</option>
                <option value="ONE_TIME_SERVICE">One Time Service</option>
                <option value="REPAIR">Repair</option>
                <option value="CHEMICAL_BALANCE">Chemical Balance</option>
              </select>
            </div>
 
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Biweekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="ONE_TIME">One Time</option>
              </select>
            </div>
 
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
 
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Assigned tech</label>
              <select
                value={defaultTechId}
                onChange={(e) => setDefaultTechId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Unassigned</option>
                {techs.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.firstName} {tech.lastName || ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
 
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={submitting}
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {submitting && <Spinner />}
              {submitting ? "Creating..." : "Create job"}
            </button>
          </div>
        </section>
 
      </div>
    </div>
  )
}
 
export default Route
