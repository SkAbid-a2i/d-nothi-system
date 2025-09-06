// frontend/src/contexts/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_START':
      return { ...state, loading: true, error: null };
    case 'INIT_SUCCESS':
      return { ...state, loading: false, user: action.payload, isAuthenticated: true, error: null };
    case 'INIT_FAILURE':
      return { ...state, loading: false, error: action.payload, isAuthenticated: false, user: null };
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, loading: false, user: action.payload, isAuthenticated: true, error: null };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload, isAuthenticated: false, user: null };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, error: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_API_STATUS':
      return { ...state, apiStatus: action.payload };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  apiStatus: 'unknown'
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check API health
  const checkApiHealth = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://d-nothi-backend.onrender.com';
      const response = await axios.get(`${API_URL}/api/health`, {
        timeout: 10000
      });
      dispatch({ type: 'SET_API_STATUS', payload: 'healthy' });
      return true;
    } catch (error) {
      console.error('API health check failed:', error);
      dispatch({ type: 'SET_API_STATUS', payload: 'unhealthy' });
      return false;
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'INIT_START' });
      
      // First check if API is available
      const isApiHealthy = await checkApiHealth();
      if (!isApiHealthy) {
        dispatch({ type: 'INIT_FAILURE', payload: 'Cannot connect to server. Please try again later.' });
        return;
      }

      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          dispatch({ type: 'INIT_FAILURE', payload: 'No authentication token found' });
          return;
        }

        const API_URL = process.env.REACT_APP_API_URL || 'https://d-nothi-backend.onrender.com';
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          withCredentials: true,
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.user) {
          dispatch({ type: 'INIT_SUCCESS', payload: response.data.user });
        } else {
          dispatch({ type: 'INIT_FAILURE', payload: 'Invalid user data' });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        let errorMessage = 'Authentication check failed';
        
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          errorMessage = 'Cannot connect to server. Please check your connection.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          localStorage.removeItem('token');
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        dispatch({ type: 'INIT_FAILURE', payload: errorMessage });
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://d-nothi-backend.onrender.com';
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      }, {
        withCredentials: true,
        timeout: 10000
      });

      localStorage.setItem('token', response.data.token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.user });
      return response.data;
    } catch (error) {
      let message = 'Login failed. Please check your credentials.';
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        message = 'Cannot connect to server. Please check your connection.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://d-nothi-backend.onrender.com';
      await axios.post(`${API_URL}/api/auth/logout`, {}, {
        withCredentials: true,
        timeout: 5000
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      clearError,
      checkApiHealth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};