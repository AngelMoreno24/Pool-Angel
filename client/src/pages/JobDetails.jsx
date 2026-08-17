import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { getjobById, updatejob, deletejob } from '../services/jobService';
import { getCustomers } from '../services/customerService';
import { getPropertiesByCustomer } from '../services/propertyService';
import FormField from '../components/FormField';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Spinner from '../components/Spinner';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jobErrors, setJobErrors] = useState({});

  const [title, setTitle] = useState("");
  const [jobType, setJobType] = useState("");
  const [frequency, setFrequency] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [propertyId, setPropertyId] = useState("");

  const [customers, setCustomers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [jobCustomer, setJobCustomer] = useState(null);
  const [jobProperty, setJobProperty] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await getjobById(id);
        setJob(response);
        setTitle(response.title || "");
        setJobType(response.jobType || "");
        setFrequency(response.frequency || "");
        setStatus(response.status || "ACTIVE");
        setStartDate(response.startDate?.split('T')[0] || "");
        setEndDate(response.endDate?.split('T')[0] || "");
        setPrice(response.price || "");
        setNotes(response.notes || "");
        setCustomerId(response.customerId || "");
        setPropertyId(response.propertyId || "");
      } catch (error) {
        console.error("Error fetching job:", error);
        setError("Couldn't load this job.");
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [id]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await getCustomers();
        const customersList = Array.isArray(response) ? response : response?.data || [];
        setCustomers(customersList);
        if (job && customerId) {
          const found = customersList.find(c => c.id === customerId);
          setJobCustomer(found || null);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    }
    fetchCustomers();
  }, [job, customerId]);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!customerId) {
        setProperties([]);
        setJobProperty(null);
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
        if (propertyId) {
          const found = list.find(p => p.id === propertyId);
          setJobProperty(found || null);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
      }
    }
    fetchProperties();
  }, [customerId, propertyId]);

  const startEditing = () => {
    setError(null);
    setJobErrors({});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setTitle(job.title || "");
    setJobType(job.jobType || "");
    setFrequency(job.frequency || "");
    setStatus(job.status || "ACTIVE");
    setStartDate(job.startDate?.split('T')[0] || "");
    setEndDate(job.endDate?.split('T')[0] || "");
    setPrice(job.price || "");
    setNotes(job.notes || "");
    setCustomerId(job.customerId || "");
    setPropertyId(job.propertyId || "");
    setJobErrors({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (saving) return;

    if (!title.trim() || !startDate) {
      setJobErrors({
        title: !title.trim() ? ["Title is required"] : undefined,
        startDate: !startDate ? ["Start date is required"] : undefined,
      });
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setJobErrors({});
      
      const jobData = {
        title: title.trim(),
        jobType,
        frequency,
        status,
        startDate: new Date(startDate),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(price && { price: parseFloat(price) }),
        ...(notes && { notes: notes.trim() }),
      };

      const response = await updatejob(id, jobData);
      const updated = response?.title ? response : response?.data?.title ? response.data : null;
      setJob(updated || { ...job, ...jobData });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating job:", error);
      setError("Couldn't save those changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      await deletejob(id);
      navigate("/jobs");
    } catch (error) {
      console.error("Error deleting job:", error);
      setError("Couldn't delete this job. Please try again.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-slate-200 rounded" />
                <div className="h-3 w-28 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <p className="text-sm text-slate-500">
            {error || "This job couldn't be found."}
          </p>
          <button
            onClick={() => navigate("/jobs")}
            className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">

        <button
          onClick={() => navigate("/jobs")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to jobs
        </button>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-slate-900 truncate">
                {job.title}
              </h1>
              <p className="text-sm text-slate-500 truncate">
                {jobCustomer ? `${jobCustomer.firstName} ${jobCustomer.lastName}` : "—"} • {jobProperty?.address || "—"}
              </p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{job.jobType}</p>
            </div>

            {!isEditing && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={startEditing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-300 text-slate-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors"
                  aria-label="Delete job"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Body: view or edit */}
          <div className="p-6">
            {!isEditing ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Title</dt>
                  <dd className="mt-1 text-sm text-slate-900">{job.title || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Customer</dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {jobCustomer ? `${jobCustomer.firstName} ${jobCustomer.lastName}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Property</dt>
                  <dd className="mt-1 text-sm text-slate-900">{jobProperty?.address || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Job Type</dt>
                  <dd className="mt-1 text-sm text-slate-900">{job.jobType || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Frequency</dt>
                  <dd className="mt-1 text-sm text-slate-900">{job.frequency || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                      {job.status || "ACTIVE"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Start Date</dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {job.startDate ? new Date(job.startDate).toLocaleDateString() : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">End Date</dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {job.endDate ? new Date(job.endDate).toLocaleDateString() : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Price</dt>
                  <dd className="mt-1 text-sm text-slate-900">${job.price || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Notes</dt>
                  <dd className="mt-1 text-sm text-slate-900">{job.notes || "—"}</dd>
                </div>
              </dl>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={jobErrors.title}
                  />
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
                      <option value="">Select frequency</option>
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
                  <FormField
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    error={jobErrors.startDate}
                  />
                  <FormField
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <FormField
                    label="Price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                  />
                  <FormField
                    label="Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={cancelEditing}
                    disabled={saving}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving && <Spinner />}
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {showDeleteConfirm && (
        <ConfirmDeleteModal
          title={`Delete "${job.title}"?`}
          message="This can't be undone. This job's record will be permanently removed."
          confirmLabel="Delete job"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}

export default JobDetails
