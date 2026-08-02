import React, { useState, useEffect } from 'react';
import { createPool, getPoolByProperty, updatePool, deletePool } from '../services/poolService';
import { poolSchema } from '../schemas/poolSchema';
import FormField from './FormField';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Spinner from './Spinner';
 
const PoolSection = ({ propertyId }) => {
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  const [mode, setMode] = useState("view"); // "view" | "add" | "edit"
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
 
  const [type, setType] = useState("");
  const [size, setSize] = useState("");
  const [notes, setNotes] = useState("");
 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
 
  useEffect(() => {
    const fetchPool = async () => {
      try {
        setLoading(true);
        const response = await getPoolByProperty(propertyId);
        setPool(response || null);
        if (response) {
          setType(response.type || "");
          setSize(response.size || "");
          setNotes(response.notes || "");
        }
      } catch (err) {
        // A property with no pool yet commonly 404s - that's not a real error
        if (err?.response?.status === 404) {
          setPool(null);
        } else {
          console.error("Error fetching pool:", err);
          setError("Couldn't load pool info for this property.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPool();
  }, [propertyId]);
 
  const resetForm = () => {
    setType(pool?.type || "");
    setSize(pool?.size || "");
    setNotes(pool?.notes || "");
    setErrors({});
  };
 
  const startAdding = () => {
    setError(null);
    setMode("add");
  };
 
  const startEditing = () => {
    setError(null);
    setType(pool.type || "");
    setSize(pool.size || "");
    setNotes(pool.notes || "");
    setMode("edit");
  };
 
  const cancelForm = () => {
    resetForm();
    setMode("view");
  };
 
  // Shared by both create and update - same fields, same schema either way.
  const handleSubmit = async () => {
    if (saving) return;
 
    const validation = poolSchema.safeParse({ propertyId, type, size, notes });
    if (!validation.success) {
      setErrors(validation.error.flatten().fieldErrors);
      return;
    }
 
    try {
      setSaving(true);
      setError(null);
      setErrors({});
 
      if (mode === "add") {
        const response = await createPool(validation.data);
        setPool(response);
      } else {
        const response = await updatePool(pool.id, validation.data);
        const updated = response?.id ? response : response?.data?.id ? response.data : null;
        setPool(updated || { ...pool, type, size, notes });
      }
      setMode("view");
    } catch (err) {
      console.error(`Error ${mode === "add" ? "creating" : "updating"} pool:`, err);
      setError(`Couldn't ${mode === "add" ? "add" : "save"} pool info. Please try again.`);
    } finally {
      setSaving(false);
    }
  };
 
  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      await deletePool(pool.id);
      setPool(null);
      setType("");
      setSize("");
      setNotes("");
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error("Error deleting pool:", err);
      setError("Couldn't delete pool info. Please try again.");
    } finally {
      setDeleting(false);
    }
  };
 
  const isFormValid = type.trim() || size.trim();
  const showForm = mode === "add" || mode === "edit";
 
  return (
    <>
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900">Pool</h2>
 
          {!loading && !pool && mode === "view" && (
            <button
              onClick={startAdding}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add pool
            </button>
          )}
 
          {pool && mode === "view" && (
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
                aria-label="Delete pool"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
 
        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
 
        <div className="p-6">
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-4 w-48 bg-slate-200 rounded" />
            </div>
          ) : !pool && mode === "view" ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500">No pool info on file yet.</p>
              <p className="text-sm text-slate-400 mt-1">Add the pool's type, size, and any notes.</p>
            </div>
          ) : showForm ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  error={errors.type}
                  placeholder="Gunite, vinyl, fiberglass..."
                />
                <FormField
                  label="Size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  error={errors.size}
                  placeholder="e.g. 15,000 gal"
                />
                <FormField
                  className="sm:col-span-2"
                  as="textarea"
                  rows={3}
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  error={errors.notes}
                  placeholder="Equipment, access details, anything worth flagging"
                />
              </div>
 
              <div className="flex justify-end gap-2">
                <button
                  onClick={cancelForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid || saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving && <Spinner />}
                  {saving
                    ? (mode === "add" ? "Adding..." : "Saving...")
                    : (mode === "add" ? "Add pool" : "Save changes")}
                </button>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Type</dt>
                <dd className="mt-1 text-sm text-slate-900">{pool.type || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Size</dt>
                <dd className="mt-1 text-sm text-slate-900">{pool.size || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Notes</dt>
                <dd className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{pool.notes || "—"}</dd>
              </div>
            </dl>
          )}
        </div>
      </section>
 
      {showDeleteConfirm && (
        <ConfirmDeleteModal
          title="Delete pool info?"
          message="This can't be undone. The pool's type, size, and notes will be permanently removed."
          confirmLabel="Delete pool"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
};
 
export default PoolSection;
