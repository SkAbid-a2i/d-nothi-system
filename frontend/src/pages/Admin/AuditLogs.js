// src/pages/Admin/AuditLogs.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { enqueueSnackbar } from 'notistack';

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    user_id: '',
    action_type: '',
    table_name: '',
    start_date: null,
    end_date: null,
    search: ''
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [pagination.page, pagination.limit, filters]);

  const fetchAuditLogs = async () => {
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

      const response = await axios.get('/api/admin/audit-logs', { params });
      setAuditLogs(response.data.auditLogs);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      enqueueSnackbar('Error fetching audit logs', { variant: 'error' });
    } finally {
      setLoading(false);
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

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  const formatJSON = (data) => {
    if (!data) return 'N/A';
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return data;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Audit Logs
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            label="Search"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            sx={{ minWidth: 200 }}
            InputProps={{
              endAdornment: <SearchIcon />
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Action Type</InputLabel>
            <Select
              value={filters.action_type}
              label="Action Type"
              onChange={(e) => handleFilterChange('action_type', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="CREATE">Create</MenuItem>
              <MenuItem value="UPDATE">Update</MenuItem>
              <MenuItem value="DELETE">Delete</MenuItem>
              <MenuItem value="UPDATE_STATUS">Update Status</MenuItem>
              <MenuItem value="UPDATE_ROLE">Update Role</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Table</InputLabel>
            <Select
              value={filters.table_name}
              label="Table"
              onChange={(e) => handleFilterChange('table_name', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="users">Users</MenuItem>
              <MenuItem value="tasks">Tasks</MenuItem>
              <MenuItem value="leaves">Leaves</MenuItem>
              <MenuItem value="audit_logs">Audit Logs</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Audit Logs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Table</TableCell>
              <TableCell>Record ID</TableCell>
              <TableCell>Old Values</TableCell>
              <TableCell>New Values</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.user_name}</TableCell>
                <TableCell>
                  <Chip
                    label={log.action_type}
                    size="small"
                    color={getActionColor(log.action_type)}
                  />
                </TableCell>
                <TableCell>{log.table_name}</TableCell>
                <TableCell>{log.record_id || 'N/A'}</TableCell>
                <TableCell>
                  <Box sx={{ maxWidth: 200, overflow: 'auto' }}>
                    <pre style={{ fontSize: '0.75rem', margin: 0 }}>
                      {formatJSON(log.old_values)}
                    </pre>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ maxWidth: 200, overflow: 'auto' }}>
                    <pre style={{ fontSize: '0.75rem', margin: 0 }}>
                      {formatJSON(log.new_values)}
                    </pre>
                  </Box>
                </TableCell>
                <TableCell>{log.ip_address}</TableCell>
                <TableCell>
                  {new Date(log.created_at).toLocaleString()}
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
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Box>
  );
};

export default AuditLogs;