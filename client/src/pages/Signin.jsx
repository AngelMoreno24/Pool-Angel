import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { signinSchema } from '../schemas/authSchema';
 
// Demo account credentials — swap these for your actual demo user
const DEMO_EMAIL = 'asd@asd.com';
const DEMO_PASSWORD = 'asdasd';
 
const Signin = () => {
 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);
 
    const { session, signInUser } = UserAuth();
    const navigate = useNavigate();
 
    const performSignin = async (signinEmail, signinPassword) => {
        setError('');
        setFieldErrors({});

        const validation = signinSchema.safeParse({ email: signinEmail, password: signinPassword });

        if (!validation.success) {
            setFieldErrors(validation.error.flatten().fieldErrors);
            return;
        }

        try {
            const result = await signInUser(validation.data.email, validation.data.password);
            if (result?.success) {
                await api.post(
                    "/auth/sync",
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${result.data.session.access_token}`,
                        },
                    }
                );
                navigate('/dashboard');
            } else {
                setError(result?.error?.message || 'Unable to sign in');
            }
        } catch (err) {
            setError(err?.message || 'An unexpected error occurred');
        }
    }
 
    const handleSignin = async (e) => {
        e.preventDefault();
        setLoading(true);
        await performSignin(email, password);
        setLoading(false);
    }
 
    const handleDemoSignin = async () => {
        setDemoLoading(true);
        setEmail(DEMO_EMAIL);
        setPassword(DEMO_PASSWORD);
        await performSignin(DEMO_EMAIL, DEMO_PASSWORD);
        setDemoLoading(false);
    }
 
    const isLoading = loading || demoLoading;
 
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
 
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
                <p className="mt-1.5 text-sm text-slate-500">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Sign up
                    </Link>
                </p>
 
                <form className="mt-6 space-y-4" onSubmit={handleSignin}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email
                        </label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${fieldErrors.email ? 'border-red-400' : 'border-slate-300'}`}
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                        />
                        {fieldErrors.email && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.email[0]}</p>
                        )}
                    </div>
 
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Password
                        </label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${fieldErrors.password ? 'border-red-400' : 'border-slate-300'}`}
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                        {fieldErrors.password && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.password[0]}</p>
                        )}
                    </div>
 
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                            {error}
                        </div>
                    )}
 
                    <button
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        type="submit"
                        disabled={isLoading}
                    >
                        {loading && (
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                        )}
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
 
                <div className="mt-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">or</span>
                    <div className="h-px flex-1 bg-slate-200" />
                </div>
 
                <button
                    onClick={handleDemoSignin}
                    disabled={isLoading}
                    type="button"
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    {demoLoading ? (
                        <>
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            Signing in...
                        </>
                    ) : (
                        <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Try the demo
                        </>
                    )}
                </button>
            </div>
 
            <p className="mt-6 text-center text-xs text-slate-400">
                Demo login signs you in with a read-only sample account.
            </p>
        </div>
    </div>
  )
}
 
export default Signin