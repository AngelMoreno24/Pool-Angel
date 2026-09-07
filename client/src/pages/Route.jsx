import React, { useState, useEffect, useMemo } from 'react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAllCustomerProperties, useCreateJob, useCustomerProperties, useCustomers, useJobs, useRescheduleVisit, useTechsQuery, useUpdateJob, useVisits } from '../hooks/useAppQueries';
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
const createNumberedIcon = (number, color = '#4f46e5') => L.divIcon({
  className: 'route-numbered-marker',
  html: `<div style="background:${color};color:white;border-radius:9999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);">${number}</div>`,
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
  const { session, signOut, role } = UserAuth();

  if (role !== 'OWNER') {
    return <Navigate to="/dashboard" replace />;
  }

  const [customerId, setCustomerId] = useState("");
  const jobsQuery = useJobs({ technicianId: role === 'OWNER' ? undefined : session?.user?.id });
  const visitsQuery = useVisits();
  const customersQuery = useCustomers();
  const techsQuery = useTechsQuery();
  const jobs = jobsQuery.data || [];
  const visits = visitsQuery.data || [];
  const customers = customersQuery.data || [];
  const techs = techsQuery.data || [];
  const allPropertiesQuery = useAllCustomerProperties(customers);
  const allProperties = allPropertiesQuery.data || [];
  const propertiesQuery = useCustomerProperties(customerId);
  const properties = propertiesQuery.data || [];
  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();
  const rescheduleVisitMutation = useRescheduleVisit();
 
  const [title, setTitle] = useState("");
  const [jobType, setJobType] = useState("RECURRING_CLEANING");
  const [frequency, setFrequency] = useState("WEEKLY");
  const [propertyId, setPropertyId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [defaultTechId, setDefaultTechId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1); // defaults to Monday
  const [routeFilter, setRouteFilter] = useState('ALL');
 
  const [fieldErrors, setFieldErrors] = useState({});
  const loading = jobsQuery.isLoading || visitsQuery.isLoading || customersQuery.isLoading || techsQuery.isLoading || allPropertiesQuery.isLoading;
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
 
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
  const [rescheduleDates, setRescheduleDates] = useState({});
  const [reschedulingId, setReschedulingId] = useState(null);
 
  const navigate = useNavigate();
 
  const ownerProfile = useMemo(
    () => techs.find((tech) => tech.role === 'OWNER'),
    [techs]
  );

  const routeFilterOptions = useMemo(() => {
    const options = [{ id: 'ALL', label: 'All assignments' }];

    if (ownerProfile) {
      options.push({ id: ownerProfile.id, label: `${ownerProfile.firstName || 'Owner'} ${ownerProfile.lastName || ''}`.trim() + ' (Owner)' });
    }

    techs
      .filter((tech) => tech.role === 'TECH')
      .forEach((tech) => {
        options.push({ id: tech.id, label: `${tech.firstName || 'Tech'} ${tech.lastName || ''}`.trim() });
      });

    return options;
  }, [ownerProfile, techs]);

  // Jobs scheduled for the currently selected weekday only, filtered to the
  // currently selected route owner/tech when the owner is planning routes.
  const jobsForSelectedDay = useMemo(
    () => jobs.filter((job) => {
      if (job.dayOfWeek !== selectedDay) return false;
      if (routeFilter === 'ALL') return true;
      return job.defaultTechId === routeFilter;
    }),
    [jobs, selectedDay, routeFilter]
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
      await createJobMutation.mutateAsync(jobData);
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
        dayOrder.map((job, index) => updateJobMutation.mutateAsync({ id: job.id, data: { routeOrder: index } }))
      );
      setOrderSaved(true);
      setTimeout(() => setOrderSaved(false), 2000);
    } catch (error) {
      console.error("Error saving route order:", error);
      setOrderError("Couldn't save the route order. Please try again.");
    } finally {
      setSavingOrder(false);
    }
  };
 
  const routeColorMap = useMemo(() => {
    const palette = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444'];
    const map = {};

    techs.forEach((tech, index) => {
      const safeColor = tech.role === 'OWNER' ? '#4f46e5' : palette[index % palette.length];
      map[tech.id] = safeColor;
    });

    return map;
  }, [techs]);

  // Job sites with valid coordinates, grouped by assignee so the map shows
  // separate connected lines for each owner/tech route while preserving the
  // current route order within each individual route.
  const routeStopGroups = useMemo(() => {
    const groupedStops = new Map();

    dayOrder.forEach((job) => {
      const property = allProperties.find((p) => p.id === job.propertyId);
      if (!property?.latitude || !property?.longitude) return;

      const techId = job.defaultTechId || 'UNASSIGNED';
      if (!groupedStops.has(techId)) {
        groupedStops.set(techId, []);
      }

      groupedStops.get(techId).push({
        job,
        property,
      });
    });

    const entries = Array.from(groupedStops.entries()).map(([techId, stops]) => {
      const tech = techs.find((person) => person.id === techId);
      return {
        techId,
        techOrder: tech ? (tech.role === 'OWNER' ? 0 : 1) : 2,
        techName: tech ? `${tech.firstName || 'Tech'} ${tech.lastName || ''}`.trim() : 'Unassigned',
        color: techId === 'UNASSIGNED' ? '#94a3b8' : routeColorMap[techId] || '#94a3b8',
        stops: stops.map((stop, index) => ({
          ...stop,
          displayOrder: index + 1,
        })),
      };
    });

    return entries.sort((a, b) => {
      if (a.techOrder !== b.techOrder) return a.techOrder - b.techOrder;
      return a.techName.localeCompare(b.techName);
    });
  }, [dayOrder, allProperties, routeColorMap, techs]);

  const routeStops = useMemo(() => (
    routeStopGroups.flatMap((group) => group.stops)
  ), [routeStopGroups]);

  // A stable key representing the current stops + their order - used as the
  // effect dependency instead of the routeStops array itself, since a new
  // array reference on every render would otherwise refetch constantly.
  const routeStopsKey = routeStops
    .map((s) => `${s.job.id}:${s.property.latitude},${s.property.longitude}:${s.displayOrder}`)
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

  const getAssignmentColor = (job) => {
    if (!job?.defaultTechId) return '#94a3b8';
    return routeColorMap[job.defaultTechId] || '#94a3b8';
  };

  const getAssignmentLabel = (job) => {
    if (!job?.defaultTechId) return 'Unassigned';
    const tech = techs.find((person) => person.id === job.defaultTechId);
    if (!tech) return 'Assigned';
    if (tech.role === 'OWNER') return 'Owner';
    return `${tech.firstName || 'Tech'} ${tech.lastName || ''}`.trim();
  };

  const activeRouteTechName = useMemo(() => {
    if (routeFilter === 'ALL') return 'All assignments';
    const match = routeFilterOptions.find((option) => option.id === routeFilter);
    return match?.label || 'Selected person';
  }, [routeFilter, routeFilterOptions]);

  const groupedDayOrder = useMemo(() => {
    if (routeFilter !== 'ALL') {
      return [{
        techId: routeFilter,
        label: activeRouteTechName,
        color: routeColorMap[routeFilter] || '#4f46e5',
        jobs: dayOrder,
      }];
    }

    const groups = new Map();
    dayOrder.forEach((job) => {
      const techId = job.defaultTechId || 'UNASSIGNED';
      if (!groups.has(techId)) {
        const tech = techs.find((person) => person.id === techId);
        groups.set(techId, {
          techId,
          label: techId === 'UNASSIGNED'
            ? 'Unassigned'
            : tech?.role === 'OWNER'
              ? 'Owner'
              : `${tech?.firstName || 'Tech'} ${tech?.lastName || ''}`.trim(),
          color: techId === 'UNASSIGNED' ? '#94a3b8' : routeColorMap[techId] || '#94a3b8',
          jobs: [],
        });
      }
      groups.get(techId).jobs.push(job);
    });

    return Array.from(groups.values()).sort((a, b) => {
      const aOrder = a.techId === 'UNASSIGNED' ? 2 : (techs.find((person) => person.id === a.techId)?.role === 'OWNER' ? 0 : 1);
      const bOrder = b.techId === 'UNASSIGNED' ? 2 : (techs.find((person) => person.id === b.techId)?.role === 'OWNER' ? 0 : 1);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.label.localeCompare(b.label);
    });
  }, [routeFilter, activeRouteTechName, routeColorMap, techs, dayOrder]);

  const techRouteStatus = useMemo(() => {
    const today = new Date();
    const routeWeekStart = new Date(today);
    routeWeekStart.setDate(today.getDate() - today.getDay());
    const selectedRouteDate = new Date(routeWeekStart);
    selectedRouteDate.setDate(routeWeekStart.getDate() + selectedDay);
    const selectedRouteDateKey = selectedRouteDate.toISOString().slice(0, 10);

    const entries = techs
      .filter((tech) => tech.role === 'TECH')
      .map((tech) => {
        const techJobs = jobs
          .filter((job) => job.dayOfWeek === selectedDay && job.defaultTechId === tech.id)
          .map((job) => {
            const property = allProperties.find((p) => p.id === job.propertyId);
            const customer = customers.find((c) => c.id === job.customerId);
            const visit = visits.find((v) =>
              v.jobId === job.id && v.scheduledDate?.slice(0, 10) === selectedRouteDateKey
            );

            return {
              job,
              property,
              customer,
              visit,
              occurrenceDate: selectedRouteDateKey,
              status: visit?.status || 'SCHEDULED',
              notes: visit?.notes || job.notes || 'No notes recorded',
            };
          });

        return {
          tech,
          jobs: techJobs,
        };
      })
      .filter((entry) => entry.jobs.length > 0);

    return entries;
  }, [jobs, visits, techs, selectedDay, allProperties, customers]);

  const handleRescheduleVisit = async (visit, jobId, fallbackDate) => {
    if (!visit || reschedulingId === visit.id) return;
    const scheduledDate = rescheduleDates[jobId] || fallbackDate;
    setReschedulingId(visit.id);
    setOrderError(null);
    try {
      await rescheduleVisitMutation.mutateAsync({ id: visit.id, data: { scheduledDate } });
      setRescheduleDates((current) => ({ ...current, [jobId]: '' }));
    } catch (error) {
      console.error("Error rescheduling visit:", error);
      setOrderError(error?.response?.data?.error || "Couldn't reschedule that visit. Please try again.");
    } finally {
      setReschedulingId(null);
    }
  };
 
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 [&>section]:order-2 [&>div]:order-2">
 
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Routes</h1>
            <p className="mt-1 text-sm text-slate-500">
              Each day of the week has its own independent route - order jobs separately for each day.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add route job
          </button>
        </header>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Route for</label>
              <select
                value={routeFilter}
                onChange={(event) => setRouteFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {routeFilterOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700 font-medium">
              Showing: {activeRouteTechName}
            </div>
          </div>
        </div>
 
        {/* Day tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 shadow-sm p-1.5">
          {WORK_DAYS.map((day) => {
            const count = jobs.filter((j) => {
              if (j.dayOfWeek !== day.value) return false;
              if (routeFilter === 'ALL') return true;
              return j.defaultTechId === routeFilter;
            }).length;
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
                    ? `No jobs assigned to ${activeRouteTechName.toLowerCase()} for ${selectedDayLabel} yet.`
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
              {routeFilter !== 'ALL' && polylinePositions.length > 1 && (
                <Polyline positions={polylinePositions} pathOptions={{ color: "#4f46e5", weight: 3 }} />
              )}
              {routeFilter === 'ALL'
                ? routeStopGroups.map((group) => (
                    <Polyline
                      key={group.techId || 'unassigned'}
                      positions={group.stops.map((stop) => [stop.property.latitude, stop.property.longitude])}
                      pathOptions={{ color: group.color, weight: 3 }}
                    />
                  ))
                : routeStopGroups.length > 0 && routeStopGroups[0].stops.length > 1 && (
                    <Polyline
                      positions={routeStopGroups[0].stops.map((stop) => [stop.property.latitude, stop.property.longitude])}
                      pathOptions={{ color: routeStopGroups[0].color, weight: 3 }}
                    />
                  )
              }
              {routeStops.map((stop) => {
                const markerNumber = stop.displayOrder ?? 1;
                return (
                  <Marker
                    key={stop.job.id}
                    position={[stop.property.latitude, stop.property.longitude]}
                    icon={createNumberedIcon(markerNumber, getAssignmentColor(stop.job))}
                  >
                    <Popup>
                      <p className="font-medium">{markerNumber}. {stop.job.title}</p>
                      <p className="text-sm text-slate-500">{stop.property.address}</p>
                      {travelLegs[routeStops.findIndex((entry) => entry.job.id === stop.job.id)] && (
                        <p className="text-xs text-indigo-600 mt-1">
                          ~{travelLegs[routeStops.findIndex((entry) => entry.job.id === stop.job.id)].durationMin} min / {travelLegs[routeStops.findIndex((entry) => entry.job.id === stop.job.id)].distanceMi} mi to next stop
                        </p>
                      )}
                    </Popup>
                  </Marker>
                );
              })}
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
            {routeFilter !== 'ALL' && dayOrder.length > 1 && (
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
            <div className="divide-y divide-slate-100">
              {groupedDayOrder.map((group) => (
                <div key={group.techId || 'unassigned'} className="px-4 py-3">
                  {routeFilter === 'ALL' && (
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className="inline-flex h-3 w-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {group.label}
                      </span>
                    </div>
                  )}

                  <ul className="divide-y divide-slate-100">
                    {group.jobs.map((job, index) => {
                      const customer = customers.find(c => c.id === job.customerId);
                      const property = allProperties.find(p => p.id === job.propertyId);
                      const tech = techs.find(t => t.id === job.defaultTechId);
                      const assignmentColor = getAssignmentColor(job);
                      const assignmentLabel = getAssignmentLabel(job);
                      const stopIndex = routeStops.findIndex((s) => s.job.id === job.id);
                      const legToNext = stopIndex !== -1 ? travelLegs[stopIndex] : null;
                      const groupIndex = group.jobs.findIndex((entry) => entry.id === job.id) + 1;

                      return (
                        <li key={job.id}>
                          <div
                            className="px-1 py-4 flex items-center gap-3 border-l-4"
                            style={{
                              borderLeftColor: assignmentColor,
                              backgroundColor: routeFilter === 'ALL' ? 'rgba(148, 163, 184, 0.04)' : 'transparent',
                            }}
                          >
                            {routeFilter !== 'ALL' && (
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
                            )}

                            <span className="h-6 w-6 shrink-0 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                              {groupIndex}
                            </span>

                            <div
                              onClick={() => setEditingJob(job)}
                              className="min-w-0 flex-1 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {job.title}
                                </p>
                                {routeFilter === 'ALL' && (
                                  <span
                                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                                    style={{ backgroundColor: assignmentColor }}
                                  >
                                    {assignmentLabel}
                                  </span>
                                )}
                              </div>
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

                          {routeFilter !== 'ALL' && legToNext && (
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
                </div>
              ))}
            </div>
          )}
        </section>
 
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-medium text-slate-900">Tech route status</h2>
          </div>

          {techRouteStatus.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-500">
              No assigned work for techs on {selectedDayLabel} yet.
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {techRouteStatus.map(({ tech, jobs: techJobs }) => (
                <div key={tech.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {tech.firstName} {tech.lastName || ''}
                    </h3>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                      {techJobs.length} stops
                    </span>
                  </div>

                  <div className="space-y-3">
                    {techJobs.map(({ job, property, customer, visit, occurrenceDate, status, notes }) => (
                      <div key={job.id} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">{job.title}</p>
                            <p className="text-xs text-slate-500">
                              {customer ? `${customer.firstName} ${customer.lastName}` : '—'} • {property?.address || '—'}
                            </p>
                          </div>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : status === 'IN_PROGRESS'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-200 text-slate-600'
                          }`}>
                            {status}
                          </span>
                        </div>

                        <div className="mt-2 rounded-md bg-slate-50 p-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                          <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{notes}</p>
                        </div>

                        {visit && ['SKIPPED', 'CANCELLED'].includes(status) && (
                          <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                            <label className="text-xs font-medium text-slate-500">
                              Reschedule date
                              <input
                                type="date"
                                value={rescheduleDates[job.id] ?? ''}
                                onChange={(event) => setRescheduleDates((current) => ({ ...current, [job.id]: event.target.value }))}
                                className="mt-1 block rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-normal text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRescheduleVisit(visit, job.id, occurrenceDate)}
                              disabled={reschedulingId === visit.id || !(rescheduleDates[job.id] || occurrenceDate)}
                              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {reschedulingId === visit.id ? 'Rescheduling...' : 'Reschedule'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {editingJob && (
          <JobEditModal
            job={editingJob}
            techs={techs}
            onClose={() => setEditingJob(null)}
            onSaved={(updatedJob) => {
              setEditingJob(null);
            }}
          />
        )}
 
        {/* Create job form */}
        {showAddForm && <section className="order-1! bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
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
              onClick={() => setShowAddForm(false)}
              disabled={submitting}
              className="mr-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
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
        </section>}
 
      </div>
    </div>
  )
}
 
export default Route
