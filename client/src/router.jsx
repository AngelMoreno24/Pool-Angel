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

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Signup />,
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
        element: <Technicians />,
      },
    ],
  },
]);