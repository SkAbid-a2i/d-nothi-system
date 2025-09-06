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
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      dispatch({ type: 'INIT_START' });
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          dispatch({ type: 'INIT_FAILURE', payload: 'No token found' });
          return;
        }

        const response = await axios.get('/api/auth/me', {
          withCredentials: true,
          timeout: 10000 // 10 second timeout
        });
        
        if (response.data.user) {
          dispatch({ type: 'INIT_SUCCESS', payload: response.data.user });
        } else {
          dispatch({ type: 'INIT_FAILURE', payload: 'Invalid user data' });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Don't treat connection errors as authentication failures
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          dispatch({ type: 'INIT_FAILURE', payload: 'Cannot connect to server. Please check your connection.' });
        } else {
          dispatch({ type: 'INIT_FAILURE', payload: error.response?.data?.message || 'Authentication check failed' });
        }
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await axios.post('/api/auth/login', {
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
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, {
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
      clearError
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