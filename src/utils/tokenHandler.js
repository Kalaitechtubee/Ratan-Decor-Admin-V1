/**
 * Centralized User Data Handler
 * Tokens are stored in HTTP-only cookies for security
 */

const USER_KEY = 'user';

/**
 * Tokens are stored in httpOnly cookies and are not readable from JS.
 * Kept for backward compatibility; always returns null.
 */
export const getAccessToken = () => {
  console.warn('getAccessToken() is deprecated. Tokens are httpOnly cookies.');
  return null;
};

/**
 * Set access token in HTTP-only cookie
 * Note: This is a client-side fallback. For production, tokens should be set by the server
 * with httpOnly and secure flags.
 * @param {string} token - Access token to store
 */
export const setAccessToken = () => {
  console.warn('setAccessToken() is deprecated. Tokens are set by the server.');
};

/**
 * Remove access token from cookies
 */
export const removeAccessToken = () => {
  console.warn('removeAccessToken() is deprecated. Use logout endpoint to clear cookies.');
};

/**
 * Get user data from localStorage
 * @returns {object|null} User data or null if not found
 */
export const getUser = () => {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

/**
 * Set user data in localStorage
 * @param {object} user - User data to store
 */
export const setUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (error) {
    console.error('Error setting user:', error);
  }
};

/**
 * Remove user data from localStorage
 */
export const removeUser = () => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error removing user:', error);
  }
};

/**
 * Clear all authentication data (token and user)
 */
export const clearAuthData = () => {
  removeUser();
};

/**
 * Get authorization headers for API requests
 * With HTTP-only cookies, we don't need to manually set the Authorization header
 * as cookies are sent automatically by the browser.
 * @returns {object} Headers object with Content-Type
 */
export const getAuthHeaders = (excludeContentType = false) => {
  const headers = {};
  
  // For FormData requests, don't set Content-Type (browser will set it with boundary)
  if (!excludeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Note: credentials must be set to 'include' on requests for cookies to be sent
  
  return headers;
};

/**
 * Check if a response contains a new access token in header
 * @param {Response} response - Fetch Response object
 * @returns {string|null} New token or null
 */
export const extractNewTokenFromHeader = (response) => {
  try {
    // For fetch API
    if (response && response.headers) {
      return response.headers.get('x-new-access-token');
    }
    return null;
  } catch (error) {
    console.error('Error extracting token from header:', error);
    return null;
  }
};

/**
 * Check if an axios response contains a new access token in header
 * @param {object} response - Axios response object
 * @returns {string|null} New token or null
 */
export const extractNewTokenFromAxiosHeader = (response) => {
  try {
    if (response && response.headers) {
      return response.headers['x-new-access-token'] || null;
    }
    return null;
  } catch (error) {
    console.error('Error extracting token from axios header:', error);
    return null;
  }
};

/**
 * Update token if found in response header - no-op (tokens in secure cookies)
 * @param {Response|object} response - Fetch Response or Axios response
 * @param {boolean} isAxios - Whether this is an axios response
 * @returns {boolean} Always false (tokens managed by backend)
 */
export const updateTokenFromResponse = (response, isAxios = false) => {
  // No-op - tokens are managed by backend in secure httpOnly cookies
  return false;
};

/**
 * Check if response data contains a new access token - no-op
 * @param {object} data - Response data object
 * @returns {string|null} Always null (tokens in cookies)
 */
export const extractNewTokenFromData = (data) => {
  // No-op - tokens are in secure cookies
  return null;
};

/**
 * Update token if found in response data - no-op (tokens in secure cookies)
 * @param {object} data - Response data object
 * @returns {boolean} Always false (tokens managed by backend)
 */
export const updateTokenFromData = (data) => {
  // No-op - tokens are managed by backend in secure httpOnly cookies
  return false;
};

/**
 * Handle token refresh on 401 error - no-op (tokens refreshed automatically by backend)
 * @param {string} apiBaseUrl - Base URL for API
 * @returns {Promise<{success: boolean, token: string|null}>} Always returns success (tokens in cookies)
 */
export const refreshAccessToken = async (apiBaseUrl) => {
  // Tokens are refreshed automatically by backend middleware via cookies
  // This function is kept for backward compatibility but does nothing
  return { success: true, token: null };
};

/**
 * Check if user is authenticated
 * With HTTP-only cookies, we need to make a request to the server to verify the session
 * For now, we'll check for the presence of user data in localStorage
 * @returns {boolean} True if user data exists
 */
export const isAuthenticated = () => {
  // In a real app, you might want to make an API call to /api/auth/me
  // to verify the session is still valid
  return !!getUser();
};

/**
 * Redirect to login page
 * @param {string} currentPath - Current pathname
 */
export const redirectToLogin = (currentPath = window.location.pathname) => {
  if (currentPath !== '/login') {
    window.location.href = '/login';
  }
};

export default {
  // Note: With HTTP-only cookies, most token management is handled by the browser
  // and the server. The client doesn't need to manually handle tokens.
  getAccessToken, // Keep for backward compatibility
  setAccessToken, // Keep for backward compatibility
  removeAccessToken, // Keep for backward compatibility
  getUser,
  setUser,
  removeUser,
  clearAuthData,
  getAuthHeaders,
  // The following functions are kept for backward compatibility but are no-ops
  // since tokens are now managed by HTTP-only cookies
  extractNewTokenFromHeader: () => null,
  extractNewTokenFromAxiosHeader: () => null,
  updateTokenFromResponse: () => false,
  extractNewTokenFromData: () => null,
  updateTokenFromData: () => false,
  refreshAccessToken: async () => ({ success: true, token: null }),
  isAuthenticated,
  redirectToLogin,
};
