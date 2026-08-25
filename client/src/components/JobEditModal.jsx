import React, { useState } from 'react';
import { updatejob } from '../services/jobService';
import FormField from './FormField';
import Spinner from './Spinner';
 
const JOB_TYPES = [
  { value: "RECURRING_CLEANING", label: "Recurring Cleaning" },
  { value: "ONE_TIME_SERVICE", label: "One-Time Service" },
  { value: "REPAIR", label: "Repair" },
  { value: "CHEMICAL_BALANCE", label: "Chemical Balance" },
];
 
const FREQUENCIES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Biweekly" },
  { value: "MONTHLY", label: "Monthly" },
];
 
const STATUSES = ["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"];
 
const WORK_DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
];
 
const selectClasses = (error) =>
  `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
    error ? "border-red-400" : "border-slate-300"
  }`;
 
const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};
 
// A popup for editing a job in place - including moving it to a different
// day's route - without navigating to a separate details page.
const JobEditModal = ({ job, techs = [], onClose, onSaved }) => {
  const [title, setTitle] = useState(job.title || "");
  const [jobType, setJobType] = useState(job.jobType || "RECURRING_CLEANING");
  const [frequency, setFrequency] = useState(job.frequency || "WEEKLY");
  const [status, setStatus] = useState(job.status || "ACTIVE");
  const [dayOfWeek, setDayOfWeek] = useState(job.dayOfWeek ?? 1);
  const [defaultTechId, setDefaultTechId] = useState(job.defaultTechId || "");
  const [startDate, setStartDate] = useState(toDateInputValue(job.startDate));
  const [endDate, setEndDate] = useState(toDateInputValue(job.endDate));
  const [price, setPrice] = useState(job.price != null ? String(job.price) : "");
  const [notes, setNotes] = useState(job.notes || "");
 
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
 
  const originalDay = job.dayOfWeek;
  const dayChanged = dayOfWeek !== originalDay;
 
  const handleSave = async () => {
    if (saving) return;
 
    if (!title.trim() || !startDate) {
      setErrors({
        title: !title.trim() ? ["Title is required"] : undefined,
        startDate: !startDate ? ["Start date is required"] : undefined,
      });
      return;
    }
 
    setErrors({});
    setSaveError(null);
 
    const payload = {
      title: title.trim(),
      jobType,
      frequency: jobType === "RECURRING_CLEANING" ? frequency : undefined,
      status,
      dayOfWeek,
      defaultTechId: defaultTechId || undefined,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      price: price ? Number(price) : undefined,
      notes: notes || undefined,
    };
 
    try {
      setSaving(true);
      await updatejob(job.id, payload);
      onSaved({ ...job, ...payload });
    } catch (error) {
      console.error("Error updating job:", error);
      setSaveError("Couldn't save those changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };
 
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4">
      {/* z-[2000] instead of z-50: Leaflet's own panes/zoom controls use
          z-index up to 1000, which would otherwise render on top of this
          modal despite it being "later" in the DOM. */}
      <div className="absolute inset-0 bg-slate-900/40" onClick={() => !saving && onClose()} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Edit job</h3>
          <button
            onClick={() => !saving && onClose()}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
 
        <div className="p-6 space-y-5">
          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {saveError}
            </div>
          )}
 
          <FormField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
          />
 
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Day of week</label>
            <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className={selectClasses()}>
              {WORK_DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            {dayChanged && (
              <p className="mt-1 text-xs text-indigo-600">
                This will move the job to {WORK_DAYS.find((d) => d.value === dayOfWeek)?.label}'s route.
              </p>
            )}
          </div>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job type</label>
              <select value={jobType} onChange={(e) => setJobType(e.target.value)} className={selectClasses()}>
                {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
 
            {jobType === "RECURRING_CLEANING" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={selectClasses()}>
                  {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            )}
 
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClasses()}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
 
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned tech</label>
              <select value={defaultTechId} onChange={(e) => setDefaultTechId(e.target.value)} className={selectClasses()}>
                <option value="">Unassigned</option>
                {techs.map((t) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
              </select>
            </div>
 
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={selectClasses(errors.startDate)}
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate[0]}</p>}
            </div>
 
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={selectClasses()}
              />
            </div>
 
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={selectClasses()}
              />
            </div>
          </div>
 
          <FormField
            as="textarea"
            rows={3}
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
 
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
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
    </div>
  );
};
 
export default JobEditModal;
