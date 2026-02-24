import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import dreamyTheme from './theme/dreamyTheme';
import './theme/dreamyStyles.css';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Participant Pages
import ParticipantDashboard from './pages/participant/Dashboard';
import BrowseEvents from './pages/participant/BrowseEvents';
import ParticipantProfile from './pages/participant/Profile';
import EventDetail from './pages/participant/EventDetail';
import Onboarding from './pages/participant/Onboarding';
import Clubs from './pages/participant/Clubs';
import OrganizerDetail from './pages/participant/OrganizerDetail';

// Organizer Pages
import OrganizerDashboard from './pages/organizer/Dashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import OrganizerEventDetail from './pages/organizer/EventDetail';
import QRScanner from './pages/organizer/QRScanner';
import OrganizerProfile from './pages/organizer/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageOrganizers from './pages/admin/ManageOrganizers';
import ManageEvents from './pages/admin/ManageEvents';
import PasswordRequests from './pages/admin/PasswordRequests';

// Components
import AttendanceDashboard from './components/organizer/AttendanceDashboard';

function App() {
  return (
    <ThemeProvider theme={dreamyTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          {/* Navigation Bar - shows on all pages except login/register */}
          <Navbar />

          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Participant Routes */}
            <Route
              path="/participant/dashboard"
              element={
                <ProtectedRoute allowedRoles={['participant']}>
                  <ParticipantDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/participant/events"
              element={
                <ProtectedRoute allowedRoles={['participant']}>
                  <BrowseEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/participant/events/:id"
              element={
                <ProtectedRoute allowedRoles={['participant']}>
                  <EventDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/participant/profile"
              element={
                <ProtectedRoute allowedRoles={['participant']}>
                  <ParticipantProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/participant/onboarding"
              element={
                <ProtectedRoute allowedRoles={['participant']}>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/participant/clubs"
              element={
                <ProtectedRoute allowedRoles={['participant']}>
                  <Clubs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/participant/organizers/:id"
              element={
                <ProtectedRoute allowedRoles={['participant']}>
                  <OrganizerDetail />
                </ProtectedRoute>
              }
            />

            {/* Organizer Routes */}
            <Route
              path="/organizer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['organizer']}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizer/create-event"
              element={
                <ProtectedRoute allowedRoles={['organizer']}>
                  <CreateEvent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizer/events/:id"
              element={
                <ProtectedRoute allowedRoles={['organizer']}>
                  <OrganizerEventDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizer/qr-scanner"
              element={
                <ProtectedRoute allowedRoles={['organizer']}>
                  <QRScanner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizer/profile"
              element={
                <ProtectedRoute allowedRoles={['organizer']}>
                  <OrganizerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizer/attendance/:eventId"
              element={
                <ProtectedRoute allowedRoles={['organizer']}>
                  <AttendanceDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/organizers"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageOrganizers />
                </ProtectedRoute>
              }
            />
            {/* Alias for old navigation links */}
            <Route path="/admin/manage-organizers" element={<Navigate to="/admin/organizers" replace />} />
            <Route
              path="/admin/events"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/password-requests"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PasswordRequests />
                </ProtectedRoute>
              }
            />

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 404 Not Found */}
            <Route path="*" element={<div style={{ padding: '2rem', textAlign: 'center' }}><h1>404 - Page Not Found</h1></div>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
