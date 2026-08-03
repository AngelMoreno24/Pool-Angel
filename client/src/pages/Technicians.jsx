import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { getTechs, createTech } from '../services/techService';
import { z } from 'zod';
import FormField from '../components/FormField';
import Spinner from '../components/Spinner';
 
const techSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().optional(),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
 
// Generates a readable random password, e.g. "quiet-otter-4821"
const generatePassword = () => {
  const words = ["quiet", "swift", "coral", "amber", "cedar", "misty", "azure", "opal"];
  const animals = ["otter", "heron", "finch", "gecko", "sable", "raven", "ibex", "lynx"];
  const word = words[Math.floor(Math.random() * words.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${animal}-${number}`;
};
 
const Tech = () => {
  const navigate = useNavigate();
 
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
 
  const [showAddForm, setShowAddForm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
 
  const [newTechResult, setNewTechResult] = useState(null);
  const [copied, setCopied] = useState(false);
 
  useEffect(() => {
    const fetchTechs = async () => {
      try {
        setLoading(true);
        const response = await getTechs();
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.techs)
              ? response.techs
              : [];
        setTechs(list);
      } catch (error) {
        console.error("Error fetching techs:", error);
        setListError("Couldn't load your techs.");
      } finally {
        setLoading(false);
      }
    };
    fetchTechs();
  }, []);
 
  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setErrors({});
  };
 
  const handleCreate = async () => {
    if (submitting) return;
 
    const validation = techSchema.safeParse({ firstName, lastName, email, password });
    if (!validation.success) {
      setErrors(validation.error.flatten().fieldErrors);
      return;
    }
 
    try {
      setSubmitting(true);
      setSubmitError(null);
      setErrors({});
      const result = await createTech(validation.data);
      const createdTech = result?.user || result;
      setTechs([...techs, createdTech]);
      setNewTechResult({ tech: createdTech, password: validation.data.password });
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error creating tech:", error);
      const serverFieldErrors = error?.response?.data?.errors;
      if (serverFieldErrors) {
        setErrors(serverFieldErrors);
      } else {
        setSubmitError(error?.response?.data?.error || "Couldn't add that tech. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };
 
  const handleCopyPassword = async () => {
    if (!newTechResult?.password) return;
    try {
      await navigator.clipboard.writeText(newTechResult.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying password:", error);
    }
  };
 
  const initials = (first, last) =>
    `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
 
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
 
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Techs</h1>
            <p className="mt-1 text-sm text-slate-500">Manage the technicians on your team.</p>
          </div>
          <button
            onClick={() => { setShowAddForm((v) => !v); setNewTechResult(null); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add tech
          </button>
        </header>
 
        {newTechResult && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-medium text-amber-900">
              {newTechResult.tech.firstName}'s account is ready
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Share this password with them directly - it won't be shown again.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-mono text-slate-900">
                {newTechResult.password}
              </code>
              <button
                onClick={handleCopyPassword}
                className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => setNewTechResult(null)}
              className="mt-3 text-sm font-medium text-amber-700 hover:text-amber-900"
            >
              Done
            </button>
          </div>
        )}
 
        {showAddForm && (
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <h2 className="text-base font-medium text-slate-900 mb-4">Add a technician</h2>
 
            {submitError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {submitError}
              </div>
            )}
 
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alex"
                error={errors.firstName}
              />
              <FormField
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Rivera"
                error={errors.lastName}
              />
              <FormField
                className="sm:col-span-2"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                error={errors.email}
              />
 
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="flex gap-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.password ? "border-red-400" : "border-slate-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => { setPassword(generatePassword()); setShowPassword(true); }}
                    className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>
                )}
              </div>
            </div>
 
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setShowAddForm(false); resetForm(); }}
                disabled={submitting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting && <Spinner />}
                {submitting ? "Adding..." : "Add technician"}
              </button>
            </div>
          </section>
        )}
 
        {/* Tech list */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-medium text-slate-900">
              All techs {!loading && (
                <span className="text-slate-400 font-normal">({techs.length})</span>
              )}
            </h2>
          </div>
 
          {listError && (
            <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {listError}
            </div>
          )}
 
          {loading ? (
            <ul className="divide-y divide-slate-100">
              {[...Array(2)].map((_, i) => (
                <li key={i} className="px-5 py-4 flex items-center gap-3 animate-pulse">
                  <div className="h-9 w-9 rounded-full bg-slate-200" />
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                </li>
              ))}
            </ul>
          ) : techs.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-500">No techs yet.</p>
              <p className="text-sm text-slate-400 mt-1">Add your first one above.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {techs.map((tech) => (
                <li
                  key={tech.id}
                  onClick={() => navigate(`/technicians/${tech.id}`)}
                  className="px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="h-9 w-9 shrink-0 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-medium">
                    {initials(tech.firstName, tech.lastName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {tech.firstName} {tech.lastName}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{tech.email}</p>
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
 
export default Tech
