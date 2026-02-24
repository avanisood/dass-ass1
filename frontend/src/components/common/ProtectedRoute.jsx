import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Box, Typography } from '@mui/material';

// Protected Route component - restricts access based on authentication and role
const ProtectedRoute = ({ children, allowedRoles }) => {
  // Get current user from AuthContext
  const { user, loading } = useContext(AuthContext);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles specified, check if user role is in the list
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User role not in allowedRoles - redirect to their dashboard
    const dashboardPath = `/${user.role}/dashboard`;
    return <Navigate to={dashboardPath} replace />;
  }

  // User is authorized, render children
  return children;
};

export default ProtectedRoute;
