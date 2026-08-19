import React, { useState, useEffect } from 'react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getjob, createjob } from '../services/jobService';
import { getCustomers } from '../services/customerService';
import { getPropertiesByCustomer } from '../services/propertyService';
import { getTechs } from '../services/techService';
import FormField from '../components/FormField';
import Spinner from '../components/Spinner';

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

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
          <p className="mt-1 text-sm text-slate-500">
            View all jobs or create a new one.
          </p>
        </header>

        {/* Jobs list */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-medium text-slate-900">
              All jobs {!loading && (
                <span className="text-slate-400 font-normal">({jobs.length})</span>
              )}
            </h2>
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
              <p className="text-sm text-slate-400 mt-1">Create your first one below.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {jobs.map((job) => {
                const customer = customers.find(c => c.id === job.customerId);
                const property = allProperties.find(p => p.id === job.propertyId);
                const tech = techs.find(t => t.id === job.defaultTechId);
                return (
                <li
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="px-5 py-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {job.title}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {customer ? `${customer.firstName} ${customer.lastName}` : "—"} • {property?.address || "—"}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {job.frequency || "—"} • {job.jobType} • {tech ? `${tech.firstName} ${tech.lastName || ''}`.trim() : 'Unassigned'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                      {job.status || "ACTIVE"}
                    </span>
                    <svg
                      className="h-4 w-4 text-slate-300"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </section>

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

export default Job