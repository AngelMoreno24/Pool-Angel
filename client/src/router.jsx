import { createBrowserRouter } from 'react-router-dom'
import App from './App'

import Signup  from './pages/Signup'
import Signin from './pages/Signin';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import PrivateRoute from './pages/PrivateRoute';
import Customer from './pages/Customer';
import Pools from './pages/Pools';
import ProtectedLayout from './pages/ProtectedLayout';
import CustomerDetails from './pages/CustomerDetails';
import PropertyDetails from './pages/PropertyDetails';
import Technicians from './pages/Technicians';
import TechnicianDetails from './pages/TechnicianDetails';
import Job from './pages/Job';
import JobDetails from './pages/JobDetails';
import Route from './pages/Route';
import TechRoute from './pages/TechRoute';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Signin />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/signin",
    element: <Signin />,
  },
  {
    element: (
      <PrivateRoute>
        <ProtectedLayout />
      </PrivateRoute>
    ),
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/customers",
        element: <Customer />,
      },
      {
        path: "/customers/:id",
        element: <CustomerDetails />,
      },
      {
        path: "/properties/:id",
        element: <PropertyDetails />,
      },
      {
        path: "/pools",
        element: <Pools />,
      },
      {
        path: "/technicians",
        element: (
          <PrivateRoute requiredRole="OWNER">
            <Technicians />
          </PrivateRoute>
        ),
      },
      {
        path: "/technicians/:id",
        element: (
          <PrivateRoute requiredRole="OWNER">
            <TechnicianDetails />
          </PrivateRoute>
        ),
      },
      {
        path: "/jobs",
        element: (
          <PrivateRoute requiredRole="OWNER">
            <Job />
          </PrivateRoute>
        ),
      },
      {
        path: "/jobs/:id",
        element: <PrivateRoute><JobDetails /></PrivateRoute>,
      },
      {
        path: "/route",
        element: (
          <PrivateRoute requiredRole="OWNER">
            <Route />
          </PrivateRoute>
        ),
      },
      {
        path: "/my-route",
        element: (
          <PrivateRoute >
            <TechRoute />
          </PrivateRoute>
        ),
      },
    ],
  },
]);