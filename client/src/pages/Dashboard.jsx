import React, { useState, useEffect } from 'react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getCustomers } from '../services/customerService';
 
const RECENT_COUNT = 5;
 
const Dashboard = () => {
 
  const { session, signOut } = UserAuth();
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
 
  const navigate = useNavigate();
 
  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate('/signin');
    } catch (err) {
      console.error("Error signing out:", err);
    }
  }
 
  // Normalize a response that might be a plain array or wrapped, e.g. { data: [...] }
  const toArray = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  };
 
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setCustomersLoading(true);
        const response = await getCustomers();
        setCustomers(toArray(response));
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setCustomersLoading(false);
      }
    };
 
    fetchCustomers();
  }, [session]);
 
  const byMostRecent = (a, b) =>
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
 
  const recentCustomers = [...customers].sort(byMostRecent).slice(0, RECENT_COUNT);
 
  const initials = (first, last) =>
    `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
 
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
 
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">
              Welcome back, {session?.user?.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Sign out
          </button>
        </div>
 
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/customers"
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:border-indigo-200 hover:shadow transition-all"
          >
            <div className="h-11 w-11 shrink-0 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">
                {customersLoading ? (
                  <span className="inline-block h-7 w-10 bg-slate-200 rounded animate-pulse align-middle" />
                ) : (
                  customers.length
                )}
              </p>
              <p className="text-sm text-slate-500">Total customers</p>
            </div>
          </Link>
 
          {/* Today's completed jobs — placeholder */}
          <div className="relative bg-white rounded-xl border border-dashed border-slate-300 p-5 flex items-center gap-4">
            <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Coming soon
            </span>
            <div className="h-11 w-11 shrink-0 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-300">—</p>
              <p className="text-sm text-slate-400">Completed today</p>
            </div>
          </div>
 
          {/* Today's incomplete jobs — placeholder */}
          <div className="relative bg-white rounded-xl border border-dashed border-slate-300 p-5 flex items-center gap-4">
            <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Coming soon
            </span>
            <div className="h-11 w-11 shrink-0 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-300">—</p>
              <p className="text-sm text-slate-400">Incomplete today</p>
            </div>
          </div>
        </div>
 
        {/* Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 
          {/* Recent customers */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Recent customers</h2>
              <Link to="/customers" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
 
            {customersLoading ? (
              <ul className="divide-y divide-slate-100">
                {[...Array(3)].map((_, i) => (
                  <li key={i} className="px-5 py-4 flex items-center gap-3 animate-pulse">
                    <div className="h-9 w-9 rounded-full bg-slate-200" />
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                  </li>
                ))}
              </ul>
            ) : recentCustomers.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-slate-500">No customers yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentCustomers.map((customer) => (
                  <li key={customer.id}>
                    <Link
                      to={`/customers/${customer.id}`}
                      className="px-5 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
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
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
 
          {/* Upcoming jobs — placeholder */}
          <section className="bg-white rounded-xl border border-dashed border-slate-300 overflow-hidden">
            <div className="px-5 py-4 border-b border-dashed border-slate-300 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-500">Upcoming jobs</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                Coming soon
              </span>
            </div>
            <div className="px-5 py-10 text-center">
              <div className="mx-auto h-10 w-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">Job scheduling isn't set up yet.</p>
              <p className="text-sm text-slate-400 mt-1">Once jobs are wired up, upcoming visits will show here.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
 
export default Dashboard
