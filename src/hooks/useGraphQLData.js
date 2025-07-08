/**
 * Custom React hook for managing GraphQL data fetching
 * Provides a clean interface for fetching and managing user data
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import graphqlService from '../services/graphqlService';
import { processDashboardData } from '../utils/dataProcessor';

/**
 * Custom hook for fetching and managing GraphQL data
 * @returns {Object} Data fetching state and methods
 */
export const useGraphQLData = () => {
  const { user, isAuthenticated } = useAuth();
  
  // State management
  const [state, setState] = useState({
    loading: false,
    error: null,
    data: null,
    lastFetch: null,
  });

  // Individual data states for granular loading
  const [dataStates, setDataStates] = useState({
    userInfo: { loading: false, data: null, error: null },
    dashboard: { loading: false, data: null, error: null },
    xpStats: { loading: false, data: null, error: null },
    auditRatio: { loading: false, data: null, error: null },
  });

  /**
   * Update state helper
   */
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Update individual data state
   */
  const updateDataState = useCallback((key, updates) => {
    setDataStates(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }));
  }, []);

  /**
   * Test GraphQL connection
   */
  const testConnection = useCallback(async () => {
    if (!isAuthenticated) {
      return { success: false, message: 'Not authenticated' };
    }

    updateState({ loading: true, error: null });

    try {
      const result = await graphqlService.testConnection();
      updateState({ 
        loading: false, 
        error: result.success ? null : result.message 
      });
      return result;
    } catch (error) {
      const errorMessage = error.message || 'Connection test failed';
      updateState({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  }, [isAuthenticated, updateState]);

  /**
   * Fetch user basic information
   */
  const fetchUserInfo = useCallback(async () => {
    if (!isAuthenticated) return null;

    updateDataState('userInfo', { loading: true, error: null });

    try {
      const result = await graphqlService.getUserInfo();
      
      if (result.success) {
        updateDataState('userInfo', { 
          loading: false, 
          data: result.data?.user?.[0] || null,
          error: null 
        });
        return result.data?.user?.[0] || null;
      } else {
        updateDataState('userInfo', { 
          loading: false, 
          error: result.error,
          data: null 
        });
        return null;
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch user info';
      updateDataState('userInfo', { 
        loading: false, 
        error: errorMessage,
        data: null 
      });
      return null;
    }
  }, [isAuthenticated, updateDataState]);

  /**
   * Fetch comprehensive dashboard data
   */
  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated || !user?.sub) return null;

    updateDataState('dashboard', { loading: true, error: null });

    try {
      const userId = parseInt(user.sub);
      const result = await graphqlService.getUserDashboard(userId);
      
      if (result.success) {
        const processedData = processDashboardData(result.data);
        updateDataState('dashboard', { 
          loading: false, 
          data: processedData,
          error: null 
        });
        return processedData;
      } else {
        updateDataState('dashboard', { 
          loading: false, 
          error: result.error,
          data: null 
        });
        return null;
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch dashboard data';
      updateDataState('dashboard', { 
        loading: false, 
        error: errorMessage,
        data: null 
      });
      return null;
    }
  }, [isAuthenticated, user?.sub, updateDataState]);

  /**
   * Fetch XP statistics
   */
  const fetchXPStatistics = useCallback(async () => {
    if (!isAuthenticated || !user?.sub) return null;

    updateDataState('xpStats', { loading: true, error: null });

    try {
      const userId = parseInt(user.sub);
      const result = await graphqlService.getXPStatistics(userId);
      
      if (result.success) {
        updateDataState('xpStats', { 
          loading: false, 
          data: result.data?.transaction || [],
          error: null 
        });
        return result.data?.transaction || [];
      } else {
        updateDataState('xpStats', { 
          loading: false, 
          error: result.error,
          data: null 
        });
        return null;
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch XP statistics';
      updateDataState('xpStats', { 
        loading: false, 
        error: errorMessage,
        data: null 
      });
      return null;
    }
  }, [isAuthenticated, user?.sub, updateDataState]);

  /**
   * Fetch audit ratio data
   */
  const fetchAuditRatio = useCallback(async () => {
    if (!isAuthenticated || !user?.sub) return null;

    updateDataState('auditRatio', { loading: true, error: null });

    try {
      const userId = parseInt(user.sub);
      const result = await graphqlService.getAuditRatio(userId);
      
      if (result.success) {
        updateDataState('auditRatio', { 
          loading: false, 
          data: result.data?.transaction || [],
          error: null 
        });
        return result.data?.transaction || [];
      } else {
        updateDataState('auditRatio', { 
          loading: false, 
          error: result.error,
          data: null 
        });
        return null;
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch audit ratio';
      updateDataState('auditRatio', { 
        loading: false, 
        error: errorMessage,
        data: null 
      });
      return null;
    }
  }, [isAuthenticated, user?.sub, updateDataState]);

  /**
   * Refresh all data
   */
  const refreshAllData = useCallback(async () => {
    if (!isAuthenticated) return;

    updateState({ loading: true, error: null });

    try {
      await Promise.all([
        fetchUserInfo(),
        fetchDashboardData(),
        fetchXPStatistics(),
        fetchAuditRatio(),
      ]);

      updateState({ 
        loading: false, 
        lastFetch: new Date(),
        error: null 
      });
    } catch (error) {
      updateState({ 
        loading: false, 
        error: error.message || 'Failed to refresh data' 
      });
    }
  }, [isAuthenticated, fetchUserInfo, fetchDashboardData, fetchXPStatistics, fetchAuditRatio, updateState]);

  /**
   * Auto-fetch data when user becomes authenticated
   */
  useEffect(() => {
    if (isAuthenticated && user?.sub && !state.lastFetch) {
      refreshAllData();
    }
  }, [isAuthenticated, user?.sub, state.lastFetch]); // Removed refreshAllData from dependencies

  /**
   * Check if any data is loading
   */
  const isLoading = state.loading || Object.values(dataStates).some(ds => ds.loading);

  /**
   * Get combined error messages
   */
  const errors = [
    state.error,
    ...Object.values(dataStates).map(ds => ds.error).filter(Boolean)
  ].filter(Boolean);

  return {
    // Overall state
    loading: isLoading,
    error: errors.length > 0 ? errors[0] : null,
    errors,
    lastFetch: state.lastFetch,

    // Individual data
    userInfo: dataStates.userInfo,
    dashboard: dataStates.dashboard,
    xpStats: dataStates.xpStats,
    auditRatio: dataStates.auditRatio,

    // Methods
    testConnection,
    fetchUserInfo,
    fetchDashboardData,
    fetchXPStatistics,
    fetchAuditRatio,
    refreshAllData,

    // Convenience getters
    hasData: Object.values(dataStates).some(ds => ds.data !== null),
    isReady: isAuthenticated && !isLoading,
  };
};

export default useGraphQLData;
