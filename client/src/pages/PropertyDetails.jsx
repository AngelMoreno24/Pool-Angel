import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDeleteProperty, useProperty, usePropertyVisits, useUpdateProperty } from '../hooks/useAppQueries';
import { propertySchema } from '../schemas/propertySchema';
import FormField from '../components/FormField';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import PoolSection from '../components/PoolSection';
import Spinner from '../components/Spinner';
 
const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
 
  const propertyQuery = useProperty(id);
  const property = propertyQuery.data;
  const visitsQuery = usePropertyVisits(id);
  const updatePropertyMutation = useUpdateProperty();
  const deletePropertyMutation = useDeleteProperty();
  const visits = visitsQuery.data || [];
  const loading = propertyQuery.isLoading;
  const [error, setError] = useState(null);
 
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
 
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const visitsLoading = visitsQuery.isLoading;
  const visitsError = visitsQuery.isError ? "Couldn't load visit history." : null;
 
  useEffect(() => {
    if (!property) return;
    setAddress(property.address || "");
    setCity(property.city || "");
    setState(property.state || "");
    setZipCode(property.zipCode || "");
  }, [property]);
 
  const startEditing = () => {
    setError(null);
    setErrors({});
    setIsEditing(true);
  };
 
  const cancelEditing = () => {
    setAddress(property.address || "");
    setCity(property.city || "");
    setState(property.state || "");
    setZipCode(property.zipCode || "");
    setErrors({});
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
      setErrors(validation.error.flatten().fieldErrors);
      return;
    }
 
    try {
      setSaving(true);
      setError(null);
      setErrors({});
      const response = await updatePropertyMutation.mutateAsync({ id, data: { address, city, state, zipCode } });
      // Handle APIs that wrap the updated record, e.g. { data: {...} } or { property: {...} }
      const updated = response?.address
        ? response
        : response?.data?.address
          ? response.data
          : response?.property?.address
            ? response.property
            : null;
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating property:", err);
      setError("Couldn't save those changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };
 
  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      await deletePropertyMutation.mutateAsync(id);
      navigate(property?.customerId ? `/customers/${property.customerId}` : "/customers");
    } catch (err) {
      console.error("Error deleting property:", err);
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
                  <FormField
                    className="sm:col-span-2"
                    label="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    error={errors.address}
                  />
                  <FormField
                    label="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    error={errors.city}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      error={errors.state}
                    />
                    <FormField
                      label="ZIP"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      error={errors.zip}
                    />
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
 
        <PoolSection propertyId={id} />

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Visit history</h2>
              <p className="mt-1 text-xs text-slate-500">Service visits recorded at this property.</p>
            </div>
            {!visitsLoading && <span className="text-xs font-medium text-slate-500">{visits.length} visit{visits.length === 1 ? '' : 's'}</span>}
          </div>

          {visitsLoading ? (
            <div className="px-6 py-8 text-sm text-slate-500">Loading visit history...</div>
          ) : visitsError ? (
            <div className="px-6 py-8 text-sm text-red-600">{visitsError}</div>
          ) : visits.length === 0 ? (
            <div className="px-6 py-8 text-sm text-slate-500">No visits have been recorded at this property.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visits.map((visit) => {
                const readings = visit.serviceData?.readings || {};
                return (
                  <li key={visit.id} className="px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{visit.job?.title || 'Service visit'}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(visit.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          {visit.scheduledTime ? ` • ${visit.scheduledTime}` : ''}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{visit.status}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {visit.checkInAt && <span>Check-in: {new Date(visit.checkInAt).toLocaleString()}</span>}
                      {visit.checkOutAt && <span>Check-out: {new Date(visit.checkOutAt).toLocaleString()}</span>}
                    </div>
                    {Object.keys(readings).length > 0 && (
                      <p className="mt-2 text-xs text-emerald-700">
                        Readings: {Object.entries(readings).map(([field, value]) => `${field === 'ph' ? 'pH' : field}: ${value}`).join(' • ')}
                      </p>
                    )}
                    {visit.notes && <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{visit.notes}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
 
      {showDeleteConfirm && (
        <ConfirmDeleteModal
          title={`Delete ${property.address || "this property"}?`}
          message="This can't be undone. This property's record will be permanently removed."
          confirmLabel="Delete property"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
 
export default PropertyDetails
