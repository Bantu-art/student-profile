import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { signIn, signOut, getCurrentUser, isAuthenticated } from '../services/authService';

// Authentication action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  INITIALIZE: 'INITIALIZE',
};

// Initial authentication state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Authentication reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.INITIALIZE:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: action.payload.isAuthenticated,
        isLoading: false,
        error: null,
      };

    default:
      return state;
  }
};

// Create Authentication Context
const AuthContext = createContext();

// Authentication Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = () => {
      const user = getCurrentUser();
      const authenticated = isAuthenticated();
      
      dispatch({
        type: AUTH_ACTIONS.INITIALIZE,
        payload: {
          user,
          token: authenticated ? localStorage.getItem('authToken') : null,
          isAuthenticated: authenticated,
        },
      });
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (identifier, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const result = await signIn(identifier, password);

      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: result.user,
            token: result.token,
          },
        });
        return { success: true, message: result.message };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: { error: result.error },
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage },
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    signOut();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Clear error function
  const clearError = () => {
    dispatch({
      type: AUTH_ACTIONS.LOGIN_FAILURE,
      payload: { error: null },
    });
  };

  // Context value
  const value = {
    ...state,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
