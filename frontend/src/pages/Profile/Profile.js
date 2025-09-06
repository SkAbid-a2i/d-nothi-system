// src/pages/Profile/Profile.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import { Save as SaveIcon, Person as PersonIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { enqueueSnackbar } from 'notistack';

const Profile = () => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    employee_id: '',
    department: '',
    designation: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        employee_id: user.employee_id || '',
        department: user.department || '',
        designation: user.designation || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await axios.put(`/api/users/${user.id}`, profileData);
      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
      
      // Update user context if needed
      window.location.reload(); // Simple way to refresh user data
    } catch (error) {
      console.error('Error updating profile:', error);
      enqueueSnackbar('Error updating profile', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4">Profile</Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          Please log in to view your profile.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <PersonIcon sx={{ mr: 2, fontSize: 40 }} color="primary" />
              <Box>
                <Typography variant="h6">Personal Information</Typography>
                <Typography variant="body2" color="textSecondary">
                  Update your personal details
                </Typography>
              </Box>
            </Box>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Employee ID"
                    name="employee_id"
                    value={profileData.employee_id}
                    onChange={handleChange}
                    disabled
                    helperText="Employee ID cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={user.role}
                    disabled
                    helperText="Role is assigned by administrator"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    name="department"
                    value={profileData.department}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Designation"
                    name="designation"
                    value={profileData.designation}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Status
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Chip
                label={user.is_active ? 'Active' : 'Inactive'}
                color={user.is_active ? 'success' : 'error'}
                sx={{ mr: 1 }}
              />
              <Chip
                label={user.role}
                color="primary"
                variant="outlined"
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" color="textSecondary">
              Member since: {new Date(user.created_at).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Last updated: {new Date(user.updated_at).toLocaleDateString()}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="outlined"
              color="error"
              onClick={logout}
              fullWidth
            >
              Logout
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;