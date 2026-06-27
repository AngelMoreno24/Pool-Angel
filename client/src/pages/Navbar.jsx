import { Link, useLocation } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Navbar = () => {
  const location = useLocation();

  const { session, signOut } = UserAuth();

  const linkClasses = (path) =>
    `px-3 py-2 rounded-md transition ${
      location.pathname === path
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-10">
          <Link
            to="/dashboard"
            className="text-xl font-bold text-blue-600"
          >
            Pool Angel
          </Link>

          <div className="flex gap-2">
            <Link
              to="/dashboard"
              className={linkClasses("/dashboard")}
            >
              Dashboard
            </Link>

            <Link
              to="/customers"
              className={linkClasses("/customers")}
            >
              Customers
            </Link>

            <Link
              to="/pools"
              className={linkClasses("/pools")}
            >
              Pools
            </Link>

            <Link
              to="/jobs"
              className={linkClasses("/jobs")}
            >
              Jobs
            </Link>

            <Link
              to="/settings"
              className={linkClasses("/settings")}
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">
            {session?.user?.email}
          </span>

          <button
            onClick={signOut}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;