// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress, Typography, Alert } from '@mui/material';
import { SnackbarProvider } from 'notistack';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';

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

// Error boundary component
const ErrorDisplay = ({ error }) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="100vh"
    p={3}
  >
    <Alert severity="error" sx={{ maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Application Error
      </Typography>
      <Typography variant="body2">
        {error.message}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        Please check the console for more details.
      </Typography>
    </Alert>
  </Box>
);

// Main App Component
function AppContent() {
  const { isAuthenticated, loading, error } = useAuth();
  const [appError, setAppError] = useState(null);

  useEffect(() => {
    // Global error handler
    const handleError = (event) => {
      setAppError(event.error || new Error('Unknown error occurred'));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (appError) {
    return <ErrorDisplay error={appError} />;
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
            isAuthenticated ? (
              <Layout>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        {/* Add a fallback route */}
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
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;