// src/pages/Tasks/Tasks.js
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
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { enqueueSnackbar } from 'notistack';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('create');
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [offices, setOffices] = useState([]);
  const [sources, setSources] = useState([]);
  const [users, setUsers] = useState([]);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Pending',
    priority: 'Medium',
    due_date: null,
    assigned_to: '',
    category_id: '',
    service_id: '',
    office_id: '',
    source_id: ''
  });

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigned_to: '',
    category_id: '',
    start_date: null,
    end_date: null,
    search: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchDropdownData();
    if (['SystemAdmin', 'Admin', 'Supervisor'].includes(user.role)) {
      fetchUsers();
    }
  }, [pagination.page, pagination.limit, filters]);

  const fetchTasks = async () => {
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

      const response = await axios.get('/api/tasks', { params });
      setTasks(response.data.tasks);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      enqueueSnackbar('Error fetching tasks', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [categoriesRes, officesRes, sourcesRes] = await Promise.all([
        axios.get('/api/dropdowns/categories'),
        axios.get('/api/dropdowns/offices'),
        axios.get('/api/dropdowns/sources')
      ]);

      setCategories(categoriesRes.data.categories);
      setOffices(officesRes.data.offices);
      setSources(sourcesRes.data.sources);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchServices = async (categoryId) => {
    try {
      const response = await axios.get('/api/dropdowns/services', {
        params: { category_id: categoryId }
      });
      setServices(response.data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleMenuOpen = (event, task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleDialogOpen = (type, task = null) => {
    setDialogType(type);
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ? new Date(task.due_date) : null,
        assigned_to: task.assigned_to,
        category_id: task.category_id || '',
        service_id: task.service_id || '',
        office_id: task.office_id || '',
        source_id: task.source_id || ''
      });
      if (task.category_id) {
        fetchServices(task.category_id);
      }
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'Pending',
        priority: 'Medium',
        due_date: null,
        assigned_to: '',
        category_id: '',
        service_id: '',
        office_id: '',
        source_id: ''
      });
    }
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setFormData({
      title: '',
      description: '',
      status: 'Pending',
      priority: 'Medium',
      due_date: null,
      assigned_to: '',
      category_id: '',
      service_id: '',
      office_id: '',
      source_id: ''
    });
    setServices([]);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        due_date: formData.due_date ? formData.due_date.toISOString().split('T')[0] : null
      };

      if (dialogType === 'create') {
        await axios.post('/api/tasks', payload);
        enqueueSnackbar('Task created successfully', { variant: 'success' });
      } else {
        await axios.put(`/api/tasks/${selectedTask.id}`, payload);
        enqueueSnackbar('Task updated successfully', { variant: 'success' });
      }

      handleDialogClose();
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      enqueueSnackbar('Error saving task', { variant: 'error' });
    }
  };

  const handleDeleteTask = async () => {
    try {
      await axios.delete(`/api/tasks/${selectedTask.id}`);
      enqueueSnackbar('Task deleted successfully', { variant: 'success' });
      handleMenuClose();
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      enqueueSnackbar('Error deleting task', { variant: 'error' });
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await axios.patch(`/api/tasks/${taskId}/status`, { status });
      enqueueSnackbar('Task status updated successfully', { variant: 'success' });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      enqueueSnackbar('Error updating task status', { variant: 'error' });
    }
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setFormData(prev => ({ ...prev, category_id: categoryId, service_id: '' }));
    if (categoryId) {
      fetchServices(categoryId);
    } else {
      setServices([]);
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
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'warning';
      case 'Pending': return 'info';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      case 'Urgent': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Tasks</Typography>
        {user.role !== 'Agent' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleDialogOpen('create')}
          >
            New Task
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
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
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                label="Priority"
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {['SystemAdmin', 'Admin', 'Supervisor'].includes(user.role) && (
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Assigned To</InputLabel>
                <Select
                  value={filters.assigned_to}
                  label="Assigned To"
                  onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tasks Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {task.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" noWrap>
                    {task.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.status}
                    size="small"
                    color={getStatusColor(task.status)}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.priority}
                    size="small"
                    color={getPriorityColor(task.priority)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{task.assigned_to_name}</TableCell>
                <TableCell>
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, task)}
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
        <MenuItem onClick={() => handleDialogOpen('view', selectedTask)}>
          <ViewIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => handleDialogOpen('edit', selectedTask)}>
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        {user.role !== 'Agent' && (
          <MenuItem onClick={handleDeleteTask}>
            <DeleteIcon sx={{ mr: 1 }} /> Delete
          </MenuItem>
        )}
        {user.role === 'Agent' && selectedTask?.assigned_to === user.id && (
          <>
            <MenuItem onClick={() => handleStatusChange(selectedTask.id, 'In Progress')}>
              Mark as In Progress
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange(selectedTask.id, 'Completed')}>
              Mark as Completed
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Task Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'create' ? 'Create New Task' : 
           dialogType === 'edit' ? 'Edit Task' : 'Task Details'}
        </DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  disabled={dialogType === 'view'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  disabled={dialogType === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    disabled={dialogType === 'view'}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Priority"
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    disabled={dialogType === 'view'}
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Due Date"
                    value={formData.due_date}
                    onChange={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                    disabled={dialogType === 'view'}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </LocalizationProvider>
              </Grid>
              {['SystemAdmin', 'Admin', 'Supervisor'].includes(user.role) && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Assigned To</InputLabel>
                    <Select
                      value={formData.assigned_to}
                      label="Assigned To"
                      onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                      disabled={dialogType === 'view'}
                    >
                      {users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category_id}
                    label="Category"
                    onChange={handleCategoryChange}
                    disabled={dialogType === 'view'}
                  >
                    <MenuItem value="">Select Category</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Service</InputLabel>
                  <Select
                    value={formData.service_id}
                    label="Service"
                    onChange={(e) => setFormData(prev => ({ ...prev, service_id: e.target.value }))}
                    disabled={dialogType === 'view' || !formData.category_id}
                  >
                    <MenuItem value="">Select Service</MenuItem>
                    {services.map((service) => (
                      <MenuItem key={service.id} value={service.id}>
                        {service.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Office</InputLabel>
                  <Select
                    value={formData.office_id}
                    label="Office"
                    onChange={(e) => setFormData(prev => ({ ...prev, office_id: e.target.value }))}
                    disabled={dialogType === 'view'}
                  >
                    <MenuItem value="">Select Office</MenuItem>
                    {offices.map((office) => (
                      <MenuItem key={office.id} value={office.id}>
                        {office.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Source</InputLabel>
                  <Select
                    value={formData.source_id}
                    label="Source"
                    onChange={(e) => setFormData(prev => ({ ...prev, source_id: e.target.value }))}
                    disabled={dialogType === 'view'}
                  >
                    <MenuItem value="">Select Source</MenuItem>
                    {sources.map((source) => (
                      <MenuItem key={source.id} value={source.id}>
                        {source.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            {dialogType !== 'view' && (
              <Button type="submit" variant="contained">
                {dialogType === 'create' ? 'Create' : 'Update'}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Tasks;