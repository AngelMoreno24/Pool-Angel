import React, { useState, useEffect, useMemo } from 'react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getjob, createjob } from '../services/jobService';
import { getCustomers } from '../services/customerService';
import { getPropertiesByCustomer } from '../services/propertyService';
import { getTechs } from '../services/techService';
import FormField from '../components/FormField';
import Spinner from '../components/Spinner';
 
const JOB_TYPE_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "RECURRING_CLEANING", label: "Recurring Cleaning" },
  { value: "ONE_TIME_SERVICE", label: "One-Time Service" },
  { value: "REPAIR", label: "Repair" },
  { value: "CHEMICAL_BALANCE", label: "Chemical Balance" },
];

const JOB_TYPE_STYLES = {
  RECURRING_CLEANING: { label: "Cleaning", classes: "bg-sky-100 text-sky-700" },
  ONE_TIME_SERVICE: { label: "One-time service", classes: "bg-violet-100 text-violet-700" },
  REPAIR: { label: "Repair", classes: "bg-orange-100 text-orange-700" },
  CHEMICAL_BALANCE: { label: "Chemical balance", classes: "bg-cyan-100 text-cyan-700" },
};
 
const FREQUENCY_FILTERS = [
  { value: "ALL", label: "Any frequency" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Biweekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "ONE_TIME", label: "One-time" },
];

const FREQUENCY_STYLES = {
  WEEKLY: { label: "Weekly", classes: "bg-indigo-100 text-indigo-700" },
  BIWEEKLY: { label: "Biweekly", classes: "bg-amber-100 text-amber-700" },
  MONTHLY: { label: "Monthly", classes: "bg-emerald-100 text-emerald-700" },
  ONE_TIME: { label: "One-time", classes: "bg-rose-100 text-rose-700" },
};
 
const STATUS_FILTERS = [
  { value: "ALL", label: "Any status" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];
 
const Job = () => {
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
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
 
  // Filters for the jobs list - independent of the create-job form's own
  // jobType/frequency/status state above.
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [frequencyFilter, setFrequencyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
 
  const navigate = useNavigate();
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobsResponse, customersResponse, techsResponse] = await Promise.all([
          getjob(),
          getCustomers(),
          getTechs()
        ]);
        setJobs(Array.isArray(jobsResponse) ? jobsResponse : jobsResponse?.data || []);
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
    } catch (error) {
      console.error("Error creating job:", error);
      setSubmitError("Couldn't create that job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
 
  // Job counts per type - shown as badges on the filter pills so it's
  // obvious at a glance how many jobs fall in each category.
  const typeCounts = useMemo(() => {
    const counts = { ALL: jobs.length };
    for (const filter of JOB_TYPE_FILTERS) {
      if (filter.value === "ALL") continue;
      counts[filter.value] = jobs.filter((j) => j.jobType === filter.value).length;
    }
    return counts;
  }, [jobs]);
 
  const filteredJobs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return jobs.filter((job) => {
      if (typeFilter !== "ALL" && job.jobType !== typeFilter) return false;
      if (frequencyFilter !== "ALL" && job.frequency !== frequencyFilter) return false;
      if (statusFilter !== "ALL" && (job.status || "ACTIVE") !== statusFilter) return false;
 
      if (term) {
        const customer = customers.find(c => c.id === job.customerId);
        const property = allProperties.find(p => p.id === job.propertyId);
        const haystack = [
          job.title,
          customer ? `${customer.firstName} ${customer.lastName}` : "",
          property?.address || "",
        ].join(" ").toLowerCase();
        if (!haystack.includes(term)) return false;
      }
 
      return true;
    });
  }, [jobs, typeFilter, frequencyFilter, statusFilter, searchTerm, customers, allProperties]);
 
  const hasActiveFilters = typeFilter !== "ALL" || frequencyFilter !== "ALL" || statusFilter !== "ALL" || searchTerm.trim() !== "";
 
  const clearFilters = () => {
    setTypeFilter("ALL");
    setFrequencyFilter("ALL");
    setStatusFilter("ALL");
    setSearchTerm("");
  };
 
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 [&>section]:order-2 [&>div]:order-2">
 
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
            <p className="mt-1 text-sm text-slate-500">
              View all jobs or create a new one.
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
            Add job
          </button>
        </header>
 
        {/* Filters */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {JOB_TYPE_FILTERS.map((filter) => {
              const isActive = typeFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  onClick={() => setTypeFilter(filter.value)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter.label}
                  <span className={`ml-1.5 text-xs ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {typeCounts[filter.value] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
 
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[180px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, customer, or address..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
 
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {FREQUENCY_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
 
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
 
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>
 
        {/* Jobs list */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-medium text-slate-900">
                {hasActiveFilters ? "Filtered jobs" : "All jobs"} {!loading && (
                  <span className="text-slate-400 font-normal">
                    ({filteredJobs.length}{hasActiveFilters ? ` of ${jobs.length}` : ""})
                  </span>
                )}
              </h2>
              <div className="flex flex-wrap items-center gap-2" aria-label="Frequency legend">
                {Object.entries(FREQUENCY_STYLES).map(([value, style]) => (
                  <span key={value} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${style.classes}`}>
                    {style.label}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2" aria-label="Job type legend">
                {Object.entries(JOB_TYPE_STYLES).map(([value, style]) => (
                  <span key={value} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${style.classes}`}>
                    {style.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
 
          {loading ? (
            <ul className="divide-y divide-slate-100">
              {[...Array(3)].map((_, i) => (
                <li key={i} className="px-5 py-4 flex items-center gap-3 animate-pulse">
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                </li>
              ))}
            </ul>
          ) : jobs.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-500">No jobs yet.</p>
              <p className="text-sm text-slate-400 mt-1">Use Add job to create one.</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-500">No jobs match these filters.</p>
              <button onClick={clearFilters} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 mt-1">
                Clear filters
              </button>
            </div>
          ) : (
            <div>
              <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1.4fr)_minmax(7rem,1fr)_minmax(7rem,1fr)_auto_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 lg:grid">
                <span>Job</span>
                <span>Customer / property</span>
                <span>Schedule</span>
                <span>Assigned tech</span>
                <span>Status</span>
                <span aria-hidden="true" />
              </div>
              <ul className="divide-y divide-slate-100">
                {filteredJobs.map((job) => {
                  const customer = customers.find(c => c.id === job.customerId);
                  const property = allProperties.find(p => p.id === job.propertyId);
                  const tech = techs.find(t => t.id === job.defaultTechId);
                  return (
                    <li
                      key={job.id}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') navigate(`/jobs/${job.id}`);
                      }}
                      role="button"
                      tabIndex={0}
                      className="grid cursor-pointer gap-3 px-5 py-4 transition-colors hover:bg-slate-50 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.4fr)_minmax(7rem,1fr)_minmax(7rem,1fr)_auto_auto] lg:items-center lg:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Job</p>
                        <p className="mt-0.5 truncate text-sm font-medium text-slate-900">{job.title}</p>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${JOB_TYPE_STYLES[job.jobType]?.classes || 'bg-slate-100 text-slate-600'}`}>
                          {JOB_TYPE_STYLES[job.jobType]?.label || job.jobType || 'Unknown type'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Customer / property</p>
                        <p className="mt-0.5 truncate text-sm text-slate-700">{customer ? `${customer.firstName} ${customer.lastName}` : '—'}</p>
                        <p className="truncate text-xs text-slate-500">{property?.address || 'No property'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Schedule</p>
                        <span className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${FREQUENCY_STYLES[job.frequency]?.classes || 'bg-slate-100 text-slate-600'}`}>
                          {FREQUENCY_STYLES[job.frequency]?.label || 'One time'}
                        </span>
                        <p className="text-xs text-slate-500">{job.startDate ? new Date(job.startDate).toLocaleDateString() : 'No date'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Assigned tech</p>
                        <p className="mt-0.5 truncate text-sm text-slate-700">{tech ? `${tech.firstName} ${tech.lastName || ''}`.trim() : 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Status</p>
                        <span className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">{job.status || 'ACTIVE'}</span>
                      </div>
                      <svg className="hidden h-4 w-4 self-center text-slate-300 lg:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
 
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
              placeholder="Weekly cleaning"
              error={fieldErrors.title}
            />
            
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Customer</label>
              <select
                value={customerId}
                onChange={(e) => { setCustomerId(e.target.value); clearFieldError("customerId"); setPropertyId(""); }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </select>
              {fieldErrors.customerId && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.customerId[0]}</p>
              )}
            </div>
 
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Property</label>
              <select
                value={propertyId}
                onChange={(e) => { setPropertyId(e.target.value); clearFieldError("propertyId"); }}
                disabled={!customerId}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">Select a property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.address}
                  </option>
                ))}
              </select>
              {fieldErrors.propertyId && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.propertyId[0]}</p>
              )}
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
 
            <FormField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); clearFieldError("startDate"); }}
              error={fieldErrors.startDate}
            />
 
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
 
export default Job
