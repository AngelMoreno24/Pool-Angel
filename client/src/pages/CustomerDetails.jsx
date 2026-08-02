import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getCustomerById, updateCustomer, deleteCustomer } from '../services/customerService';
import { getPropertiesByCustomer, createProperty } from '../services/propertyService';
import { customerSchema, customerUpdateSchema } from '../schemas/customerSchema';
import { propertySchema } from '../schemas/propertySchema';
 
const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
 
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerErrors, setCustomerErrors] = useState({});
 
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
 
  // Properties
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState(null);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [addingProperty, setAddingProperty] = useState(false);
  const [propertyErrors, setPropertyErrors] = useState({});
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [poolType, setPoolType] = useState("");
 
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const response = await getCustomerById(id);
        setCustomer(response);
        setFirstName(response.firstName || "");
        setLastName(response.lastName || "");
        setEmail(response.email || "");
        setPhone(response.phone || "");
      } catch (error) {
        console.error("Error fetching customer:", error);
        setError("Couldn't load this customer.");
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [id]);
 
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setPropertiesLoading(true);
        const response = await getPropertiesByCustomer(id);
        console.log("Fetched properties:", response);
        // Handle APIs that wrap the array, e.g. { data: [...] } or { properties: [...] }
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
        setPropertiesError("Couldn't load properties for this customer.");
      } finally {
        setPropertiesLoading(false);
      }
    }
    fetchProperties();
  }, [id]);
 
  const isFormValid = firstName.trim() && lastName.trim() && email.trim();
  const isPropertyFormValid = address.trim();
 
  const startEditing = () => {
    setError(null);
    setCustomerErrors({});
    setIsEditing(true);
  };
 
  const cancelEditing = () => {
    setFirstName(customer.firstName || "");
    setLastName(customer.lastName || "");
    setEmail(customer.email || "");
    setPhone(customer.phone || "");
    setCustomerErrors({});
    setIsEditing(false);
  };
 
  const handleSave = async () => {
    if (saving) return;

    const validation = customerUpdateSchema.safeParse({
      firstName,
      lastName,
      email,
      phone,
    });

    if (!validation.success) {
      setCustomerErrors(validation.error.flatten().fieldErrors);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setCustomerErrors({});
      const response = await updateCustomer(id, validation.data);
      console.log("Update customer response:", response);
      const updated = response?.firstName
        ? response
        : response?.data?.firstName
          ? response.data
          : null;
      if (updated) {
        setCustomer(updated);
      } else {
        setCustomer((prev) => ({ ...prev, firstName, lastName, email, phone }));
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating customer:", error);
      setError("Couldn't save those changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };
 
  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      await deleteCustomer(id);
      navigate("/customers");
    } catch (error) {
      console.error("Error deleting customer:", error);
      setError("Couldn't delete this customer. Please try again.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
 
  const resetPropertyForm = () => {
    setAddress("");
    setCity("");
    setState("");
    setZipCode("");
    setPoolType("");
    setPropertyErrors({});
  };
 
  const handleAddProperty = async () => {
    if (addingProperty) return;

    const validation = propertySchema.safeParse({
      customerId: id,
      address,
      city,
      state,
      zip: zipCode,
      poolType,
    });

    if (!validation.success) {
      setPropertyErrors(validation.error.flatten().fieldErrors);
      return;
    }

    try {
      setAddingProperty(true);
      setPropertiesError(null);
      setPropertyErrors({});
      const newProperty = await createProperty(validation.data);
      setProperties([...properties, newProperty]);
      resetPropertyForm();
      setShowAddProperty(false);
    } catch (error) {
      console.error("Error creating property:", error);
      setPropertiesError("Couldn't add that property. Please try again.");
    } finally {
      setAddingProperty(false);
    }
  };
 
  const initials = (first, last) =>
    `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
 
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-slate-200" />
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
 
  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <p className="text-sm text-slate-500">
            {error || "This customer couldn't be found."}
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
 
        <button
          onClick={() => navigate("/customers")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to customers
        </button>
 
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
 
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
 
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-14 w-14 shrink-0 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-medium">
                {initials(customer.firstName, customer.lastName)}
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-slate-900 truncate">
                  {customer.firstName} {customer.lastName}
                </h1>
                <p className="text-sm text-slate-500 truncate">{customer.email}</p>
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
                  aria-label="Delete customer"
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
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">First name</dt>
                  <dd className="mt-1 text-sm text-slate-900">{customer.firstName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Last name</dt>
                  <dd className="mt-1 text-sm text-slate-900">{customer.lastName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</dt>
                  <dd className="mt-1 text-sm text-slate-900">{customer.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Phone</dt>
                  <dd className="mt-1 text-sm text-slate-900">{customer.phone || "—"}</dd>
                </div>
              </dl>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${customerErrors.firstName ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    {customerErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{customerErrors.firstName[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${customerErrors.lastName ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    {customerErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{customerErrors.lastName[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${customerErrors.email ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    {customerErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{customerErrors.email[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${customerErrors.phone ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    {customerErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">{customerErrors.phone[0]}</p>
                    )}
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
 
        {/* Properties section */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-900">
              Properties {!propertiesLoading && (
                <span className="text-slate-400 font-normal">({properties.length})</span>
              )}
            </h2>
            <button
              onClick={() => setShowAddProperty((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showAddProperty ? "Cancel" : "Add property"}
            </button>
          </div>
 
          {propertiesError && (
            <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {propertiesError}
            </div>
          )}
 
          {/* Add property form */}
          {showAddProperty && (
            <div className="px-6 pt-5 pb-6 border-b border-slate-200 bg-slate-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Desert Ave"
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${propertyErrors.address ? 'border-red-400' : 'border-slate-300'}`}
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
                    placeholder="Phoenix"
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${propertyErrors.city ? 'border-red-400' : 'border-slate-300'}`}
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
                      placeholder="AZ"
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${propertyErrors.state ? 'border-red-400' : 'border-slate-300'}`}
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
                      placeholder="85001"
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${propertyErrors.zip ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    {propertyErrors.zip && (
                      <p className="mt-1 text-sm text-red-600">{propertyErrors.zip[0]}</p>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pool type</label>
                  <input
                    type="text"
                    value={poolType}
                    onChange={(e) => setPoolType(e.target.value)}
                    placeholder="Gunite, saltwater, etc."
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${propertyErrors.poolType ? 'border-red-400' : 'border-slate-300'}`}
                  />
                  {propertyErrors.poolType && (
                    <p className="mt-1 text-sm text-red-600">{propertyErrors.poolType[0]}</p>
                  )}
                </div>
              </div>
 
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowAddProperty(false);
                    resetPropertyForm();
                  }}
                  disabled={addingProperty}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProperty}
                  disabled={!isPropertyFormValid || addingProperty}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addingProperty && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  {addingProperty ? "Adding..." : "Add property"}
                </button>
              </div>
            </div>
          )}
 
          {/* Properties list */}
          {propertiesLoading ? (
            <ul className="divide-y divide-slate-100">
              {[...Array(2)].map((_, i) => (
                <li key={i} className="px-6 py-4 flex items-center gap-3 animate-pulse">
                  <div className="h-9 w-9 rounded-lg bg-slate-200" />
                  <div className="h-4 w-48 bg-slate-200 rounded" />
                </li>
              ))}
            </ul>
          ) : properties.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-slate-500">No properties yet.</p>
              <p className="text-sm text-slate-400 mt-1">Add this customer's first property above.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {properties.map((property) => (
                <li key={property.id}>
                  <Link
                    to={`/properties/${property.id}`}
                    className="px-6 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {property.address || "Untitled property"}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {[property.city, property.state].filter(Boolean).join(", ")}
                        {property.poolType ? ` · ${property.poolType}` : ""}
                      </p>
                    </div>
                    <svg
                      className="ml-auto h-4 w-4 text-slate-300 shrink-0"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
 
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-semibold text-slate-900">
              Delete {customer.firstName} {customer.lastName}?
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              This can't be undone. This customer's record will be permanently removed.
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
                {deleting ? "Deleting..." : "Delete customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
 
export default CustomerDetails
