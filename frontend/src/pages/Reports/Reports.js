// pages/Reports/Reports.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Download as DownloadIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import TaskChart from '../../components/Charts/TaskChart';
import { enqueueSnackbar } from 'notistack';

const Reports = () => {
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('tasks');
  const { user } = useAuth();
  const { dropdownData } = useApp();

  const [filters, setFilters] = useState({
    start_date: null,
    end_date: null,
    status: '',
    category_id: '',
    assigned_to: ''
  });

  useEffect(() => {
    fetchReportData();
  }, [filters, reportType]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        start_date: filters.start_date ? filters.start_date.toISOString().split('T')[0] : null,
        end_date: filters.end_date ? filters.end_date.toISOString().split('T')[0] : null
      };

      // Clean up params
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      const endpoint = reportType === 'tasks' ? '/api/reports/tasks' : '/api/reports/leaves';
      const response = await axios.get(endpoint, { params });

      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      enqueueSnackbar('Error fetching report data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = async (format) => {
    try {
      const params = {
        ...filters,
        start_date: filters.start_date ? filters.start_date.toISOString().split('T')[0] : null,
        end_date: filters.end_date ? filters.end_date.toISOString().split('T')[0] : null,
        format
      };

      // Clean up params
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await axios.get('/api/reports/export', {
        params,
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      enqueueSnackbar('Report exported successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error exporting report:', error);
      enqueueSnackbar('Error exporting report', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Reports</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('csv')}
            sx={{ mr: 1 }}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('pdf')}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="tasks">Tasks</MenuItem>
                <MenuItem value="leaves">Leaves</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.start_date}
                onChange={(date) => handleFilterChange('start_date', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={filters.end_date}
                onChange={(date) => handleFilterChange('end_date', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {reportType === 'tasks' && (
            <>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category_id}
                    label="Category"
                    onChange={(e) => handleFilterChange('category_id', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {dropdownData.categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    value={filters.assigned_to}
                    label="Assigned To"
                    onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {dropdownData.users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {/* Report Content */}
      {reportType === 'tasks' && reportData.summary && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Task Report Summary
              </Typography>
              <TaskChart data={reportData.summary} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Total Tasks:</strong> {reportData.summary.total}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Pending:</strong> {reportData.summary.byStatus.Pending || 0}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>In Progress:</strong> {reportData.summary.byStatus['In Progress'] || 0}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Completed:</strong> {reportData.summary.byStatus.Completed || 0}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>High Priority:</strong> {reportData.summary.byPriority.High || 0}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {reportType === 'leaves' && reportData.summary && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Leave Report Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                <strong>Total Leaves:</strong> {reportData.summary.total}
              </Typography>
              <Typography variant="body2">
                <strong>Pending:</strong> {reportData.summary.byStatus.Pending || 0}
              </Typography>
              <Typography variant="body2">
                <strong>Approved:</strong> {reportData.summary.byStatus.Approved || 0}
              </Typography>
              <Typography variant="body2">
                <strong>Rejected:</strong> {reportData.summary.byStatus.Rejected || 0}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default Reports;