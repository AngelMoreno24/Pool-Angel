import React from 'react'
import { UserAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, requiredRole, allowedRoles = [] }) => {
    const { session, role, loading } = UserAuth();

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!session) {
        return <Navigate to="/signin" replace />;
    }

    const normalizedRole = role?.toUpperCase();
    const rolesToAllow = allowedRoles.length ? allowedRoles : requiredRole ? [requiredRole] : [];

    if (rolesToAllow.length > 0) {
        const matchesAllowedRole = rolesToAllow.some((value) => value?.toUpperCase() === normalizedRole);
        if (!matchesAllowedRole) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
}

export default PrivateRoute