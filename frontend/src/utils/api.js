// frontend/src/utils/api.js
import axios from 'axios';

// Use environment variable or fallback to production URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://d-nothi-backend.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  logout: () => api.post('/api/auth/logout'),
  register: (userData) => api.post('/api/auth/register', userData),
  getCurrentUser: () => api.get('/api/auth/me'),
};

export const usersAPI = {
  getUsers: (params) => api.get('/api/users', { params }),
  getUser: (id) => api.get(`/api/users/${id}`),
  updateUser: (id, userData) => api.put(`/api/users/${id}`, userData),
  updateUserRole: (id, roleData) => api.patch(`/api/users/${id}/role`, roleData),
  toggleUserActive: (id, activeData) => api.patch(`/api/users/${id}/active`, activeData),
};

export const tasksAPI = {
  getTasks: (params) => api.get('/api/tasks', { params }),
  getTask: (id) => api.get(`/api/tasks/${id}`),
  createTask: (taskData) => api.post('/api/tasks', taskData),
  updateTask: (id, taskData) => api.put(`/api/tasks/${id}`, taskData),
  deleteTask: (id) => api.delete(`/api/tasks/${id}`),
  updateTaskStatus: (id, statusData) => api.patch(`/api/tasks/${id}/status`, statusData),
};

export const leavesAPI = {
  getLeaves: (params) => api.get('/api/leaves', { params }),
  getLeave: (id) => api.get(`/api/leaves/${id}`),
  createLeave: (leaveData) => api.post('/api/leaves', leaveData),
  updateLeaveStatus: (id, statusData) => api.patch(`/api/leaves/${id}/status`, statusData),
};

export const adminAPI = {
  getStatistics: () => api.get('/api/admin/statistics'),
  getAuditLogs: (params) => api.get('/api/admin/audit-logs', { params }),
};

export const reportsAPI = {
  getTaskReports: (params) => api.get('/api/reports/tasks', { params }),
  getLeaveReports: (params) => api.get('/api/reports/leaves', { params }),
};

export const dropdownsAPI = {
  getCategories: () => api.get('/api/dropdowns/categories'),
  getServices: (params) => api.get('/api/dropdowns/services', { params }),
  getOffices: () => api.get('/api/dropdowns/offices'),
  getSources: () => api.get('/api/dropdowns/sources'),
  getLeaveTypes: () => api.get('/api/dropdowns/leave-types'),
};

export default api;