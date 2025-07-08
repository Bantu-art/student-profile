/**
 * GraphQL service for Zone01 Kisumu API
 * Handles GraphQL queries and mutations with JWT authentication
 */

import { graphqlRequest } from './authService';

/**
 * GraphQL queries for user data
 */
export const QUERIES = {
  // Get basic user information
  GET_USER_INFO: `
    query GetUserInfo {
      user {
        id
        login
        email
        firstName
        lastName
        createdAt
        updatedAt
      }
    }
  `,

  // Get user transactions (XP data)
  GET_USER_TRANSACTIONS: `
    query GetUserTransactions($userId: Int!) {
      transaction(
        where: {
          userId: { _eq: $userId }
          type: { _eq: "xp" }
        }
        order_by: { createdAt: desc }
      ) {
        id
        type
        amount
        createdAt
        path
        objectId
        object {
          name
          type
        }
      }
    }
  `,

  // Get user progress data
  GET_USER_PROGRESS: `
    query GetUserProgress($userId: Int!) {
      progress(
        where: { userId: { _eq: $userId } }
        order_by: { createdAt: desc }
      ) {
        id
        userId
        objectId
        grade
        createdAt
        updatedAt
        path
        object {
          name
          type
          attrs
        }
      }
    }
  `,

  // Get user results
  GET_USER_RESULTS: `
    query GetUserResults($userId: Int!) {
      result(
        where: { userId: { _eq: $userId } }
        order_by: { createdAt: desc }
      ) {
        id
        objectId
        userId
        grade
        type
        createdAt
        updatedAt
        path
        object {
          name
          type
          attrs
        }
      }
    }
  `,

  // Get comprehensive user data (combines multiple queries)
  GET_USER_DASHBOARD: `
    query GetUserDashboard($userId: Int!) {
      user(where: { id: { _eq: $userId } }) {
        id
        login
        email
        firstName
        lastName
        createdAt
        updatedAt
      }
      
      transaction(
        where: {
          userId: { _eq: $userId }
          type: { _eq: "xp" }
        }
        order_by: { createdAt: desc }
        limit: 50
      ) {
        id
        type
        amount
        createdAt
        path
        objectId
        object {
          name
          type
        }
      }
      
      progress(
        where: { userId: { _eq: $userId } }
        order_by: { createdAt: desc }
        limit: 50
      ) {
        id
        userId
        objectId
        grade
        createdAt
        updatedAt
        path
        object {
          name
          type
          attrs
        }
      }
      
      result(
        where: { userId: { _eq: $userId } }
        order_by: { createdAt: desc }
        limit: 50
      ) {
        id
        objectId
        userId
        grade
        type
        createdAt
        updatedAt
        path
        object {
          name
          type
          attrs
        }
      }
    }
  `,

  // Get XP statistics over time
  GET_XP_STATISTICS: `
    query GetXPStatistics($userId: Int!) {
      transaction(
        where: {
          userId: { _eq: $userId }
          type: { _eq: "xp" }
        }
        order_by: { createdAt: asc }
      ) {
        id
        amount
        createdAt
        path
        object {
          name
          type
        }
      }
    }
  `,

  // Get audit ratio data
  GET_AUDIT_RATIO: `
    query GetAuditRatio($userId: Int!) {
      transaction(
        where: {
          userId: { _eq: $userId }
          type: { _in: ["up", "down"] }
        }
        order_by: { createdAt: desc }
      ) {
        id
        type
        amount
        createdAt
        path
        objectId
        object {
          name
          type
        }
      }
    }
  `,
};

/**
 * GraphQL API service class
 */
class GraphQLService {
  /**
   * Execute a GraphQL query
   * @param {string} query - GraphQL query string
   * @param {object} variables - Query variables
   * @returns {Promise<object>} Query result
   */
  async query(query, variables = {}) {
    try {
      const result = await graphqlRequest(query, variables);
      return {
        success: true,
        data: result.data,
        errors: result.errors || null,
      };
    } catch (error) {
      console.error('GraphQL query error:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Get basic user information
   * @returns {Promise<object>} User information
   */
  async getUserInfo() {
    return this.query(QUERIES.GET_USER_INFO);
  }

  /**
   * Get user transactions (XP data)
   * @param {number} userId - User ID
   * @returns {Promise<object>} Transaction data
   */
  async getUserTransactions(userId) {
    return this.query(QUERIES.GET_USER_TRANSACTIONS, { userId });
  }

  /**
   * Get user progress data
   * @param {number} userId - User ID
   * @returns {Promise<object>} Progress data
   */
  async getUserProgress(userId) {
    return this.query(QUERIES.GET_USER_PROGRESS, { userId });
  }

  /**
   * Get user results
   * @param {number} userId - User ID
   * @returns {Promise<object>} Results data
   */
  async getUserResults(userId) {
    return this.query(QUERIES.GET_USER_RESULTS, { userId });
  }

  /**
   * Get comprehensive dashboard data
   * @param {number} userId - User ID
   * @returns {Promise<object>} Complete dashboard data
   */
  async getUserDashboard(userId) {
    return this.query(QUERIES.GET_USER_DASHBOARD, { userId });
  }

  /**
   * Get XP statistics for graphs
   * @param {number} userId - User ID
   * @returns {Promise<object>} XP statistics data
   */
  async getXPStatistics(userId) {
    return this.query(QUERIES.GET_XP_STATISTICS, { userId });
  }

  /**
   * Get audit ratio data
   * @param {number} userId - User ID
   * @returns {Promise<object>} Audit ratio data
   */
  async getAuditRatio(userId) {
    return this.query(QUERIES.GET_AUDIT_RATIO, { userId });
  }

  /**
   * Test GraphQL connection
   * @returns {Promise<object>} Connection test result
   */
  async testConnection() {
    try {
      const result = await this.getUserInfo();
      return {
        success: result.success,
        message: result.success 
          ? 'GraphQL connection successful' 
          : `Connection failed: ${result.error}`,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        data: null,
      };
    }
  }
}

// Create and export a singleton instance
const graphqlService = new GraphQLService();
export default graphqlService;
