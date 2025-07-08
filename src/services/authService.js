/**
 * Authentication service for Zone01 Kisumu GraphQL API
 * Handles JWT token authentication and user session management
 */

const API_BASE_URL = 'https://learn.zone01kisumu.ke/api';
const SIGNIN_ENDPOINT = `${API_BASE_URL}/auth/signin`;
const GRAPHQL_ENDPOINT = `${API_BASE_URL}/graphql-engine/v1/graphql`;

/**
 * Encodes credentials for Basic Authentication
 * @param {string} identifier - Username or email
 * @param {string} password - User password
 * @returns {string} Base64 encoded credentials
 */
const encodeCredentials = (identifier, password) => {
  const credentials = `${identifier}:${password}`;
  return btoa(credentials);
};

/**
 * Decodes JWT token to extract user information
 * @param {string} token - JWT token
 * @returns {object|null} Decoded token payload or null if invalid
 */
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Checks if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
const isTokenExpired = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Authenticates user with Zone01 Kisumu API
 * @param {string} identifier - Username or email
 * @param {string} password - User password
 * @returns {Promise<object>} Authentication result with token and user info
 */
export const signIn = async (identifier, password) => {
  try {
    const encodedCredentials = encodeCredentials(identifier, password);
    
    const response = await fetch(SIGNIN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        response.status === 401 
          ? 'Invalid credentials. Please check your username/email and password.'
          : `Authentication failed: ${errorText}`
      );
    }

    const token = await response.text();
    
    if (!token) {
      throw new Error('No token received from server');
    }

    // Decode token to get user information
    const userInfo = decodeJWT(token);
    
    if (!userInfo) {
      throw new Error('Invalid token received from server');
    }

    // Store token in localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));

    return {
      success: true,
      token,
      user: userInfo,
      message: 'Authentication successful'
    };

  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: error.message || 'Authentication failed'
    };
  }
};

/**
 * Signs out the current user
 */
export const signOut = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userInfo');
};

/**
 * Gets the current authentication token
 * @returns {string|null} Current JWT token or null if not authenticated
 */
export const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  
  if (!token) return null;
  
  if (isTokenExpired(token)) {
    signOut();
    return null;
  }
  
  return token;
};

/**
 * Gets the current user information
 * @returns {object|null} Current user info or null if not authenticated
 */
export const getCurrentUser = () => {
  const token = getAuthToken();
  if (!token) return null;
  
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};

/**
 * Checks if user is currently authenticated
 * @returns {boolean} True if user is authenticated with valid token
 */
export const isAuthenticated = () => {
  return getAuthToken() !== null;
};

/**
 * Makes authenticated GraphQL requests
 * @param {string} query - GraphQL query string
 * @param {object} variables - GraphQL variables (optional)
 * @returns {Promise<object>} GraphQL response
 */
export const graphqlRequest = async (query, variables = {}) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
    }

    return result;
  } catch (error) {
    console.error('GraphQL request error:', error);
    throw error;
  }
};

export default {
  signIn,
  signOut,
  getAuthToken,
  getCurrentUser,
  isAuthenticated,
  graphqlRequest,
};
