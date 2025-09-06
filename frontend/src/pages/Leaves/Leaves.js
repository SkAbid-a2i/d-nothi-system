// pages/Leaves/Leaves.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Check as ApproveIcon,
  Close as RejectIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { enqueueSnackbar } from 'notistack';
import { LEAVE_STATUS, STATUS_COLORS } from '../../utils/constants';

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [statusAction, setStatusAction] = useState('');
  const { user } = useAuth();
  const { dropdownData, setDropdownData } = useApp();

  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: null,
    end_date: null,
    reason: ''
  });

  const [statusFormData, setStatusFormData] = useState({
    comments: ''
  });

  const [filters, setFilters] = useState({
    status: '',
    leave_type_id: '',
    start_date: null,
    end_date: null
  });

  useEffect(() => {
    fetchLeaves();
    fetchDropdownData();
  }, [pagination.page, pagination.limit, filters]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page + 1,
        limit: pagination.limit,
        ...filters
      };

      // Clean up params
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await axios.get('/api/leaves', { params });
      setLeaves(response.data.leaves);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (error) {
      console.error('Error fetching leaves:', error);
      enqueueSnackbar('Error fetching leaves', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [leaveTypesRes] = await Promise.all([
        axios.get('/api/dropdowns/leave-types')
      ]);

      setDropdownData({
        leaveTypes: leaveTypesRes.data.leaveTypes
      });
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleMenuOpen = (event, leave) => {
    setAnchorEl(event.currentTarget);
    setSelectedLeave(leave);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLeave(null);
  };

  const handleDialogOpen = () => {
    setFormData({
      leave_type_id: '',
      start_date: null,
      end_date: null,
      reason: ''
    });
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setFormData({
      leave_type_id: '',
      start_date: null,
      end_date: null,
      reason: ''
    });
  };

  const handleStatusDialogOpen = (action) => {
    setStatusAction(action);
    setStatusFormData({ comments: '' });
    setOpenStatusDialog(true);
    handleMenuClose();
  };

  const handleStatusDialogClose = () => {
    setOpenStatusDialog(false);
    setStatusAction('');
    setStatusFormData({ comments: '' });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/leaves', formData);
      enqueueSnackbar('Leave request submitted successfully', { variant: 'success' });
      handleDialogClose();
      fetchLeaves();
    } catch (error) {
      console.error('Error creating leave:', error);
      enqueueSnackbar('Error creating leave request', { variant: 'error' });
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`/api/leaves/${selectedLeave.id}/status`, {
        status: statusAction,
        comments: statusFormData.comments
      });
      enqueueSnackbar(`Leave request ${statusAction.toLowerCase()} successfully`, { variant: 'success' });
      handleStatusDialogClose();
      fetchLeaves();
    } catch (error) {
      console.error('Error updating leave status:', error);
      enqueueSnackbar('Error updating leave status', { variant: 'error' });
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (event) => {
    setPagination(prev => ({ ...prev, limit: parseInt(event.target.value, 10), page: 0 }));
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'default';
  };

  const canApproveReject = (leave) => {
    return ['Supervisor', 'Admin', 'SystemAdmin'].includes(user.role) && 
           leave.status === LEAVE_STATUS.PENDING &&
           leave.user_id !== user.id;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Leave Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleDialogOpen}
        >
          Request Leave
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Leave Type</InputLabel>
              <Select
                value={filters.leave_type_id}
                label="Leave Type"
                onChange={(e) => handleFilterChange('leave_type_id', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {dropdownData.leaveTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Leaves Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Leave Type</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.map((leave) => (
              <TableRow key={leave.id}>
                <TableCell>{leave.user_name}</TableCell>
                <TableCell>{leave.leave_type_name}</TableCell>
                <TableCell>
                  {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                    {leave.reason}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={leave.status}
                    size="small"
                    color={getStatusColor(leave.status)}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, leave)}
                  >
                    <MoreIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={pagination.total}
        page={pagination.page}
        onPageChange={handlePageChange}
        rowsPerPage={pagination.limit}
        onRowsPerPageChange={handleLimitChange}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {canApproveReject(selectedLeave) && (
          <>
            <MenuItem onClick={() => handleStatusDialogOpen('Approved')}>
              <ApproveIcon sx={{ mr: 1, color: 'success.main' }} /> Approve
            </MenuItem>
            <MenuItem onClick={() => handleStatusDialogOpen('Rejected')}>
              <RejectIcon sx={{ mr: 1, color: 'error.main' }} /> Reject
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Leave Request Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Request Leave</DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Leave Type</InputLabel>
                  <Select
                    value={formData.leave_type_id}
                    label="Leave Type"
                    onChange={(e) => setFormData(prev => ({ ...prev, leave_type_id: e.target.value }))}
                  >
                    {dropdownData.leaveTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={formData.start_date}
                    onChange={(date) => setFormData(prev => ({ ...prev, start_date: date }))}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={formData.end_date}
                    onChange={(date) => setFormData(prev => ({ ...prev, end_date: date }))}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              Submit Request
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={openStatusDialog} onClose={handleStatusDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {statusAction === 'Approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
        </DialogTitle>
        <form onSubmit={handleStatusSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Comments"
              value={statusFormData.comments}
              onChange={(e) => setStatusFormData({ comments: e.target.value })}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleStatusDialogClose}>Cancel</Button>
            <Button type="submit" variant="contained" color={statusAction === 'Approved' ? 'success' : 'error'}>
              {statusAction === 'Approved' ? 'Approve' : 'Reject'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Leaves;