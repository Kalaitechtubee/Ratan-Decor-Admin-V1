// src/utils/auth.js
// This file is kept for backward compatibility
// All functions now delegate to tokenHandler.js for consistency

import {
  getAccessToken as getToken,
  setAccessToken as setToken,
  getUser,
  setUser,
  clearAuthData as clearAuth,
  isAuthenticated,
} from './tokenHandler';

// Check if user is authenticated
export const isUserAuthenticated = () => {
  try {
    const token = getToken();
    const userData = getUser();

    if (token && userData) {
      return userData && userData.id && userData.email;
    }
    return false;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Get current user data
export const getCurrentUser = () => {
  try {
    const userData = getUser();
    if (userData) {
      return userData && userData.id && userData.email ? userData : null;
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Get access token (delegates to tokenHandler)
export const getAccessToken = () => {
  return getToken();
};

// Set authentication data
export const setAuthData = (user, token = null) => {
  try {
    if (user && user.id && user.email) {
      if (token) {
        setToken(token);
      }
      setUser(user);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error setting auth data:', error);
    return false;
  }
};

// Update access token (delegates to tokenHandler)
export const updateAccessToken = (token) => {
  try {
    if (token) {
      setToken(token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating access token:', error);
    return false;
  }
};

// Clear authentication data (delegates to tokenHandler)
export const clearAuthData = () => {
  try {
    clearAuth();
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

// Validate user data structure
export const validateUserData = (user) => {
  return user && user.id && user.email && user.name;
};

// Check if user has specific role
export const hasRole = (user, role) => {
  return user && user.role === role;
};

// Check if user has permission
export const hasPermission = (user, permission) => {
  // Add your permission logic here
  return user && user.role === 'admin'; // Simple role-based check
};

// Check if token is expired (basic check)
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};