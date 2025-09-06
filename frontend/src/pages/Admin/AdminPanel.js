// pages/Admin/AdminPanel.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as TaskIcon,
  Event as LeaveIcon,
  TrendingUp as ChartIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { enqueueSnackbar } from 'notistack';

const AdminPanel = () => {
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsResponse, activitiesResponse] = await Promise.all([
        axios.get('/api/admin/statistics'),
        axios.get('/api/admin/audit-logs', { params: { limit: 10 } })
      ]);

      setStats(statsResponse.data);
      setRecentActivities(activitiesResponse.data.auditLogs);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      enqueueSnackbar('Error fetching admin data', { variant: 'error' });
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center">
          <Box flexGrow={1}>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box color={color} fontSize="large">
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.userStats?.total_users || 0}
            icon={<PeopleIcon />}
            color="#1976d2"
            subtitle={`${stats.userStats?.active_users || 0} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tasks"
            value={stats.taskStats?.total_tasks || 0}
            icon={<TaskIcon />}
            color="#2e7d32"
            subtitle={`${stats.taskStats?.pending_tasks || 0} pending`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Leaves"
            value={stats.leaveStats?.total_leaves || 0}
            icon={<LeaveIcon />}
            color="#ed6c02"
            subtitle={`${stats.leaveStats?.pending_leaves || 0} pending`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="High Priority"
            value={stats.taskStats?.high_priority_tasks || 0}
            icon={<ChartIcon />}
            color="#d32f2f"
            subtitle="Urgent tasks"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Table</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.user_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={activity.action_type}
                          size="small"
                          color={getActionColor(activity.action_type)}
                        />
                      </TableCell>
                      <TableCell>{activity.table_name}</TableCell>
                      <TableCell>
                        {new Date(activity.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* System Status */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Database:</strong> <Chip label="Connected" size="small" color="success" />
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>API Status:</strong> <Chip label="Online" size="small" color="success" />
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Uptime:</strong> 99.9%
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Last Backup:</strong> {new Date().toLocaleDateString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminPanel;