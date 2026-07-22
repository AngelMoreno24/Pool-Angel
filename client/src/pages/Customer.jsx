import React, { useState, useEffect } from 'react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getCustomers, createCustomer } from '../services/customerService';
 
const Customer = () => {
  const { session, signOut } = UserAuth();
  const [customers, setCustomers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
 
  const navigate = useNavigate();
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getCustomers();
        setCustomers(response);
      } catch (error) {
        console.error("Error fetching customers:", error);
        setError("Couldn't load customers. Try refreshing the page.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
 
  const isFormValid = firstName.trim() && lastName.trim() && email.trim();
 
  const handleCreate = async () => {
    if (!isFormValid || submitting) return;
    const newCustomer = { firstName, lastName, email, phone };
    try {
      setSubmitting(true);
      setError(null);
      const createdCustomer = await createCustomer(newCustomer);
      setCustomers([...customers, createdCustomer]);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
    } catch (error) {
      console.error("Error creating customer:", error);
      setError("Couldn't create that customer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
 
  const initials = (first, last) =>
    `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
 
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
 
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">
            View existing customers or add a new one.
          </p>
        </header>
 
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
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
              <p className="text-sm text-slate-400 mt-1">Add your first one below.</p>
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
 
        {/* Create customer form */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-medium text-slate-900 mb-4">Add a customer</h2>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                First name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
 
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Last name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
 
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
 
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
 
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={!isFormValid || submitting}
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                "Create customer"
              )}
            </button>
          </div>
        </section>
 
      </div>
    </div>
  )
}
 
export default Customer