// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { SnackbarProvider } from 'notistack';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/Common/ErrorBoundary';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Tasks from './pages/Tasks/Tasks';
import Leaves from './pages/Leaves/Leaves';
import Users from './pages/Admin/Users';
import AdminPanel from './pages/Admin/AdminPanel';
import AuditLogs from './pages/Admin/AuditLogs';
import Reports from './pages/Reports/Reports';
import Profile from './pages/Profile/Profile';

// Simple loading component
const LoadingScreen = () => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="100vh"
  >
    <CircularProgress size={60} />
    <Typography variant="h6" sx={{ mt: 2 }}>
      Loading D-Nothi System...
    </Typography>
  </Box>
);

// Error display component
const ErrorDisplay = ({ error, onRetry }) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="100vh"
    p={3}
  >
    <Alert severity="error" sx={{ maxWidth: 600, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Application Error
      </Typography>
      <Typography variant="body2">
        {error.message}
      </Typography>
    </Alert>
    <Button variant="contained" onClick={onRetry}>
      Try Again
    </Button>
  </Box>
);

// Protected route component
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. You don't have permission to view this page.
        </Alert>
      </Box>
    );
  }

  return children;
};

// Main App Component
function AppContent() {
  const { isAuthenticated, loading, error, clearError } = useAuth();
  const [appError, setAppError] = React.useState(null);

  React.useEffect(() => {
    // Global error handler
    const handleError = (event) => {
      console.error('Global error:', event.error);
      setAppError(event.error || new Error('Unknown error occurred'));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  const handleRetry = () => {
    setAppError(null);
    clearError();
    window.location.reload();
  };

  if (appError) {
    return <ErrorDisplay error={appError} onRetry={handleRetry} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tasks" 
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/leaves" 
          element={
            <ProtectedRoute>
              <Leaves />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute requiredRoles={['SystemAdmin', 'Admin']}>
              <Users />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/panel" 
          element={
            <ProtectedRoute requiredRoles={['SystemAdmin', 'Admin']}>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/audit-logs" 
          element={
            <ProtectedRoute requiredRoles={['SystemAdmin', 'Admin']}>
              <AuditLogs />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute requiredRoles={['SystemAdmin', 'Admin', 'Supervisor']}>
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="*" 
          element={
            <Box sx={{ p: 3 }}>
              <Alert severity="info">
                Page not found. Please check the URL or navigate using the menu.
              </Alert>
            </Box>
          } 
        />
      </Routes>
    </Router>
  );
}

function App() {
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
  });

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3}>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;