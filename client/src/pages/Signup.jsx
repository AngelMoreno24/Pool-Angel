import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { signupSchema } from '../schemas/authSchema';
 
const Signup = () => {
 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
 
    const { session, signUpNewUser } = UserAuth();
    const navigate = useNavigate();
 
    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setFieldErrors({});

        const validation = signupSchema.safeParse({ email, password });

        if (!validation.success) {
            setFieldErrors(validation.error.flatten().fieldErrors);
            setLoading(false);
            return;
        }

        try {
            const result = await signUpNewUser(validation.data.email, validation.data.password);
            if (result?.success) {
                await api.post(
                    "/auth/sync",
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${result.session.access_token}`,
                        },
                    }
                );
 
                navigate('/dashboard');
            } else {
                setError(result?.error?.message || 'Unable to sign up');
            }
        } catch (err) {
            setError(err?.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }
 
 
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
 
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <h1 className="text-2xl font-semibold text-slate-900">Sign up</h1>
                <p className="mt-1.5 text-sm text-slate-500">
                    Already have an account?{' '}
                    <Link to="/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Sign in
                    </Link>
                </p>
 
                <form className="mt-6 space-y-4" onSubmit={handleSignup}>
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
                            autoComplete="new-password"
                        />
                        {fieldErrors.password && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.password[0]}</p>
                        )}
                        <p className="mt-1.5 text-xs text-slate-400">
                            Use at least 8 characters.
                        </p>
                    </div>
 
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                            {error}
                        </div>
                    )}
 
                    <button
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        type="submit"
                        disabled={loading}
                    >
                        {loading && (
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                        )}
                        {loading ? "Creating account..." : "Sign up"}
                    </button>
                </form>
            </div>
 
            <p className="mt-6 text-center text-xs text-slate-400">
                By signing up, you agree to our terms and privacy policy.
            </p>
        </div>
    </div>
  )
}
 
export default Signup
