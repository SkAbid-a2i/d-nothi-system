// src/pages/Dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Event as LeaveIcon,
  People as UserIcon,
  TrendingUp as ChartIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, tasksResponse, leavesResponse] = await Promise.all([
        axios.get('/api/admin/statistics'),
        axios.get('/api/tasks', {
          params: { 
            limit: 5,
            ...(user.role === 'Agent' && { assigned_to: user.id })
          }
        }),
        axios.get('/api/leaves', {
          params: { 
            limit: 5,
            ...(user.role === 'Agent' && { user_id: user.id })
          }
        })
      ]);

      setStats(statsResponse.data);
      setRecentTasks(tasksResponse.data.tasks);
      setRecentLeaves(leavesResponse.data.leaves);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
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
          </Box>
          <Box color={color}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return 'success';
      case 'In Progress':
        return 'warning';
      case 'Pending':
        return 'info';
      case 'Cancelled':
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {['SystemAdmin', 'Admin'].includes(user.role) && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Users"
                value={stats.userStats?.total_users || 0}
                icon={<UserIcon fontSize="large" />}
                color="#1976d2"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Tasks"
                value={stats.taskStats?.total_tasks || 0}
                icon={<TaskIcon fontSize="large" />}
                color="#2e7d32"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pending Leaves"
                value={stats.leaveStats?.pending_leaves || 0}
                icon={<LeaveIcon fontSize="large" />}
                color="#ed6c02"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="High Priority Tasks"
                value={stats.taskStats?.high_priority_tasks || 0}
                icon={<ChartIcon fontSize="large" />}
                color="#d32f2f"
              />
            </Grid>
          </Grid>
        </>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Tasks
            </Typography>
            <List>
              {recentTasks.map((task, index) => (
                <React.Fragment key={task.id}>
                  <ListItem>
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={task.status}
                            size="small"
                            color={getStatusColor(task.status)}
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={task.priority}
                            size="small"
                            variant="outlined"
                          />
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentTasks.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {recentTasks.length === 0 && (
                <ListItem>
                  <ListItemText primary="No tasks found" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Leave Requests
            </Typography>
            <List>
              {recentLeaves.map((leave, index) => (
                <React.Fragment key={leave.id}>
                  <ListItem>
                    <ListItemText
                      primary={`${leave.leave_type_name} - ${user.role !== 'Agent' ? leave.user_name : ''}`}
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={leave.status}
                            size="small"
                            color={getStatusColor(leave.status)}
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="body2" color="textSecondary">
                            {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }} noWrap>
                            {leave.reason}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentLeaves.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {recentLeaves.length === 0 && (
                <ListItem>
                  <ListItemText primary="No leave requests found" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;