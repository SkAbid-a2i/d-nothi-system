// src/pages/Admin/Users.js
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
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { enqueueSnackbar } from 'notistack';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('create');
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    email: '',
    password: '',
    role: 'Agent',
    department: '',
    designation: '',
    is_active: true
  });

  const [filters, setFilters] = useState({
    role: '',
    is_active: '',
    search: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, filters]);

  const fetchUsers = async () => {
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

      const response = await axios.get('/api/users', { params });
      setUsers(response.data.users);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      enqueueSnackbar('Error fetching users', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleDialogOpen = (type, user = null) => {
    setDialogType(type);
    if (user) {
      setFormData({
        employee_id: user.employee_id,
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        department: user.department || '',
        designation: user.designation || '',
        is_active: user.is_active
      });
    } else {
      setFormData({
        employee_id: '',
        name: '',
        email: '',
        password: '',
        role: 'Agent',
        department: '',
        designation: '',
        is_active: true
      });
    }
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setFormData({
      employee_id: '',
      name: '',
      email: '',
      password: '',
      role: 'Agent',
      department: '',
      designation: '',
      is_active: true
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (dialogType === 'create') {
        await axios.post('/api/auth/register', formData);
        enqueueSnackbar('User created successfully', { variant: 'success' });
      } else {
        await axios.put(`/api/users/${selectedUser.id}`, formData);
        enqueueSnackbar('User updated successfully', { variant: 'success' });
      }

      handleDialogClose();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      enqueueSnackbar('Error saving user', { variant: 'error' });
    }
  };

  const handleRoleChange = async (newRole) => {
    try {
      await axios.patch(`/api/users/${selectedUser.id}/role`, { role: newRole });
      enqueueSnackbar('User role updated successfully', { variant: 'success' });
      handleMenuClose();
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      enqueueSnackbar('Error updating user role', { variant: 'error' });
    }
  };

  const handleStatusChange = async (isActive) => {
    try {
      await axios.patch(`/api/users/${selectedUser.id}/active`, { is_active: isActive });
      enqueueSnackbar(`User ${isActive ? 'activated' : 'deactivated'} successfully`, { variant: 'success' });
      handleMenuClose();
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      enqueueSnackbar('Error updating user status', { variant: 'error' });
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

  const getRoleColor = (role) => {
    switch (role) {
      case 'SystemAdmin': return 'error';
      case 'Admin': return 'warning';
      case 'Supervisor': return 'info';
      case 'Agent': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen('create')}
        >
          New User
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={filters.role}
              label="Role"
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="SystemAdmin">System Admin</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Supervisor">Supervisor</MenuItem>
              <MenuItem value="Agent">Agent</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.is_active}
              label="Status"
              onChange={(e) => handleFilterChange('is_active', e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Search"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            sx={{ minWidth: 200 }}
          />
        </Box>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.employee_id}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    {user.name}
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    size="small"
                    color={getRoleColor(user.role)}
                  />
                </TableCell>
                <TableCell>{user.department || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    color={getStatusColor(user.is_active)}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, user)}
                    disabled={user.id === currentUser.id} // Can't edit yourself
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
        <MenuItem onClick={() => handleDialogOpen('edit', selectedUser)}>
          <EditIcon sx={{ mr: 1 }} /> Edit Details
        </MenuItem>
        {currentUser.role === 'SystemAdmin' && selectedUser?.role !== 'SystemAdmin' && (
          <MenuItem onClick={() => handleRoleChange('SystemAdmin')}>
            Make System Admin
          </MenuItem>
        )}
        {['SystemAdmin', 'Admin'].includes(currentUser.role) && selectedUser?.role !== 'Admin' && (
          <MenuItem onClick={() => handleRoleChange('Admin')}>
            Make Admin
          </MenuItem>
        )}
        {['SystemAdmin', 'Admin'].includes(currentUser.role) && selectedUser?.role !== 'Supervisor' && (
          <MenuItem onClick={() => handleRoleChange('Supervisor')}>
            Make Supervisor
          </MenuItem>
        )}
        {['SystemAdmin', 'Admin'].includes(currentUser.role) && selectedUser?.role !== 'Agent' && (
          <MenuItem onClick={() => handleRoleChange('Agent')}>
            Make Agent
          </MenuItem>
        )}
        {selectedUser?.id !== currentUser.id && (
          <MenuItem onClick={() => handleStatusChange(!selectedUser.is_active)}>
            {selectedUser?.is_active ? 'Deactivate' : 'Activate'}
          </MenuItem>
        )}
      </Menu>

      {/* User Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'create' ? 'Create New User' : 'Edit User'}
        </DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="Employee ID"
                value={formData.employee_id}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                required
              />
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              {dialogType === 'create' && (
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  helperText="Password must be at least 6 characters"
                />
              )}
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                >
                  <MenuItem value="Agent">Agent</MenuItem>
                  <MenuItem value="Supervisor">Supervisor</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  {currentUser.role === 'SystemAdmin' && (
                    <MenuItem value="SystemAdmin">System Admin</MenuItem>
                  )}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              />
              <TextField
                fullWidth
                label="Designation"
                value={formData.designation}
                onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
              />
              {dialogType === 'edit' && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                  }
                  label="Active"
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {dialogType === 'create' ? 'Create' : 'Update'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Users;