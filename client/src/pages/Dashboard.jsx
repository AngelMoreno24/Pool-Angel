import React, { useState } from 'react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomers, useJobs } from '../hooks/useAppQueries';
 
const RECENT_COUNT = 5;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MS_PER_DAY = 24 * 60 * 60 * 1000;
 
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
 
// Does `job` actually occur on `date`? A recurring job's startDate is just
// its FIRST occurrence - a WEEKLY job that started last week still occurs
// again this week, on the same weekday, indefinitely (until its endDate,
// or until it's paused/completed/cancelled). This replaces the previous
// "exact startDate match" logic, which never showed a job again after its
// original start date.
const jobOccursOnDate = (job, date) => {
  if (!job?.startDate) return false;
  if (job.status === 'CANCELLED' || job.status === 'COMPLETED') return false;
 
  const start = startOfDay(job.startDate);
  const target = startOfDay(date);
 
  if (target < start) return false; // hasn't started yet
  if (job.endDate && target > startOfDay(job.endDate)) return false; // already ended
 
  const frequency = job.frequency;
 
  // No frequency (one-time repairs, etc.) or explicitly ONE_TIME - only
  // occurs on its exact start date.
  if (!frequency || frequency === 'ONE_TIME') {
    return target.getTime() === start.getTime();
  }
 
  // Recurring jobs repeat on the same weekday as their start date - prefer
  // job.dayOfWeek if it's set (from the Route page), otherwise derive it
  // from startDate itself so older jobs without dayOfWeek still work.
  const recurWeekday = job.dayOfWeek ?? start.getDay();
  if (target.getDay() !== recurWeekday) return false;
 
  const diffWeeks = Math.round((target - start) / MS_PER_DAY) / 7;
 
  if (frequency === 'WEEKLY') return Number.isInteger(diffWeeks);
  if (frequency === 'BIWEEKLY') return Number.isInteger(diffWeeks) && diffWeeks % 2 === 0;
  // Approximated as every 4 weeks on the same weekday - not true calendar-
  // month semantics, but close enough for an at-a-glance dashboard.
  if (frequency === 'MONTHLY') return Number.isInteger(diffWeeks) && diffWeeks % 4 === 0;
 
  return false;
};
 
const Dashboard = () => {
 
  const { session, role, signOut } = UserAuth();
  const customersQuery = useCustomers(role !== 'TECH');
  const jobsQuery = useJobs();
  const customers = role === 'TECH' ? [] : (customersQuery.data || []);
  const jobs = (jobsQuery.data || []).filter((job) => job?.status !== 'CANCELLED');
  const customersLoading = customersQuery.isLoading;
  const jobsLoading = jobsQuery.isLoading;
  // Which calendar day is selected - defaults to today, changes when a
  // week cell is clicked.
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarView, setCalendarView] = useState('week');
  const [calendarDate, setCalendarDate] = useState(() => new Date());
 
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
 
  const byMostRecent = (a, b) =>
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
 
  const recentCustomers = [...customers].sort(byMostRecent).slice(0, RECENT_COUNT);
 
  // Replaces the old exact-date bucket (jobsByStartDate) - computes which
  // jobs occur on a given date on demand, accounting for recurrence.
  const getJobsForDate = (date) => jobs.filter((job) => jobOccursOnDate(job, date));
 
  const upcomingJobs = [...jobs]
    .filter((job) => job?.startDate)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 5);
 
  const today = new Date();
  const weekStart = new Date(calendarDate);
  weekStart.setDate(calendarDate.getDate() - calendarDate.getDay());
 
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  const monthStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
  const monthGridStart = new Date(monthStart);
  monthGridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(monthGridStart);
    date.setDate(monthGridStart.getDate() + index);
    return date;
  });

  const visibleDays = calendarView === 'week' ? weekDays : calendarDays;
  const calendarTitle = calendarView === 'week'
    ? `${weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    : calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const moveCalendar = (amount) => {
    const nextDate = new Date(calendarDate);
    if (calendarView === 'week') {
      nextDate.setDate(calendarDate.getDate() + amount * 7);
    } else {
      nextDate.setDate(1);
      nextDate.setMonth(calendarDate.getMonth() + amount);
    }
    setCalendarDate(nextDate);
  };

  const totalJobsInView = visibleDays.reduce(
    (count, date) => count + getJobsForDate(date).length,
    0
  );
 
  const todayKey = today.toISOString().split('T')[0];
  const selectedKey = selectedDate.toISOString().split('T')[0];
  const jobsForSelectedDay = getJobsForDate(selectedDate);
 
  const initials = (first, last) =>
    `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
 
  const formatJobDate = (value) =>
    value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
 
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
 
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className="h-11 w-11 shrink-0 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">
                {jobsLoading ? (
                  <span className="inline-block h-7 w-10 bg-slate-200 rounded animate-pulse align-middle" />
                ) : (
                  jobs.filter((job) => job?.status === 'COMPLETED').length
                )}
              </p>
              <p className="text-sm text-slate-500">Completed jobs</p>
            </div>
          </div>
 
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className="h-11 w-11 shrink-0 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">
                {jobsLoading ? (
                  <span className="inline-block h-7 w-10 bg-slate-200 rounded animate-pulse align-middle" />
                ) : (
                  jobs.filter((job) => job?.status !== 'COMPLETED' && job?.status !== 'CANCELLED').length
                )}
              </p>
              <p className="text-sm text-slate-500">Open jobs</p>
            </div>
          </div>
        </div>
 
        {/* Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 
          {/* Recent customers */}
          {role !== 'TECH' && <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
          </section>}
 
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Upcoming jobs</h2>
              <Link to="/jobs" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
 
            {jobsLoading ? (
              <ul className="divide-y divide-slate-100">
                {[...Array(4)].map((_, i) => (
                  <li key={i} className="px-5 py-4 animate-pulse">
                    <div className="h-4 w-36 bg-slate-200 rounded mb-2" />
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                  </li>
                ))}
              </ul>
            ) : upcomingJobs.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-slate-500">No upcoming jobs scheduled.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcomingJobs.map((job) => {
                  const customer = customers.find((entry) => entry.id === job.customerId);
                  return (
                    <li key={job.id}>
                      <Link to={`/jobs/${job.id}`} className="block px-5 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{job.title}</p>
                          <p className="text-sm text-slate-500 truncate">
                            {customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown customer'}
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-blue-100 text-blue-800">
                          {job.status || 'ACTIVE'}
                        </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          {formatJobDate(job.startDate)}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
 
          {/* This week's jobs - now recurrence-aware, not exact-date-only */}
          <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-slate-900">Upcoming work</h2>
                <div className="flex rounded-lg border border-slate-200 p-0.5">
                  {['week', 'month'].map((view) => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => setCalendarView(view)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ${calendarView === view ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => moveCalendar(-1)} className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50" aria-label="Previous period">&lt;</button>
                <span className="min-w-28 text-center text-xs font-medium text-slate-500">{calendarTitle}</span>
                <button type="button" onClick={() => moveCalendar(1)} className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50" aria-label="Next period">&gt;</button>
              </div>
            </div>
 
            <div className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {visibleDays.map((date, index) => {
                  const dateKey = date.toISOString().split('T')[0];
                  const dayJobs = getJobsForDate(date);
                  const isToday = dateKey === todayKey;
                  const isSelected = dateKey === selectedKey;
                  const isOutsideMonth = calendarView === 'month' && date.getMonth() !== calendarDate.getMonth();
 
                  return (
                    <div
                      key={dateKey}
                      onClick={() => setSelectedDate(date)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') setSelectedDate(date);
                      }}
                      role="button"
                      tabIndex={0}
                      className={[
                        calendarView === 'week' ? 'min-h-30' : 'min-h-24',
                        'rounded-lg border p-2 text-left transition-colors',
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                          : isToday
                            ? 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50'
                            : isOutsideMonth
                              ? 'border-slate-100 bg-slate-50/50 text-slate-300 hover:bg-slate-100'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100',
                      ].join(' ')}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          {WEEKDAYS[date.getDay()]}
                        </span>
                        <span className={['text-xs font-medium', isSelected || isToday ? 'text-indigo-700' : 'text-slate-700'].join(' ')}>
                          {date.getDate()}
                        </span>
                      </div>
 
                      <div className="space-y-1">
                        {dayJobs.slice(0, calendarView === 'week' ? 3 : 2).map((job) => (
                          <Link
                            key={job.id}
                            to={`/jobs/${job.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="block truncate rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm hover:bg-indigo-100"
                          >
                            {job.title}
                          </Link>
                        ))}
                        {dayJobs.length > (calendarView === 'week' ? 3 : 2) && (
                          <div className="text-[10px] font-medium text-indigo-700">
                            +{dayJobs.length - (calendarView === 'week' ? 3 : 2)} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
 
              <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500">
                {totalJobsInView} job{totalJobsInView === 1 ? '' : 's'} scheduled in this {calendarView}
              </div>
            </div>
          </section>
 
          {/* Jobs for whichever day is selected above - defaults to today */}
          <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Jobs for {selectedKey === todayKey ? 'today' : selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h2>
              <span className="text-xs font-medium text-slate-500">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
 
            {jobsLoading ? (
              <ul className="divide-y divide-slate-100">
                {[...Array(2)].map((_, i) => (
                  <li key={i} className="px-5 py-4 flex items-center gap-3 animate-pulse">
                    <div className="h-9 w-9 rounded-lg bg-slate-200" />
                    <div className="h-4 w-48 bg-slate-200 rounded" />
                  </li>
                ))}
              </ul>
            ) : jobsForSelectedDay.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-slate-500">No jobs scheduled for this day.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {jobsForSelectedDay.map((job) => {
                  const customer = customers.find((entry) => entry.id === job.customerId);
                  return (
                    <li key={job.id}>
                      <Link to={`/jobs/${job.id}`} className="px-5 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                      <div className="h-9 w-9 shrink-0 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{job.title}</p>
                        <p className="text-sm text-slate-500 truncate">
                          {customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown customer'}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-blue-100 text-blue-800 shrink-0">
                        {job.status || 'ACTIVE'}
                      </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
 
export default Dashboard
