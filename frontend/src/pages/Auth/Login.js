// frontend/src/pages/Auth/Login.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Collapse
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ApiTester from '../../components/Common/ApiTester';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showDebug, setShowDebug] = useState(false);
  const { login, loading, error, clearError, apiStatus } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            D-Nothi System
          </Typography>
          <Typography component="h2" variant="h5" align="center" gutterBottom>
            Sign In
          </Typography>

          {apiStatus === 'unhealthy' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Unable to connect to server. Please check your connection.
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>

          {/* Test credentials reminder */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Test Credentials:</strong><br />
              sysadmin@dnothi.com / password123<br />
              admin@dnothi.com / password123<br />
              supervisor@dnothi.com / password123<br />
              agent@dnothi.com / password123
            </Typography>
          </Alert>

          {/* Debug toggle */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button 
              size="small" 
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
            </Button>
          </Box>

          <Collapse in={showDebug}>
            <ApiTester />
          </Collapse>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;