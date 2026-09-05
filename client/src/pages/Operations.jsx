import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { getjob } from '../services/jobService';
import { getVisits } from '../services/visitService';
import { getTechs } from '../services/techService';

const toArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, {
  month: 'short',
  day: 'numeric',
});

const formatCurrency = (value) => new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(value);

const Operations = () => {
  const { role } = UserAuth();
  const [period, setPeriod] = useState('week');
  const [jobs, setJobs] = useState([]);
  const [visits, setVisits] = useState([]);
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOperations = async () => {
      try {
        setLoading(true);
        setError(null);
        const [jobsResponse, visitsResponse, techsResponse] = await Promise.all([
          getjob(),
          getVisits(),
          getTechs(),
        ]);
        setJobs(toArray(jobsResponse));
        setVisits(toArray(visitsResponse));
        setTechs(toArray(techsResponse));
      } catch (loadError) {
        console.error('Error loading operations:', loadError);
        setError("Couldn't load operations data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadOperations();
  }, []);

  const ranges = useMemo(() => {
    const today = startOfDay(new Date());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const start = period === 'week' ? weekStart : monthStart;
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return { start, end, weekStart, weekEnd };
  }, [period]);

  const periodVisits = useMemo(() => visits.filter((visit) => {
    const scheduledDate = new Date(visit.scheduledDate);
    return scheduledDate >= ranges.start && scheduledDate <= ranges.end && visit.status !== 'CANCELLED';
  }), [visits, ranges]);

  const completedThisWeek = useMemo(() => visits.filter((visit) => {
    const scheduledDate = new Date(visit.scheduledDate);
    return scheduledDate >= ranges.weekStart && scheduledDate <= ranges.weekEnd && visit.status === 'COMPLETED';
  }).length, [visits, ranges]);

  const completedPeriodVisits = periodVisits.filter((visit) => visit.status === 'COMPLETED');
  const estimatedRevenue = completedPeriodVisits.reduce((total, visit) => {
    const job = jobs.find((entry) => entry.id === visit.jobId);
    return total + Number(job?.price || 0);
  }, 0);

  const workload = useMemo(() => {
    const assigned = techs.filter((tech) => tech.role === 'TECH');
    return assigned.map((tech) => {
      const techVisits = periodVisits.filter((visit) => visit.assignedTechId === tech.id);
      return {
        ...tech,
        total: techVisits.length,
        completed: techVisits.filter((visit) => visit.status === 'COMPLETED').length,
        active: techVisits.filter((visit) => visit.status === 'IN_PROGRESS').length,
      };
    }).sort((a, b) => b.total - a.total);
  }, [techs, periodVisits]);

  const openJobs = jobs.filter((job) => !['COMPLETED', 'CANCELLED'].includes(job.status));
  const completedJobs = jobs.filter((job) => job.status === 'COMPLETED');
  const routeCompletionRate = periodVisits.length
    ? Math.round((completedPeriodVisits.length / periodVisits.length) * 100)
    : 0;
  const maxWorkload = Math.max(...workload.map((tech) => tech.total), 1);
  const periodLabel = period === 'week' ? 'This week' : 'This month';

  if (role !== 'OWNER') return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">Operations</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Service performance</h1>
            <p className="mt-1 text-sm text-slate-500">A quick view of workload, visits, revenue, and route execution.</p>
          </div>
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {['week', 'month'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${period === value ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {value}
              </button>
            ))}
          </div>
        </header>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Completed visits this week</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{completedThisWeek}</p>
                <p className="mt-1 text-xs text-slate-400">Based on scheduled visit dates</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Estimated revenue</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(estimatedRevenue)}</p>
                <p className="mt-1 text-xs text-slate-400">Completed visits, {periodLabel.toLowerCase()}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Open jobs</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{openJobs.length}</p>
                <p className="mt-1 text-xs text-slate-400">{completedJobs.length} completed total</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Route completion</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{routeCompletionRate}%</p>
                <p className="mt-1 text-xs text-slate-400">{completedPeriodVisits.length} of {periodVisits.length} visits complete</p>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Technician workload</h2>
                    <p className="mt-1 text-xs text-slate-500">Assigned visits for {periodLabel.toLowerCase()}.</p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{periodVisits.length} visits</span>
                </div>
                {workload.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-slate-500">No technicians found.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {workload.map((tech) => (
                      <li key={tech.id} className="px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-900">{tech.firstName} {tech.lastName || ''}</p>
                          <p className="text-xs text-slate-500">{tech.completed}/{tech.total} complete</p>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-indigo-600" style={{ width: `${(tech.total / maxWorkload) * 100}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{tech.active} currently in progress</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Recent completed visits</h2>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(ranges.start)} through {formatDate(ranges.end)}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{completedPeriodVisits.length}</span>
                </div>
                {completedPeriodVisits.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-slate-500">No completed visits in this period.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {[...completedPeriodVisits].sort((a, b) => new Date(b.checkOutAt || b.scheduledDate) - new Date(a.checkOutAt || a.scheduledDate)).slice(0, 6).map((visit) => {
                      const job = jobs.find((entry) => entry.id === visit.jobId);
                      const tech = techs.find((entry) => entry.id === visit.assignedTechId);
                      return (
                        <li key={visit.id} className="flex items-center justify-between gap-3 px-5 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{job?.title || 'Service visit'}</p>
                            <p className="truncate text-xs text-slate-500">{tech ? `${tech.firstName} ${tech.lastName || ''}` : 'Unassigned'} · {formatDate(visit.scheduledDate)}</p>
                          </div>
                          <span className="shrink-0 text-sm font-medium text-emerald-700">{formatCurrency(job?.price || 0)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">Job status overview</h2>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-3">
                {[
                  ['Open', openJobs.length, 'bg-amber-50 text-amber-700'],
                  ['Completed', completedJobs.length, 'bg-emerald-50 text-emerald-700'],
                  ['Cancelled', jobs.filter((job) => job.status === 'CANCELLED').length, 'bg-slate-100 text-slate-600'],
                ].map(([label, count, classes]) => (
                  <div key={label} className={`rounded-lg p-4 ${classes}`}>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-1 text-2xl font-semibold">{count}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Operations;
