import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getPropertyById, updateProperty, deleteProperty } from '../services/propertyService';
import { createPool, getPoolByProperty, updatePool, deletePool } from '../services/poolService';
import { propertySchema } from '../schemas/propertySchema';
import { poolSchema } from '../schemas/poolSchema';
 
const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
 
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [propertyErrors, setPropertyErrors] = useState({});
 
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
 
  // Pool
  const [pool, setPool] = useState(null);
  const [poolLoading, setPoolLoading] = useState(true);
  const [poolError, setPoolError] = useState(null);
  const [isEditingPool, setIsEditingPool] = useState(false);
  const [showAddPool, setShowAddPool] = useState(false);
  const [savingPool, setSavingPool] = useState(false);
  const [poolTypeField, setPoolTypeField] = useState("");
  const [poolSize, setPoolSize] = useState("");
  const [poolNotes, setPoolNotes] = useState("");
  const [showDeletePoolConfirm, setShowDeletePoolConfirm] = useState(false);
  const [deletingPool, setDeletingPool] = useState(false);
  const [poolErrors, setPoolErrors] = useState({});
 
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await getPropertyById(id);
        setProperty(response);
        setAddress(response.address || "");
        setCity(response.city || "");
        setState(response.state || "");
        setZipCode(response.zipCode || "");
      } catch (error) {
        console.error("Error fetching property:", error);
        setError("Couldn't load this property.");
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [id]);
 
  useEffect(() => {
    const fetchPool = async () => {
      try {
        setPoolLoading(true);
        const response = await getPoolByProperty(id);
        setPool(response || null);
        if (response) {
          setPoolTypeField(response.type || "");
          setPoolSize(response.size || "");
          setPoolNotes(response.notes || "");
        }
      } catch (error) {
        // A property with no pool yet commonly 404s - that's not a real error
        if (error?.response?.status === 404) {
          setPool(null);
        } else {
          console.error("Error fetching pool:", error);
          setPoolError("Couldn't load pool info for this property.");
        }
      } finally {
        setPoolLoading(false);
      }
    }
    fetchPool();
  }, [id]);
 
  const isFormValid = address.trim();
 
  const startEditing = () => {
    setError(null);
    setPropertyErrors({});
    setIsEditing(true);
  };
 
  const cancelEditing = () => {
    setAddress(property.address || "");
    setCity(property.city || "");
    setState(property.state || "");
    setZipCode(property.zipCode || "");
    setPropertyErrors({});
    setIsEditing(false);
  };
 
  const handleSave = async () => {
    if (saving) return;

    const validation = propertySchema.safeParse({
      customerId: property?.customerId || "",
      address,
      city,
      state,
      zip: zipCode,
    });

    if (!validation.success) {
      setPropertyErrors(validation.error.flatten().fieldErrors);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setPropertyErrors({});
      const response = await updateProperty(id, { address, city, state, zipCode: zipCode });
      console.log("Update property response:", response);
      // Handle APIs that wrap the updated record, e.g. { data: {...} } or { property: {...} }
      const updated = response?.address
        ? response
        : response?.data?.address
          ? response.data
          : response?.property?.address
            ? response.property
            : null;
      if (updated) {
        setProperty(updated);
      } else {
        // Fall back to merging the form values we know were saved, rather than showing blanks
        setProperty((prev) => ({ ...prev, address, city, state, zipCode }));
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating property:", error);
      setError("Couldn't save those changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };
 
  const isPoolFormValid = poolTypeField.trim() || poolSize.trim();
 
  const resetPoolForm = () => {
    setPoolTypeField(pool?.type || "");
    setPoolSize(pool?.size || "");
    setPoolNotes(pool?.notes || "");
    setPoolErrors({});
  };
 
  const handleCreatePool = async () => {
    if (savingPool) return;

    const validation = poolSchema.safeParse({
      propertyId: id,
      type: poolTypeField,
      size: poolSize,
      notes: poolNotes,
    });

    if (!validation.success) {
      setPoolErrors(validation.error.flatten().fieldErrors);
      return;
    }

    try {
      setSavingPool(true);
      setPoolError(null);
      setPoolErrors({});
      const response = await createPool(validation.data);
      setPool(response);
      setShowAddPool(false);
    } catch (error) {
      console.error("Error creating pool:", error);
      setPoolError("Couldn't add pool info. Please try again.");
    } finally {
      setSavingPool(false);
    }
  };
 
  const startEditingPool = () => {
    setPoolError(null);
    setPoolErrors({});
    setPoolTypeField(pool.type || "");
    setPoolSize(pool.size || "");
    setPoolNotes(pool.notes || "");
    setIsEditingPool(true);
  };
 
  const cancelEditingPool = () => {
    resetPoolForm();
    setIsEditingPool(false);
  };
 
  const handleSavePool = async () => {
    if (savingPool) return;

    const validation = poolSchema.safeParse({
      propertyId: id,
      type: poolTypeField,
      size: poolSize,
      notes: poolNotes,
    });

    if (!validation.success) {
      setPoolErrors(validation.error.flatten().fieldErrors);
      return;
    }

    try {
      setSavingPool(true);
      setPoolError(null);
      setPoolErrors({});
      const response = await updatePool(pool.id, validation.data);
      // Guard against a wrapped response, same pattern as property/customer saves
      const updated = response?.id ? response : response?.data?.id ? response.data : null;
      if (updated) {
        setPool(updated);
      } else {
        setPool((prev) => ({ ...prev, type: poolTypeField, size: poolSize, notes: poolNotes }));
      }
      setIsEditingPool(false);
    } catch (error) {
      console.error("Error updating pool:", error);
      setPoolError("Couldn't save pool changes. Please try again.");
    } finally {
      setSavingPool(false);
    }
  };
 
  const handleDeletePool = async () => {
    try {
      setDeletingPool(true);
      setPoolError(null);
      await deletePool(pool.id);
      setPool(null);
      setPoolTypeField("");
      setPoolSize("");
      setPoolNotes("");
      setShowDeletePoolConfirm(false);
    } catch (error) {
      console.error("Error deleting pool:", error);
      setPoolError("Couldn't delete pool info. Please try again.");
    } finally {
      setDeletingPool(false);
    }
  };
 
  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      await deleteProperty(id);
      if (property?.customerId) {
        navigate(`/customers/${property.customerId}`);
      } else {
        navigate("/customers");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      setError("Couldn't delete this property. Please try again.");
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
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-lg bg-slate-200" />
              <div className="space-y-2">
                <div className="h-4 w-48 bg-slate-200 rounded" />
                <div className="h-3 w-32 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
 
  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <p className="text-sm text-slate-500">
            {error || "This property couldn't be found."}
          </p>
          <button
            onClick={() => navigate("/customers")}
            className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to customers
          </button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
 
        {property.customerId ? (
          <Link
            to={`/customers/${property.customerId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to customer
          </Link>
        ) : (
          <button
            onClick={() => navigate("/customers")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to customers
          </button>
        )}
 
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
 
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
 
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-14 w-14 shrink-0 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-slate-900 truncate">
                  {property.address || "Untitled property"}
                </h1>
                <p className="text-sm text-slate-500 truncate">
                  {[property.city, property.state, property.zipCode].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
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
                  aria-label="Delete property"
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
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Address</dt>
                  <dd className="mt-1 text-sm text-slate-900">{property.address || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">City</dt>
                  <dd className="mt-1 text-sm text-slate-900">{property.city || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">State</dt>
                  <dd className="mt-1 text-sm text-slate-900">{property.state || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">ZIP</dt>
                  <dd className="mt-1 text-sm text-slate-900">{property.zipCode || "—"}</dd>
                </div>
              </dl>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${propertyErrors.address ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    {propertyErrors.address && (
                      <p className="mt-1 text-sm text-red-600">{propertyErrors.address[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${propertyErrors.city ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    {propertyErrors.city && (
                      <p className="mt-1 text-sm text-red-600">{propertyErrors.city[0]}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${propertyErrors.state ? 'border-red-400' : 'border-slate-300'}`}
                      />
                      {propertyErrors.state && (
                        <p className="mt-1 text-sm text-red-600">{propertyErrors.state[0]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">ZIP</label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${propertyErrors.zip ? 'border-red-400' : 'border-slate-300'}`}
                      />
                      {propertyErrors.zip && (
                        <p className="mt-1 text-sm text-red-600">{propertyErrors.zip[0]}</p>
                      )}
                    </div>
                  </div>
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
                    disabled={!isFormValid || saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving && (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
 
        {/* Pool section */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-900">Pool</h2>
            {!poolLoading && !pool && !showAddPool && (
              <button
                onClick={() => setShowAddPool(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add pool
              </button>
            )}
            {pool && !isEditingPool && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={startEditingPool}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => setShowDeletePoolConfirm(true)}
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
 
          {poolError && (
            <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {poolError}
            </div>
          )}
 
          <div className="p-6">
            {poolLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-4 w-48 bg-slate-200 rounded" />
              </div>
            ) : !pool && !showAddPool ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500">No pool info on file yet.</p>
                <p className="text-sm text-slate-400 mt-1">Add the pool's type, size, and any notes.</p>
              </div>
            ) : showAddPool ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <input
                      type="text"
                      value={poolTypeField}
                      onChange={(e) => setPoolTypeField(e.target.value)}
                      placeholder="Gunite, vinyl, fiberglass..."
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${poolErrors.type ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    {poolErrors.type && (
                      <p className="mt-1 text-sm text-red-600">{poolErrors.type[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Size</label>
                    <input
                      type="text"
                      value={poolSize}
                      onChange={(e) => setPoolSize(e.target.value)}
                      placeholder="e.g. 15,000 gal"
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${poolErrors.size ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    {poolErrors.size && (
                      <p className="mt-1 text-sm text-red-600">{poolErrors.size[0]}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                    <textarea
                      value={poolNotes}
                      onChange={(e) => setPoolNotes(e.target.value)}
                      rows={3}
                      placeholder="Equipment, access details, anything worth flagging"
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${poolErrors.notes ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    {poolErrors.notes && (
                      <p className="mt-1 text-sm text-red-600">{poolErrors.notes[0]}</p>
                    )}
                  </div>
                </div>
 
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowAddPool(false);
                      resetPoolForm();
                    }}
                    disabled={savingPool}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePool}
                    disabled={!isPoolFormValid || savingPool}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingPool && (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                    {savingPool ? "Adding..." : "Add pool"}
                  </button>
                </div>
              </div>
            ) : !isEditingPool ? (
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
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <input
                      type="text"
                      value={poolTypeField}
                      onChange={(e) => setPoolTypeField(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${poolErrors.type ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    {poolErrors.type && (
                      <p className="mt-1 text-sm text-red-600">{poolErrors.type[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Size</label>
                    <input
                      type="text"
                      value={poolSize}
                      onChange={(e) => setPoolSize(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${poolErrors.size ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    {poolErrors.size && (
                      <p className="mt-1 text-sm text-red-600">{poolErrors.size[0]}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                    <textarea
                      value={poolNotes}
                      onChange={(e) => setPoolNotes(e.target.value)}
                      rows={3}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${poolErrors.notes ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    {poolErrors.notes && (
                      <p className="mt-1 text-sm text-red-600">{poolErrors.notes[0]}</p>
                    )}
                  </div>
                </div>
 
                <div className="flex justify-end gap-2">
                  <button
                    onClick={cancelEditingPool}
                    disabled={savingPool}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePool}
                    disabled={!isPoolFormValid || savingPool}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingPool && (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                    {savingPool ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
 
      {/* Delete pool confirmation modal */}
      {showDeletePoolConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => !deletingPool && setShowDeletePoolConfirm(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-semibold text-slate-900">Delete pool info?</h3>
            <p className="mt-2 text-sm text-slate-500">
              This can't be undone. The pool's type, size, and notes will be permanently removed.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowDeletePoolConfirm(false)}
                disabled={deletingPool}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePool}
                disabled={deletingPool}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {deletingPool && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {deletingPool ? "Deleting..." : "Delete pool"}
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-semibold text-slate-900">
              Delete {property.address || "this property"}?
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              This can't be undone. This property's record will be permanently removed.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {deleting && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {deleting ? "Deleting..." : "Delete property"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
 
export default PropertyDetails
