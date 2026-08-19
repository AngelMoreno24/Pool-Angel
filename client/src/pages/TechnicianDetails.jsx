import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTech, updateTech, deleteTech } from '../services/techService';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Spinner from '../components/Spinner';

const TechnicianDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchTech = async () => {
      try {
        setLoading(true);
        const response = await getTech(id);
        setTech(response);
        setFirstName(response.firstName || '');
        setLastName(response.lastName || '');
        setEmail(response.email || '');
      } catch (err) {
        console.error('Error fetching technician:', err);
        setError("Couldn't load this technician.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTech();
    }
  }, [id]);

  const startEditing = () => {
    setError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setFirstName(tech?.firstName || '');
    setLastName(tech?.lastName || '');
    setEmail(tech?.email || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (saving) return;

    if (!firstName.trim() || !email.trim()) {
      setError('First name and email are required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await updateTech(id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });

      const updated = response?.firstName ? response : response?.data?.firstName ? response.data : null;
      setTech(updated || { ...tech, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating technician:', err);
      setError(err?.response?.data?.error || "Couldn't save those changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      await deleteTech(id);
      navigate('/technicians');
    } catch (err) {
      console.error('Error deleting technician:', err);
      setError(err?.response?.data?.error || "Couldn't delete this technician. Please try again.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const initials = `${tech?.firstName?.[0] ?? ''}${tech?.lastName?.[0] ?? ''}`.toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  if (!tech) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <p className="text-sm text-slate-500">
            {error || "This technician couldn't be found."}
          </p>
          <button
            onClick={() => navigate('/technicians')}
            className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to techs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/technicians')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to techs
        </button>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-14 w-14 shrink-0 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-semibold">
                {initials || 'T'}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-slate-900 truncate">
                  {tech.firstName || 'Unnamed'} {tech.lastName || ''}
                </h1>
                <p className="text-sm text-slate-500">
                  {tech.role || 'TECH'}
                </p>
              </div>
            </div>

            {!isEditing && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={startEditing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-300 text-slate-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors"
                  aria-label="Delete technician"
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
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">First name</dt>
                  <dd className="mt-1 text-sm text-slate-900">{tech.firstName || '—'}</dd>
                </div>

                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Last name</dt>
                  <dd className="mt-1 text-sm text-slate-900">{tech.lastName || '—'}</dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</dt>
                  <dd className="mt-1 text-sm text-slate-900">{tech.email || '—'}</dd>
                </div>

                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Role</dt>
                  <dd className="mt-1 text-sm text-slate-900">{tech.role || 'TECH'}</dd>
                </div>

                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Company ID</dt>
                  <dd className="mt-1 text-sm text-slate-900 break-all">{tech.companyId || '—'}</dd>
                </div>
              </dl>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First name</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
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
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                  >
                    {saving && <Spinner />}
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {showDeleteConfirm && (
        <ConfirmDeleteModal
          title="Delete technician"
          message={`Are you sure you want to remove ${tech.firstName || 'this technician'} from the team? This also removes their Supabase auth account.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};

export default TechnicianDetails;