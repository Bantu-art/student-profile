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
    if (!token || typeof token !== 'string') {
      console.error('Invalid token provided to decodeJWT');
      return null;
    }

    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format - expected 3 parts, got:', parts.length);
      return null;
    }

    // Get the payload (second part)
    let base64Url = parts[1];

    // Add padding if necessary
    while (base64Url.length % 4) {
      base64Url += '=';
    }

    // Convert base64url to base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Decode base64
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const decoded = JSON.parse(jsonPayload);
    console.log('Successfully decoded JWT payload:', decoded);
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    console.error('Token that failed to decode:', token?.substring(0, 50) + '...');
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
    console.log('Attempting authentication for:', identifier);

    const response = await fetch(SIGNIN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Authentication response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Authentication failed with status:', response.status, 'Error:', errorText);
      throw new Error(
        response.status === 401
          ? 'Invalid credentials. Please check your username/email and password.'
          : `Authentication failed: ${errorText}`
      );
    }

    const token = await response.text();
    console.log('Received token length:', token?.length);
    console.log('Token preview:', token?.substring(0, 100) + '...');

    if (!token) {
      throw new Error('No token received from server');
    }

    // Try to decode token to get user information
    const userInfo = decodeJWT(token);

    // Even if decoding fails, we can still store the token and try to use it
    // The GraphQL API might accept it even if our client-side decoding fails
    if (!userInfo) {
      console.warn('Could not decode JWT token, but will still attempt to use it');
      // Create a minimal user object from the token itself
      const fallbackUser = {
        sub: 'unknown',
        login: identifier,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      };

      // Store token and fallback user info
      localStorage.setItem('authToken', token);
      localStorage.setItem('userInfo', JSON.stringify(fallbackUser));

      return {
        success: true,
        token,
        user: fallbackUser,
        message: 'Authentication successful (token decoding failed but proceeding)'
      };
    }

    // Store token in localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));

    console.log('Authentication successful for user:', userInfo);

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

  console.log('Making GraphQL request with token length:', token.length);
  console.log('GraphQL query:', query.substring(0, 100) + '...');
  console.log('GraphQL variables:', variables);

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

    console.log('GraphQL response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GraphQL request failed:', response.status, errorText);

      // If it's an authentication error, clear the stored token
      if (response.status === 401 || response.status === 403) {
        console.log('Authentication failed, clearing stored token');
        signOut();
        throw new Error('Authentication failed. Please sign in again.');
      }

      throw new Error(`GraphQL request failed: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('GraphQL response:', result);

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);

      // Check if any error is related to JWT/authentication
      const authErrors = result.errors.filter(error =>
        error.message.includes('JWT') ||
        error.message.includes('authentication') ||
        error.message.includes('unauthorized')
      );

      if (authErrors.length > 0) {
        console.log('JWT/Auth error detected, clearing stored token');
        signOut();
        throw new Error('Authentication token is invalid. Please sign in again.');
      }

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
