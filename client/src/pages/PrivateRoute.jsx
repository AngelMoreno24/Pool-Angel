import React from 'react'
import { UserAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({children}) => {
    const { session, loading } = UserAuth();

if (loading) return <p>Loading...</p>;

return session ? children : <Navigate to="/signin" replace />;
}

export default PrivateRoute