import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
 
const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/customers", label: "Customers" },
  { to: "/technicians", label: "Technicians" },
  { to: "/jobs", label: "Jobs" },
  { to: "/route", label: "Routes" },
];
 
const Navbar = () => {
  const location = useLocation();
  const { session, signOut } = UserAuth();
 
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
 
  const email = session?.user?.email || "";
  const initial = email ? email[0].toUpperCase() : "?";
 
  const linkClasses = (path, mobile = false) =>
    `${mobile ? "block px-3 py-2 text-base" : "px-3 py-2 text-sm"} rounded-md font-medium transition-colors ${
      location.pathname === path
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
    }`;
 
  return (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
 
          {/* Left */}
          <div className="flex items-center gap-8">
            <Link
              to="/dashboard"
              className="text-lg font-bold text-indigo-600 tracking-tight"
              onClick={() => setMobileOpen(false)}
            >
              Pool Angel
            </Link>
 
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link key={link.to} to={link.to} className={linkClasses(link.to)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
 
          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Profile dropdown (desktop) */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-slate-50 transition-colors"
              >
                <span className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-medium">
                  {initial}
                </span>
                <span className="text-sm text-slate-600 max-w-[160px] truncate">
                  {email}
                </span>
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
 
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg py-1 z-20">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm text-slate-700 truncate">{email}</p>
                    </div>
                    <button
                      onClick={signOut}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
 
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
 
        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={linkClasses(link.to, true)}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
 
            <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between px-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-8 w-8 shrink-0 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-medium">
                  {initial}
                </span>
                <span className="text-sm text-slate-600 truncate">{email}</span>
              </div>
              <button
                onClick={signOut}
                className="shrink-0 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 py-1.5 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
 
export default Navbar;