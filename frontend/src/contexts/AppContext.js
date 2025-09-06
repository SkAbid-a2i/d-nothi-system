// frontend/src/contexts/AppContext.js
import React, { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SUCCESS':
      return { ...state, success: action.payload };
    case 'SET_DROPDOWN_DATA':
      return { ...state, dropdownData: { ...state.dropdownData, ...action.payload } };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    default:
      return state;
  }
};

const initialState = {
  loading: false,
  error: null,
  success: null,
  dropdownData: {
    categories: [],
    services: [],
    offices: [],
    sources: [],
    leaveTypes: [],
    users: []
  },
  notifications: []
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const setSuccess = (success) => {
    dispatch({ type: 'SET_SUCCESS', payload: success });
  };

  const setDropdownData = (data) => {
    dispatch({ type: 'SET_DROPDOWN_DATA', payload: data });
  };

  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  };

  return (
    <AppContext.Provider value={{
      ...state,
      setLoading,
      setError,
      setSuccess,
      setDropdownData,
      clearNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};