import { createBrowserRouter } from 'react-router-dom'
import App from './App'

import Signup  from './pages/Signup'
import Signin from './pages/Signin';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';

export const router = createBrowserRouter([
    {path: '/', element: <Home />},//mnaybe switch this to App
    {path: '/signup', element: <Signup />},
    {path: '/signin', element: <Signin />},
    {path: '/dashboard', element: <Dashboard />}


]);