import React, { useState, useEffect } from 'react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getCustomers, createCustomer } from '../services/customerService';
import { customerSchema } from '../schemas/customerSchema';
import FormField from '../components/FormField';
import Spinner from '../components/Spinner';
 
const Customer = () => {
 
    const { session, signOut } = UserAuth();
    const [customers, setCustomers] = useState([]);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
 
    const navigate = useNavigate();
 
    useEffect(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          const response = await getCustomers();
          setCustomers(Array.isArray(response) ? response : response?.data || []);
        } catch (error) {
          console.error("Error fetching customers:", error);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }, []);
 
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
 
      const result = customerSchema.safeParse({ firstName, lastName, email, phone });
 
      if (!result.success) {
        // Keep the array shape flatten() gives back - FormField reads error[0] directly,
        // same convention as CustomerDetails and PropertyDetails.
        setFieldErrors(result.error.flatten().fieldErrors);
        return;
      }
 
      setFieldErrors({});
      setSubmitError(null);
 
      try {
        setSubmitting(true);
        // result.data is the validated (and trimmed) payload - safe to send as-is
        const createdCustomer = await createCustomer(result.data);
        setCustomers([...customers, createdCustomer]);
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
      } catch (error) {
        console.error("Error creating customer:", error);
        // Surface a server-side validation error if the backend sends one back
        // in the same { fieldName: [messages] } shape
        const serverFieldErrors = error?.response?.data?.errors;
        if (serverFieldErrors) {
          setFieldErrors(
            Object.fromEntries(
              Object.entries(serverFieldErrors).map(([field, messages]) => [
                field,
                Array.isArray(messages) ? messages : [messages],
              ])
            )
          );
        } else {
          setSubmitError("Couldn't create that customer. Please try again.");
        }
      } finally {
        setSubmitting(false);
      }
    };
 
    const initials = (first, last) =>
      `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
 
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
 
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
            <p className="mt-1 text-sm text-slate-500">
              View existing customers or add a new one.
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
            Add customer
          </button>
        </header>

        {showAddForm && (
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <h2 className="text-base font-medium text-slate-900 mb-4">Add a customer</h2>

            {submitError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="First name" value={firstName} onChange={(e) => { setFirstName(e.target.value); clearFieldError("firstName"); }} placeholder="Jane" error={fieldErrors.firstName} />
              <FormField label="Last name" value={lastName} onChange={(e) => { setLastName(e.target.value); clearFieldError("lastName"); }} placeholder="Doe" error={fieldErrors.lastName} />
              <FormField label="Email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }} placeholder="jane@example.com" error={fieldErrors.email} />
              <FormField label="Phone" type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); clearFieldError("phone"); }} placeholder="(555) 123-4567" error={fieldErrors.phone} />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddForm(false)} disabled={submitting} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">Cancel</button>
              <button type="button" disabled={submitting} onClick={handleCreate} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                {submitting && <Spinner />}
                {submitting ? "Creating..." : "Create customer"}
              </button>
            </div>
          </section>
        )}
 
        {/* Customer list */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-medium text-slate-900">
              All customers {!loading && (
                <span className="text-slate-400 font-normal">({customers.length})</span>
              )}
            </h2>
          </div>
 
          {loading ? (
            <ul className="divide-y divide-slate-100">
              {[...Array(3)].map((_, i) => (
                <li key={i} className="px-5 py-4 flex items-center gap-3 animate-pulse">
                  <div className="h-9 w-9 rounded-full bg-slate-200" />
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                </li>
              ))}
            </ul>
          ) : customers.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-500">No customers yet.</p>
              <p className="text-sm text-slate-400 mt-1">Use Add customer to create one.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <li
                  key={customer.id}
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  className="px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="h-9 w-9 shrink-0 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-medium">
                    {initials(customer.firstName, customer.lastName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {customer.firstName} {customer.lastName}
                    </p>
                    {customer.email && (
                      <p className="text-sm text-slate-500 truncate">{customer.email}</p>
                    )}
                  </div>
                  <svg
                    className="ml-auto h-4 w-4 text-slate-300 shrink-0"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </li>
              ))}
            </ul>
          )}
        </section>
 
      </div>
    </div>
  )
}
 
export default Customer
