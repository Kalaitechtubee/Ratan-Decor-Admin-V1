// API.js - Frontend API Client (Cookie-Only Auth Version)
// Updated for 2025 Best Practices: HTTP-Only Cookies for Access/Refresh Tokens
// No localStorage/sessionStorage for tokens; user data (non-sensitive) in localStorage optional for UX
import {
  getUser,
  setUser,
  clearAuthData,
  redirectToLogin,
} from '../utils/tokenHandler'; // Removed token-related utils; keep user data handlers

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const PRODUCTS_ENDPOINT = `${API_BASE_URL}/products`;
const CATEGORIES_ENDPOINT = `${API_BASE_URL}/categories`;
const USER_TYPES_ENDPOINT = `${API_BASE_URL}/user-types`;
const ADMIN_ENDPOINT = `${API_BASE_URL}/admin`;
const USERS_ENDPOINT = `${API_BASE_URL}/users`;
const AUTH_ENDPOINT = `${API_BASE_URL}/auth`;
const ENQUIRIES_ENDPOINT = `${API_BASE_URL}/enquiries`;
const SEO_ENDPOINT = `${API_BASE_URL}/seo`;
const CONTACTS_ENDPOINT = `${API_BASE_URL}/contact`;
const ORDERS_ENDPOINT = `${API_BASE_URL}/orders`;

// Utility Functions
const handleResponse = async (response) => {
  try {
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.warn('Non-JSON response:', text);
      data = { message: text };
    }

    if (!response.ok) {
      const message = data.message || data.error || data.errors?.[0]?.message || `API request failed with status ${response.status}`;
      console.error('API Error:', message, data);
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error('Error processing response:', error);
    throw error;
  }
};

// Enhanced fetch - Relies on HTTP-Only Cookies (no Authorization header needed)
// Backend middleware handles token validation/refresh via cookies
const apiFetch = async (url, options = {}) => {
  // Check if body is FormData to determine if we should exclude Content-Type
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...options.headers,
  };

  // Remove Content-Type if it's FormData (browser will set it with boundary)
  if (isFormData && headers['Content-Type']) {
    delete headers['Content-Type'];
  }

  const requestOptions = {
    ...options,
    headers,
    credentials: 'include', // CRITICAL: Include cookies for access/refresh tokens
  };

  try {
    const response = await fetch(url, requestOptions);

    // Handle 401 errors - session expired/invalid (backend couldn't refresh)
    if (response.status === 401) {
      console.log('apiFetch: Received 401, clearing auth and redirecting to login...');
      clearAuthData(); // Clears localStorage user data
      redirectToLogin();
      throw new Error('Authentication failed. Please log in again.');
    }

    const data = await handleResponse(response);

    return data;
  } catch (error) {
    console.error('apiFetch: API request failed:', error);
    throw error;
  }
};

// Wrapper to replace fetch calls with apiFetch for automatic 401 handling
const makeApiCall = async (url, options = {}) => {
  return apiFetch(url, options);
};

// Exported helper for authenticated fetches (cookie-based)
export const apiFetchWithAuth = apiFetch;

// No more getAuthHeaders - cookies handle auth; no Bearer token needed
const getAuthHeaders = () => {
  return {}; // Empty - rely on cookies
};

// Removed handleTokenRefresh - backend handles refresh via middleware/cookies

const validateInput = (data, requiredFields, options = {}) => {
  const { validateEmail, validRoles, validStatuses, validateUserTypeName, validPriorities, validSources } = options;

  let inputData = data instanceof FormData ? {} : { ...data };
  if (data instanceof FormData) {
    for (let [key, value] of data.entries()) {
      try {
        if (['visibleTo', 'colors', 'specifications', 'keptImages'].includes(key)) {
          inputData[key] = value ? JSON.parse(value) : (key === 'specifications' ? {} : []);
        } else {
          inputData[key] = value;
        }
      } catch (error) {
        console.error(`Failed to parse ${key}:`, error);
        throw new Error(`Invalid format for ${key}`);
      }
    }
  }

  const missingFields = requiredFields.filter((field) => {
    const value = inputData[field];
    return value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0);
  });
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  if (validateEmail && inputData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inputData.email)) {
      throw new Error('Invalid email format');
    }
  }

  if (validRoles && inputData.role) {
    const roleVal = inputData.role.toString();
    const roleLower = roleVal.toLowerCase();
    const validLower = validRoles.map(r => r.toString().toLowerCase());
    if (!validLower.includes(roleLower)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
  }

  if (validStatuses && inputData.status && !validStatuses.includes(inputData.status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  if (validPriorities && inputData.priority && !validPriorities.includes(inputData.priority)) {
    throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
  }

  if (validSources && inputData.source && !validSources.includes(inputData.source)) {
    throw new Error(`Invalid source. Must be one of: ${validSources.join(', ')}`);
  }

  if (inputData.rating !== undefined) {
    const rating = Number(inputData.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
  }

  if (inputData.visibleTo) {
    if (!Array.isArray(inputData.visibleTo) || inputData.visibleTo.length === 0 || !inputData.visibleTo.every(v => typeof v === 'string' && v.trim().length > 0)) {
      throw new Error('Invalid visibleTo values: must be a non-empty array of non-empty strings');
    }
  }

  if (inputData.colors) {
    if (!Array.isArray(inputData.colors) || !inputData.colors.every(color => typeof color === 'string' && color.trim().length > 0)) {
      throw new Error('Invalid colors: must be an array of non-empty strings');
    }
  }

  if (inputData.gst !== undefined) {
    const gst = Number(inputData.gst);
    if (isNaN(gst) || gst < 0 || gst > 100) {
      throw new Error('Invalid GST: must be a number between 0 and 100');
    }
  }

  if (inputData.name && inputData.name !== undefined) {
    if (typeof inputData.name !== 'string' || inputData.name.trim().length < 2) {
      throw new Error('Category name must be at least 2 characters long');
    }
  }

  if (inputData.parentId !== undefined && inputData.parentId !== null && inputData.parentId !== '') {
    const parentId = Number(inputData.parentId);
    if (isNaN(parentId) || parentId <= 0) {
      throw new Error('Invalid parentId: must be a positive integer or null');
    }
  }

  if (inputData.name && validateUserTypeName) {
    if (typeof inputData.name !== 'string' || inputData.name.trim().length < 1 || inputData.name.trim().length > 50) {
      throw new Error('User type name must be between 1 and 50 characters');
    }
  }

  if (inputData.pageName !== undefined) {
    if (typeof inputData.pageName !== 'string' || inputData.pageName.trim().length < 1) {
      throw new Error('pageName must be a non-empty string');
    }
  }
  if (inputData.title !== undefined) {
    if (typeof inputData.title !== 'string' || inputData.title.trim().length < 1) {
      throw new Error('title must be a non-empty string');
    }
  }
  if (inputData.description !== undefined) {
    if (typeof inputData.description !== 'string' || inputData.description.trim().length < 1) {
      throw new Error('description must be a non-empty string');
    }
  }
  if (inputData.keywords !== undefined) {
    if (typeof inputData.keywords !== 'string' || inputData.keywords.trim().length < 1) {
      throw new Error('keywords must be a non-empty string');
    }
  }
};

// Authentication API Functions
export const register = async (userData) => {
  const validRoles = ['customer', 'architect', 'dealer', 'admin', 'manager', 'sales', 'support'];
  validateInput(userData, ['name', 'email', 'password'], {
    validateEmail: true,
    validRoles,
  });

  const response = await fetch(`${AUTH_ENDPOINT}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies (though not needed for public endpoint)
    body: JSON.stringify(userData),
  });

  const data = await handleResponse(response);
  return {
    success: true,
    userId: data.data.userId,
    message: data.message,
    requiresApproval: data.data.requiresApproval,
    status: data.data.status,
  };
};

export const createSuperAdmin = async (superAdminData) => {
  validateInput(superAdminData, ['name', 'email', 'password', 'secretKey'], {
    validateEmail: true,
  });

  const response = await fetch(`${AUTH_ENDPOINT}/create-superadmin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(superAdminData),
  });

  const data = await handleResponse(response);
  return {
    success: true,
    userId: data.data.userId,
    message: data.message,
  };
};

export const createStaffUser = async (staffData) => {
  const validRoles = ['Manager', 'Sales', 'Support', 'Admin'];
  validateInput(staffData, ['name', 'email', 'password', 'role'], {
    validateEmail: true,
    validRoles,
  });

  const response = await fetch(`${AUTH_ENDPOINT}/create-staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Cookies handle auth
    body: JSON.stringify(staffData),
  });

  const data = await handleResponse(response);
  return {
    success: true,
    userId: data.data.userId,
    message: data.message,
    requiresApproval: data.data.requiresApproval,
    status: data.data.status,
  };
};

export const login = async ({ email, password }) => {
  validateInput({ email, password }, ['email', 'password'], { validateEmail: true });

  try {
    const response = await fetch(`${AUTH_ENDPOINT}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // CRITICAL: Backend sets httpOnly cookies here
      body: JSON.stringify({ email, password }),
    });

    // Parse the response data
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('Failed to parse login response:', e);
      throw new Error('Invalid server response');
    }

    // If the response is not ok, throw an error with the message from the server
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store user data in localStorage for UX (non-sensitive; tokens in cookies)
    if (data.user) {
      setUser(data.user);
    }

    return {
      success: true,
      user: data.user,
      message: data.message || 'Login successful',
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error; // Re-throw to be handled by the caller
  }
};

export const logout = async () => {
  try {
    const response = await fetch(`${AUTH_ENDPOINT}/logout`, { // Use auth endpoint for logout
      method: 'POST',
      credentials: 'include', // Backend clears/invalidates cookies
    });
    await handleResponse(response);

    // Clear localStorage user data
    clearAuthData();

    return { success: true, message: 'Logged out successfully' };
  } catch (error) {
    console.error('Logout error:', error.message);

    // Clear auth data even if API call fails
    clearAuthData();

    return { success: false, message: error.message };
  }
};

export const checkUserStatus = async (email) => {
  validateInput({ email }, ['email'], { validateEmail: true });
  const response = await fetch(`${AUTH_ENDPOINT}/status/${encodeURIComponent(email)}`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await handleResponse(response);
  return {
    success: true,
    user: data.user,
  };
};

export const resendApproval = async (email) => {
  validateInput({ email }, ['email'], { validateEmail: true });
  const response = await fetch(`${AUTH_ENDPOINT}/resend-approval`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  const data = await handleResponse(response);
  return {
    success: true,
    message: data.message,
    status: data.status,
  };
};

export const forgotPassword = async (email) => {
  validateInput({ email }, ['email'], { validateEmail: true });
  const response = await fetch(`${AUTH_ENDPOINT}/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  const data = await handleResponse(response);
  return {
    success: true,
    message: data.message,
    otpSent: data.otpSent,
  };
};

export const verifyOTP = async ({ email, otp }) => {
  validateInput({ email, otp }, ['email', 'otp'], { validateEmail: true });
  const response = await fetch(`${AUTH_ENDPOINT}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, otp }),
  });
  const data = await handleResponse(response);
  return {
    success: true,
    message: data.message,
    resetToken: data.resetToken,
  };
};

export const resetPassword = async ({ resetToken, newPassword }) => {
  validateInput({ resetToken, newPassword }, ['resetToken', 'newPassword']);
  const response = await fetch(`${AUTH_ENDPOINT}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ resetToken, newPassword }),
  });
  const data = await handleResponse(response);
  return {
    success: true,
    message: data.message,
  };
};

export const getProfile = async () => {
  const data = await apiFetch(`${AUTH_ENDPOINT}/profile`, {
    method: 'GET',
  });
  return {
    success: true,
    user: data.user,
  };
};

export const updateProfile = async (userData) => {
  const data = await apiFetch(`${AUTH_ENDPOINT}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return {
    success: true,
    user: data.user,
    message: data.message,
  };
};

// User API Functions
export const getAllUsers = async ({ page = 1, limit = 10, search, role, status, userTypeName }) => {
  const validRoles = ['customer', 'architect', 'dealer', 'admin', 'manager', 'sales', 'support'];
  const validStatuses = ['Pending', 'Approved', 'Rejected'];
  validateInput({ page, limit }, ['page', 'limit'], { validRoles, validStatuses });

  const normalizedRole = role ? role.toLowerCase() : undefined;

  const params = new URLSearchParams({
    page,
    limit,
    ...(search && { search }),
    ...(normalizedRole && { role: normalizedRole }),
    ...(status && { status }),
    ...(userTypeName && { userTypeName }),
  });

  const data = await apiFetch(`${USERS_ENDPOINT}?${params.toString()}`, {
    method: 'GET',
  });

  return {
    success: true,
    users: data.data || [],
    pagination: {
      currentPage: data.pagination?.currentPage || 1,
      totalPages: data.pagination?.totalPages || 1,
      totalItems: data.pagination?.totalItems || 0,
      limit: data.pagination?.limit || 10,
    },
  };
};
export const getAllStaffUsers = async ({ page = 1, limit = 10, search, role, status }) => {
  const validRoles = ['Manager', 'Sales', 'Support', 'Admin'];
  const validStatuses = ['Pending', 'Approved', 'Rejected'];
  validateInput({ page, limit }, ['page', 'limit'], { validRoles, validStatuses });

  const normalizedRole = role ? role.toLowerCase() : undefined;

  const params = new URLSearchParams({
    page,
    limit,
    ...(search && { search }),
    ...(normalizedRole && { role: normalizedRole }),
    ...(status && { status }),
    staffOnly: true,
  });

  const data = await apiFetch(`${USERS_ENDPOINT}/staff?${params.toString()}`, {
    method: 'GET',
  });

  return data;
};

export const getStaffUserById = async (id) => {
  validateInput({ id }, ['id']);
  const data = await apiFetch(`${USERS_ENDPOINT}/staff/${id}`, {
    method: 'GET',
  });
  return data;
};

export const getUserById = async (id) => {
  validateInput({ id }, ['id']);
  const data = await apiFetch(`${USERS_ENDPOINT}/${id}`, {
    method: 'GET',
  });
  return {
    success: true,
    user: data.data,
  };
};

export const createUser = async (userData) => {
  const validRoles = ['General', 'Customer', 'Architect', 'Dealer', 'Admin', 'Manager', 'Sales', 'Support', 'SuperAdmin'];
  const validStatuses = ['Pending', 'Approved', 'Rejected'];
  validateInput(userData, ['name', 'email', 'password'], {
    validateEmail: true,
    validRoles,
    validStatuses,
  });

  const data = await apiFetch(USERS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return {
    success: true,
    user: data.data,
  };
};

export const updateUser = async (id, userData) => {
  const validRoles = ['General', 'Customer', 'Architect', 'Dealer', 'Admin', 'Manager', 'Sales', 'Support', 'SuperAdmin'];
  const validStatuses = ['Pending', 'Approved', 'Rejected'];
  validateInput({ id, ...userData }, ['id'], {
    validateEmail: userData.email ? true : false,
    validRoles,
    validStatuses,
  });

  const data = await apiFetch(`${ADMIN_ENDPOINT}/users/${id}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return {
    success: true,
    user: data.data,
    message: data.message,
  };
};

export const deleteUser = async (id) => {
  validateInput({ id }, ['id']);
  const data = await apiFetch(`${USERS_ENDPOINT}/${id}`, {
    method: 'DELETE',
  });
  return {
    success: true,
    message: data.message,
  };
};

// Product API Functions
// Updated getProducts API Function with Multi-Select Support

export const getProducts = async ({
  userType,
  categoryId, // Can be comma-separated: "1,2,3"
  subcategoryId, // Can be comma-separated: "4,5,6"
  brandName, // Can be comma-separated: "Brand1,Brand2"
  colors, // Can be comma-separated: "Red,Blue,Green"
  size, // Can be comma-separated: "12x12,24x24"
  thickness, // Can be comma-separated: "8mm,10mm"
  unitType, // Can be comma-separated: "Box,Sq.Ft"
  minPrice,
  maxPrice,
  minGst,
  maxGst,
  search,
  page = 1,
  limit = 20,
  isActive,
  designNumber,
  minDesignNumber,
  maxDesignNumber,
  sortBy = 'createdAt',
  sortOrder = 'DESC'
}) => {
  const params = new URLSearchParams();

  params.append('page', page);
  params.append('limit', limit);

  if (userType) params.append('userType', userType);

  // Multi-select parameters
  if (categoryId) params.append('categoryId', categoryId);
  if (subcategoryId) params.append('subcategoryId', subcategoryId);
  if (brandName) params.append('brandName', brandName);
  if (colors) params.append('colors', colors);
  if (size) params.append('size', size);
  if (thickness) params.append('thickness', thickness);
  if (unitType) params.append('unitType', unitType);

  // Range filters
  if (minPrice) params.append('minPrice', minPrice);
  if (maxPrice) params.append('maxPrice', maxPrice);
  if (minGst) params.append('minGst', minGst);
  if (maxGst) params.append('maxGst', maxGst);

  // Search and design filters
  if (search) params.append('search', search);
  if (designNumber) params.append('designNumber', designNumber);
  if (minDesignNumber) params.append('minDesignNumber', minDesignNumber);
  if (maxDesignNumber) params.append('maxDesignNumber', maxDesignNumber);

  // Status and sorting
  if (isActive !== undefined && isActive !== '') params.append('isActive', isActive);
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);

  try {
    const data = await apiFetch(`${PRODUCTS_ENDPOINT}?${params.toString()}`, {
      method: 'GET',
    });

    // Process image URLs
    const products = (data.products || []).map(product => {
      if (product.imageUrl && product.imageUrl.startsWith('/')) {
        product.imageUrl = `${API_BASE_URL}${product.imageUrl}`;
      }
      if (product.imageUrls) {
        product.imageUrls = product.imageUrls.map(url =>
          url.startsWith('/') ? `${API_BASE_URL}${url}` : url
        );
      }
      return product;
    });

    return {
      success: true,
      products,
      pagination: {
        total: data.count || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
      },
      userType: data.userType,
      userRole: data.userRole,
      counts: {
        totalCount: data.totalCount || 0,
        activeCount: data.activeCount || 0,
        inactiveCount: data.inactiveCount || 0,
      },
      appliedFilters: data.appliedFilters || {},
      availableFilters: data.availableFilters || {
        brands: [],
        sizes: [],
        thicknesses: [],
        unitTypes: [],
        colors: [],
        gstValues: []
      }
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getProductById = async (id, userType) => {
  validateInput({ id }, ['id']);
  const params = new URLSearchParams();
  if (userType) params.append('userType', userType);
  const data = await apiFetch(`${PRODUCTS_ENDPOINT}/${id}?${params.toString()}`, {
    method: 'GET',
  });

  const product = data.product;
  if (product.imageUrl && product.imageUrl.startsWith('/')) {
    product.imageUrl = `${API_BASE_URL}${product.imageUrl}`;
  }
  if (product.imageUrls) {
    product.imageUrls = product.imageUrls.map(url => url.startsWith('/') ? `${API_BASE_URL}${url}` : url);
  }

  return {
    success: true,
    product,
    userType: data.userType,
    userRole: data.userRole,
  };
};

// Update the updateProduct function in API.js

export const updateProduct = async (id, formData) => {
  try {
    validateInput({ id }, ['id']);

    console.log('Updating product ID:', id);
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }

    // IMPORTANT: Don't use apiFetch for FormData as it might interfere with headers
    const response = await fetch(`${PRODUCTS_ENDPOINT}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(true), // FormData - exclude Content-Type
      credentials: 'include', // Include cookies
      body: formData,
    });

    // Check for 401 (unauthorized)
    if (response.status === 401) {
      console.log('Received 401, clearing auth and redirecting...');
      clearAuthData();
      redirectToLogin();
      throw new Error('Authentication failed. Please log in again.');
    }

    // Parse response
    let data;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.warn('Non-JSON response:', text);
      data = { message: text };
    }

    // Check if response is not ok
    if (!response.ok) {
      const errorMessage = data.message || data.error ||
        data.errors?.[0]?.message ||
        `API request failed with status ${response.status}`;
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        errorMessage: errorMessage
      });
      throw new Error(errorMessage);
    }

    console.log('Product update successful:', data);

    return {
      success: true,
      product: data.product || data.data,
      message: data.message || 'Product updated successfully',
    };
  } catch (error) {
    console.error('Error in updateProduct:', error);
    throw error;
  }
};

// Also update the createProduct function for consistency
export const createProduct = async (formData) => {
  try {
    // Validate required fields
    const requiredFields = ['name', 'generalPrice', 'architectPrice', 'dealerPrice', 'visibleTo'];

    // Check if we can extract data from formData for validation
    const formDataObj = {};
    for (let [key, value] of formData.entries()) {
      if (key === 'visibleTo' || key === 'colors') {
        try {
          formDataObj[key] = JSON.parse(value);
        } catch (e) {
          formDataObj[key] = value;
        }
      } else {
        formDataObj[key] = value;
      }
    }

    validateInput(formDataObj, requiredFields);

    console.log('Creating product with formData keys:', Array.from(formData.keys()));

    const response = await fetch(PRODUCTS_ENDPOINT, {
      method: 'POST',
      headers: getAuthHeaders(true), // FormData - exclude Content-Type
      credentials: 'include',
      body: formData,
    });

    // Check for 401
    if (response.status === 401) {
      console.log('Received 401, clearing auth and redirecting...');
      clearAuthData();
      redirectToLogin();
      throw new Error('Authentication failed. Please log in again.');
    }

    let data;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.warn('Non-JSON response:', text);
      data = { message: text };
    }

    if (!response.ok) {
      const errorMessage = data.message || data.error ||
        data.errors?.[0]?.message ||
        `API request failed with status ${response.status}`;
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        errorMessage: errorMessage
      });
      throw new Error(errorMessage);
    }

    console.log('Product creation successful:', data);

    return {
      success: true,
      product: data.product || data.data,
      productId: data.product?.id || data.data?.id,
      message: data.message || 'Product created successfully',
    };
  } catch (error) {
    console.error('Error in createProduct:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  validateInput({ id }, ['id']);
  const data = await apiFetch(`${PRODUCTS_ENDPOINT}/${id}`, {
    method: 'DELETE',
  });
  return {
    success: true,
    message: data.message,
  };
};

// Product Rating Functions
export const addProductRating = async (productId, { rating, review }) => {
  validateInput({ productId, rating }, ['productId', 'rating']);

  const response = await fetch(`${PRODUCTS_ENDPOINT}/${productId}/rate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ rating, review }),
  });

  const data = await handleResponse(response);
  return {
    success: true,
    rating: data.rating,
    productStats: data.productStats,
    message: data.message,
  };
};

export const getProductRatings = async (productId, { page = 1, limit = 10 } = {}) => {
  validateInput({ productId, page, limit }, ['productId', 'page', 'limit']);

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`${PRODUCTS_ENDPOINT}/${productId}/ratings?${params.toString()}`, {
    credentials: 'include',
  });

  const data = await handleResponse(response);
  return {
    success: true,
    ratings: data.ratings || [],
    pagination: {
      currentPage: data.page || 1,
      totalPages: data.totalPages || 1,
      totalItems: data.total || 0,
      limit: limit,
    },
  };
};


// Update this function
const fixCategoryImageUrls = (categories) => {
  if (!Array.isArray(categories)) return categories;

  return categories.map(category => {
    const updatedCategory = { ...category };

    // Fix main image URL
    if (updatedCategory.imageUrl && updatedCategory.imageUrl.startsWith('/')) {
      // Remove '/api' from API_BASE_URL if it exists, then prepend
      const baseUrl = API_BASE_URL.replace('/api', '');
      updatedCategory.imageUrl = `${baseUrl}${updatedCategory.imageUrl}`;
    } else if (updatedCategory.image && !updatedCategory.imageUrl) {
      // Construct URL from filename
      const baseUrl = API_BASE_URL.replace('/api', '');
      updatedCategory.imageUrl = `${baseUrl}/uploads/categories/${updatedCategory.image}`;
    }

    // Recursively fix subcategories
    if (updatedCategory.subCategories && Array.isArray(updatedCategory.subCategories)) {
      updatedCategory.subCategories = fixCategoryImageUrls(updatedCategory.subCategories);
    }

    return updatedCategory;
  });
};
export const getCategories = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      parentId = null,
      sortBy = 'name',
      sortOrder = 'ASC',
      includeSubcategories = false
    } = filters;

    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (parentId !== null && parentId !== undefined) {
      params.append('parentId', parentId === null ? 'null' : parentId.toString());
    }
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    if (includeSubcategories) params.append('includeSubcategories', 'true');

    const url = `${CATEGORIES_ENDPOINT}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      credentials: 'include',
    });

    const data = await handleResponse(response);

    // Handle both tree structure and flat list
    const categories = data.categories || data.paginatedCategories || [];

    return {
      success: true,
      categories: fixCategoryImageUrls(categories),
      tree: data.categories ? fixCategoryImageUrls(data.categories) : null,
      paginatedCategories: data.paginatedCategories ? fixCategoryImageUrls(data.paginatedCategories) : null,
      pagination: data.pagination || {},
      filters: data.filters || {},
      totalCategories: data.pagination?.totalItems || categories.length,
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getCategoryById = async (id) => {
  validateInput({ id }, ['id']);

  try {
    const response = await fetch(`${CATEGORIES_ENDPOINT}/${id}`, {
      credentials: 'include',
    });

    const data = await handleResponse(response);

    const category = data.category;
    if (category) {
      if (category.image) {
        if (!category.image.startsWith('http://') && !category.image.startsWith('https://')) {
          category.imageUrl = category.image.startsWith('/')
            ? `${API_BASE_URL}${category.image}`
            : `${API_BASE_URL}/uploads/categories/${category.image}`;
        } else {
          category.imageUrl = category.image;
        }
      } else {
        category.imageUrl = null;
      }

      if (category.subCategories && Array.isArray(category.subCategories)) {
        category.subCategories = fixCategoryImageUrls(category.subCategories);
      }
    }

    return {
      success: true,
      category,
    };
  } catch (error) {
    console.error('Error fetching category by ID:', error);
    throw error;
  }
};

export const getSubCategories = async (parentId, filters = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'name',
      sortOrder = 'ASC'
    } = filters;

    const parentPath = parentId === null ? 'null' : parentId;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);

    const data = await apiFetch(
      `${CATEGORIES_ENDPOINT}/subcategories/${parentPath}?${params.toString()}`,
      {
        method: 'GET',
      }
    );

    return {
      success: true,
      subcategories: fixCategoryImageUrls(data.subcategories || []),
      pagination: data.pagination || {},
      filters: data.filters || {},
    };
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    throw error;
  }
};

export const createCategory = async (categoryData) => {
  try {
    const parentId = categoryData.get ? categoryData.get('parentId') : categoryData.parentId;

    if (parentId !== undefined && parentId !== null && parentId !== '' && parentId !== 'null') {
      throw new Error('Use createSubCategory function for creating subcategories');
    }

    const name = categoryData.get ? categoryData.get('name') : categoryData.name;
    validateInput({ name }, ['name']);

    console.log('Creating MAIN category with data:',
      categoryData instanceof FormData ? Array.from(categoryData.entries()) : categoryData
    );

    const isFormData = categoryData instanceof FormData;
    const data = await apiFetch(CATEGORIES_ENDPOINT, {
      method: 'POST',
      body: categoryData,
    });

    const category = data.category;
    if (category && category.image) {
      if (!category.image.startsWith('http://') && !category.image.startsWith('https://')) {
        category.imageUrl = category.image.startsWith('/')
          ? `${API_BASE_URL}${category.image}`
          : `${API_BASE_URL}/uploads/categories/${category.image}`;
      } else {
        category.imageUrl = category.image;
      }
    }

    return {
      success: true,
      category,
      message: data.message,
    };
  } catch (error) {
    console.error('Error creating main category:', error);
    throw error;
  }
};

export const createSubCategory = async (parentId, subcategoryData) => {
  try {
    validateInput({ parentId }, ['parentId']);

    const name = subcategoryData.get ? subcategoryData.get('name') : subcategoryData.name;
    validateInput({ name }, ['name']);

    if (subcategoryData instanceof FormData && subcategoryData.has('image')) {
      console.warn('Removing image from subcategory creation - subcategories cannot have images');
      subcategoryData.delete('image');
    }

    console.log('Creating SUBCATEGORY under parent:', parentId, 'with data:',
      subcategoryData instanceof FormData ? Array.from(subcategoryData.entries()) : subcategoryData
    );

    const endpoint = `${CATEGORIES_ENDPOINT}/subcategory/${parentId}`;

    const isFormData = subcategoryData instanceof FormData;
    const data = await apiFetch(endpoint, {
      method: 'POST',
      body: isFormData ? subcategoryData : JSON.stringify(subcategoryData),
    });

    return {
      success: true,
      category: data.category,
      message: data.message,
    };
  } catch (error) {
    console.error('Error creating subcategory:', error);
    throw error;
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    validateInput({ id }, ['id']);

    console.log('Updating category:', id, 'with data:',
      categoryData instanceof FormData ? Array.from(categoryData.entries()) : categoryData
    );

    const isFormData = categoryData instanceof FormData;
    const data = await apiFetch(`${CATEGORIES_ENDPOINT}/${id}`, {
      method: 'PUT',
      body: categoryData,
    });

    const category = data.category;
    if (category && category.image) {
      if (!category.image.startsWith('http://') && !category.image.startsWith('https://')) {
        category.imageUrl = category.image.startsWith('/')
          ? `${API_BASE_URL}${category.image}`
          : `${API_BASE_URL}/uploads/categories/${category.image}`;
      } else {
        category.imageUrl = category.image;
      }
    }

    return {
      success: true,
      category,
      message: data.message,
    };
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  validateInput({ id }, ['id']);

  try {
    const response = await apiFetch(`${CATEGORIES_ENDPOINT}/${id}`, {
      method: 'DELETE',
    });

    if (response && response.status === 400) {
      const data = response;
      if (data.canForceDelete) {
        return {
          success: false,
          canForceDelete: true,
          activeProductsCount: data.activeProductsCount,
          affectedCategoryIds: data.affectedCategoryIds,
          message: data.message,
        };
      }
      throw new Error(data.message);
    }

    const data = response;
    return {
      success: true,
      data: data.data,
      message: data.message,
    };
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const checkCategoryDeletion = async (id) => {
  validateInput({ id }, ['id']);

  try {
    const data = await apiFetch(`${CATEGORIES_ENDPOINT}/${id}/deletion-check`, {
      method: 'GET',
    });
    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('Error checking category deletion:', error);
    throw error;
  }
};

export const forceDeleteCategory = async (id, action) => {
  validateInput({ id, action }, ['id', 'action']);

  const validActions = ['deactivate_products', 'move_to_uncategorized', 'delete_products'];
  if (!validActions.includes(action)) {
    throw new Error(`Invalid action. Must be one of: ${validActions.join(', ')}`);
  }

  try {
    const response = await fetch(`${CATEGORIES_ENDPOINT}/${id}/force`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ action }),
    });

    const data = await handleResponse(response);
    return {
      success: true,
      data: data.data,
      message: data.message,
    };
  } catch (error) {
    console.error('Error force deleting category:', error);
    throw error;
  }
};

export const searchCategories = async (query) => {
  validateInput({ q: query }, ['q']);

  try {
    const params = new URLSearchParams({ q: query.trim() });
    const response = await fetch(`${CATEGORIES_ENDPOINT}/search?${params.toString()}`, {
      credentials: 'include',
    });

    const data = await handleResponse(response);

    return {
      success: true,
      categories: fixCategoryImageUrls(data.categories || []),
      query: data.query,
      totalResults: data.totalResults || 0,
    };
  } catch (error) {
    console.error('Error searching categories:', error);
    throw error;
  }
};

export const getCategoriesForSelection = async (excludeCategoryIds = []) => {
  try {
    const response = await getCategories();

    if (!response.success) {
      throw new Error('Failed to fetch categories');
    }

    const flattenCategories = (categories, level = 0) => {
      const result = [];

      for (const category of categories) {
        if (excludeCategoryIds.includes(category.id)) {
          continue;
        }

        result.push({
          id: category.id,
          name: category.name,
          fullName: '  '.repeat(level) + category.name,
          brandName: category.brandName,
          image: category.image,
          imageUrl: category.imageUrl,
          parentId: category.parentId,
          level,
          isSubcategory: !!category.parentId,
          productCount: category.productCount || 0,
          hasSubcategories: category.subCategories && category.subCategories.length > 0
        });

        if (category.subCategories && category.subCategories.length > 0) {
          result.push(...flattenCategories(category.subCategories, level + 1));
        }
      }

      return result;
    };

    const flatCategories = flattenCategories(response.categories);

    return {
      success: true,
      categories: flatCategories
    };
  } catch (error) {
    console.error('Error fetching categories for selection:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch categories',
      categories: []
    };
  }
};

export const deleteCategoryWithProductMove = async (categoryId, targetCategoryId = null) => {
  try {
    console.log(`Checking deletion impact for category ${categoryId}...`);
    const deletionCheck = await checkCategoryDeletion(categoryId);

    if (!deletionCheck.success) {
      throw new Error('Failed to check category deletion impact');
    }

    const { affectedProducts, canDelete, totalAffectedProducts } = deletionCheck.data;

    if (canDelete) {
      console.log('No active products found, proceeding with regular deletion...');
      const deleteResult = await deleteCategory(categoryId);
      return {
        success: true,
        message: 'Category deleted successfully',
        movedProducts: 0,
        deletedCategory: deleteResult.data
      };
    }

    console.log('Fetching available categories for product relocation...');
    const categoriesResponse = await getCategories();

    if (!categoriesResponse.success) {
      throw new Error('Failed to fetch categories for product relocation');
    }

    const availableCategories = categoriesResponse.categories;
    const deletionCheckData = deletionCheck.data;
    const affectedCategoryIds = deletionCheckData.affectedSubcategories?.map(sub => sub.id) || [];
    affectedCategoryIds.push(categoryId);

    const validTargetCategories = availableCategories.filter(cat =>
      !affectedCategoryIds.includes(cat.id) &&
      cat.id !== categoryId
    );

    if (validTargetCategories.length === 0) {
      throw new Error('No valid target categories available for product relocation');
    }

    let finalTargetCategoryId = targetCategoryId;

    if (!finalTargetCategoryId) {
      let uncategorizedCategory = availableCategories.find(cat =>
        cat.name.toLowerCase() === 'uncategorized' && !cat.parentId
      );

      if (!uncategorizedCategory) {
        console.log('Creating "Uncategorized" category...');
        const createResult = await createCategory(prepareCategoryFormData({
          name: 'Uncategorized',
          description: 'Default category for relocated products'
        }));

        if (!createResult.success) {
          throw new Error('Failed to create Uncategorized category');
        }

        finalTargetCategoryId = createResult.category.id;
      } else {
        finalTargetCategoryId = uncategorizedCategory.id;
      }
    }

    if (affectedCategoryIds.includes(finalTargetCategoryId)) {
      throw new Error('Cannot move products to a category that is being deleted');
    }

    console.log(`Moving ${totalAffectedProducts} products to category ${finalTargetCategoryId}...`);
    const moveResults = [];
    let successfulMoves = 0;
    let failedMoves = 0;

    for (const product of affectedProducts) {
      try {
        console.log(`Moving product ${product.id} (${product.name}) to target category...`);

        const formData = new FormData();
        formData.append('categoryId', finalTargetCategoryId);

        const updateResult = await updateProduct(product.id, formData);

        if (updateResult.success) {
          moveResults.push({
            productId: product.id,
            productName: product.name,
            success: true
          });
          successfulMoves++;
        } else {
          throw new Error(`Failed to update product ${product.id}`);
        }
      } catch (error) {
        console.error(`Failed to move product ${product.id}:`, error);
        moveResults.push({
          productId: product.id,
          productName: product.name,
          success: false,
          error: error.message
        });
        failedMoves++;
      }
    }

    if (failedMoves > 0) {
      throw new Error(`Failed to move ${failedMoves} out of ${totalAffectedProducts} products. Cannot proceed with category deletion.`);
    }

    console.log(`Successfully moved ${successfulMoves} products. Proceeding with category deletion...`);

    const deleteResult = await deleteCategory(categoryId);

    if (!deleteResult.success) {
      console.error('Category deletion failed even after moving products:', deleteResult);
      throw new Error(`Products were moved successfully, but category deletion failed: ${deleteResult.message}`);
    }

    return {
      success: true,
      message: `Category deleted successfully. ${successfulMoves} products were relocated.`,
      movedProducts: successfulMoves,
      targetCategoryId: finalTargetCategoryId,
      moveResults,
      deletedCategory: deleteResult.data || { id: categoryId }
    };
  } catch (error) {
    console.error('Error in deleteCategoryWithProductMove:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete category with product relocation',
      error: error
    };
  }
};

export const handleCategoryDeletionWithUI = async (categoryId, showConfirmDialog, showCategorySelector) => {
  try {
    const checkResult = await checkCategoryDeletion(categoryId);

    if (!checkResult.success) {
      throw new Error('Failed to check deletion impact');
    }

    const { canDelete, totalAffectedProducts, category } = checkResult.data;

    if (canDelete) {
      const confirmed = await showConfirmDialog({
        title: 'Delete Category',
        message: `Are you sure you want to delete "${category.name}"?`,
        type: 'warning'
      });

      if (!confirmed) return { success: false, message: 'Deletion cancelled' };

      return await deleteCategory(categoryId);
    }

    const action = await showConfirmDialog({
      title: 'Category Has Active Products',
      message: `"${category.name}" has ${totalAffectedProducts} active products. What would you like to do?`,
      options: [
        { value: 'move', label: `Move products to another category and delete` },
        { value: 'cancel', label: 'Cancel deletion' }
      ]
    });

    if (action !== 'move') {
      return { success: false, message: 'Deletion cancelled' };
    }

    const affectedIds = [categoryId, ...(checkResult.data.affectedSubcategories?.map(sub => sub.id) || [])];
    const categoriesResult = await getCategoriesForSelection(affectedIds);

    if (!categoriesResult.success || categoriesResult.categories.length === 0) {
      throw new Error('No available categories for product relocation');
    }

    const targetCategoryId = await showCategorySelector({
      title: 'Select Target Category',
      message: `Choose where to move the ${totalAffectedProducts} products:`,
      categories: categoriesResult.categories,
      allowCreateNew: true
    });

    if (!targetCategoryId) {
      return { success: false, message: 'No target category selected' };
    }

    return await deleteCategoryWithProductMove(categoryId, targetCategoryId);
  } catch (error) {
    console.error('Error in handleCategoryDeletionWithUI:', error);
    return {
      success: false,
      message: error.message || 'Failed to handle category deletion'
    };
  }
};

export const prepareCategoryFormData = (categoryData, isMainCategory = true) => {
  const formData = new FormData();

  if (categoryData.name) {
    formData.append('name', categoryData.name.trim());
  }

  if (categoryData.brandName) {
    formData.append('brandName', categoryData.brandName.trim());
  }

  if (!isMainCategory && categoryData.parentId) {
    formData.append('parentId', categoryData.parentId.toString());
  }

  if (isMainCategory && categoryData.image instanceof File) {
    formData.append('image', categoryData.image);
    console.log('Image file added to FormData:', categoryData.image.name);
  } else if (!isMainCategory && categoryData.image) {
    console.warn('Ignoring image for subcategory - subcategories cannot have images');
  }

  return formData;
};

export const validateCategoryData = (categoryData, isMainCategory = true) => {
  const errors = [];

  if (!categoryData.name || categoryData.name.trim().length < 2) {
    errors.push('Category name must be at least 2 characters long');
  }

  if (!isMainCategory) {
    if (!categoryData.parentId || isNaN(parseInt(categoryData.parentId))) {
      errors.push('Valid parent category ID is required for subcategories');
    }
  }

  if (categoryData.image instanceof File) {
    if (!isMainCategory) {
      errors.push('Subcategories cannot have images. Only main categories can have images.');
    } else {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(categoryData.image.type)) {
        errors.push('Image must be JPEG, PNG, or WebP format');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (categoryData.image.size > maxSize) {
        errors.push('Image size must be less than 5MB');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// User Type API Functions
export const getUserTypes = async () => {
  const data = await apiFetch(USER_TYPES_ENDPOINT, {
    method: 'GET',
  });
  return {
    success: true,
    userTypes: data.data || [],
  };
};

export const createUserType = async (formData) => {
  // Convert object to FormData if needed
  let requestData = formData;
  let hasFile = false;

  if (!(formData instanceof FormData)) {
    const { name, description, icon } = formData;

    requestData = new FormData();
    requestData.append('name', name.trim());
    if (description) requestData.append('description', description.trim());
    if (icon instanceof File) {
      requestData.append('icon', icon);
      hasFile = true;
    }
  } else {
    hasFile = true; // Assume FormData has files
  }

  const data = await apiFetch(USER_TYPES_ENDPOINT, {
    method: 'POST',
    body: requestData,
  });
  return {
    success: true,
    userType: data.data,
    message: data.message,
  };
};

export const updateUserType = async (id, formData) => {
  // Convert object to FormData if needed
  let requestData = formData;
  let hasFile = false;

  if (!(formData instanceof FormData)) {
    const { name, description, isActive, icon } = formData;

    requestData = new FormData();
    requestData.append('name', name.trim());
    if (description) requestData.append('description', description.trim());
    if (isActive !== undefined) requestData.append('isActive', isActive);
    if (icon instanceof File) {
      requestData.append('icon', icon);
      hasFile = true;
    }
  } else {
    hasFile = true; // Assume FormData has files
  }

  const data = await apiFetch(`${USER_TYPES_ENDPOINT}/${id}`, {
    method: 'PUT',
    body: requestData,
  });
  return {
    success: true,
    userType: data.data,
    message: data.message,
  };
};

export const deleteUserType = async (id) => {
  const data = await apiFetch(`${USER_TYPES_ENDPOINT}/${id}`, {
    method: 'DELETE',
  });
  return {
    success: true,
    message: data.message,
  };
};
// Admin API Functions
export const approveUser = async (userId, { status, reason }) => {
  const validStatuses = ['Approved', 'Rejected'];
  validateInput({ userId, status }, ['userId', 'status'], { validStatuses });
  const data = await apiFetch(`${ADMIN_ENDPOINT}/users/${userId}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, reason }),
  });
  return {
    success: true,
    user: data.data,
    message: data.message,
  };
};

export const getPendingUsers = async ({ page = 1, limit = 10, search }) => {
  validateInput({ page, limit }, ['page', 'limit']);

  const params = new URLSearchParams({
    page,
    limit,
    ...(search && { search }),
  });

  const data = await apiFetch(`${ADMIN_ENDPOINT}/users/pending?${params.toString()}`, {
    method: 'GET',
  });

  return {
    success: true,
    users: data.data || [],
    pagination: {
      currentPage: data.pagination?.currentPage || 1,
      totalPages: data.pagination?.totalPages || 1,
      totalItems: data.pagination?.totalItems || 0,
      limit: data.pagination?.limit || 10,
    },
  };
};

export const getRoleStats = async () => {
  const response = await fetch(`${ADMIN_ENDPOINT}/stats`, {
    credentials: 'include',
  });
  const data = await handleResponse(response);
  return {
    success: true,
    stats: data.data || {},
    roleHierarchy: data.roleHierarchy || {},
  };
};

export const getDashboardStats = async (period) => {
  const params = period ? `?period=${encodeURIComponent(period)}` : '';
  const data = await apiFetch(`${ADMIN_ENDPOINT}/dashboard${params}`, {
    method: 'GET',
  });
  return {
    success: true,
    data: data.data || {},
  };
};

// Enquiry API Functions
export const getAllEnquiries = async ({
  page = 1,
  limit = 10,
  search,
  status,
  priority,
  source,
  userRole,
  stateName,
  cityName,
  createdFrom,
  createdTo,
  sortBy = 'createdAt',
  sortOrder = 'DESC',
}) => {
  const validStatuses = ['New', 'InProgress', 'Resolved', 'Closed'];
  const validPriorities = ['Low', 'Medium', 'High'];
  const validSources = ['Website', 'Phone', 'Email', 'Other'];
  const validRoles = ['General', 'Customer', 'Architect', 'Dealer', 'Admin', 'Manager', 'Sales', 'Support', 'SuperAdmin'];
  validateInput(
    { page, limit, status, priority, source, userRole },
    ['page', 'limit'],
    { validStatuses, validPriorities, validSources, validRoles }
  );

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(status && { status }),
    ...(priority && { priority }),
    ...(source && { source }),
    ...(userRole && { userRole }),
    ...(stateName && { stateName }),
    ...(cityName && { cityName }),
    ...(createdFrom && { createdFrom }),
    ...(createdTo && { createdTo }),
    sortBy,
    sortOrder,
  });

  const response = await fetch(`${ENQUIRIES_ENDPOINT}/all?${params.toString()}`, {
    credentials: 'include',
  });
  const data = await handleResponse(response);
  return {
    success: true,
    data: data.data || [],
    pagination: data.pagination || {},
    summary: data.summary || {},
    filters: data.filters || {},
  };
};

export const getEnquiryById = async (id) => {
  validateInput({ id }, ['id']);
  const response = await fetch(`${ENQUIRIES_ENDPOINT}/${id}`, {
    credentials: 'include',
  });
  const data = await handleResponse(response);
  return {
    success: true,
    data: data.data,
  };
};

export const createEnquiry = async (enquiryData) => {
  const validSources = ['Website', 'Phone', 'Email', 'Other'];
  validateInput(enquiryData, ['userName', 'userEmail', 'userPhone', 'stateName', 'cityName'], {
    validateEmail: true,
    validSources,
  });

  const response = await fetch(`${ENQUIRIES_ENDPOINT}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(enquiryData),
  });
  const data = await handleResponse(response);
  return {
    success: true,
    data: data.data,
    message: data.message,
  };
};

export const updateEnquiry = async (id, enquiryData) => {
  const validSources = ['Website', 'Phone', 'Email', 'Other'];
  validateInput({ id }, ['id'], { validSources });

  const data = await apiFetch(`${ENQUIRIES_ENDPOINT}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(enquiryData),
  });
  return {
    success: true,
    data: data.data,
    message: data.message,
  };
};

export const updateEnquiryStatus = async (id, { status, adminNotes, assignedTo }) => {
  const validStatuses = ['New', 'InProgress', 'Resolved', 'Closed'];
  validateInput({ id, status }, ['id', 'status'], { validStatuses });

  const data = await apiFetch(`${ENQUIRIES_ENDPOINT}/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, adminNotes, assignedTo }),
  });
  return {
    success: true,
    data: data.data,
    message: data.message,
  };
};

export const scheduleVideoCall = async (id, videoCallData) => {
  validateInput({ id, ...videoCallData }, ['id', 'scheduledAt', 'platform']);

  const response = await fetch(`${ENQUIRIES_ENDPOINT}/${id}/video-call`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(videoCallData),
  });
  const data = await handleResponse(response);
  return {
    success: true,
    data: data.data,
    message: data.message,
  };
};

export const addFollowUp = async (id, followUpData) => {
  validateInput({ id, ...followUpData }, ['id', 'notes']);

  const response = await fetch(`${ENQUIRIES_ENDPOINT}/${id}/follow-up`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(followUpData),
  });
  const data = await handleResponse(response);
  return {
    success: true,
    data: data.data,
    message: data.message,
  };
};

export const toggleEnquiryActiveStatus = async (id) => {
  validateInput({ id }, ['id']);

  const response = await fetch(`${ENQUIRIES_ENDPOINT}/${id}/toggle-active`, {
    method: 'PUT',
    credentials: 'include',
  });
  const data = await handleResponse(response);
  return {
    success: true,
    data: data.data,
    message: data.message,
  };
};

export const getEnquiryStats = async (period = '30') => {
  validateInput({ period }, ['period']);
  const params = new URLSearchParams({ period });

  const response = await fetch(`${ENQUIRIES_ENDPOINT}/stats?${params.toString()}`, {
    credentials: 'include',
  });
  const data = await handleResponse(response);
  return {
    success: true,
    data: data.data,
  };
};

// SEO API Functions
export const getAllSeo = async () => {
  const data = await apiFetch(SEO_ENDPOINT, {
    method: 'GET',
  });
  return {
    success: true,
    seo: data.data || [],
  };
};

export const getAllPageNames = async () => {
  const data = await apiFetch(`${SEO_ENDPOINT}/pagenames`, {
    method: 'GET',
  });
  return {
    success: true,
    pageNames: data.data || [],
  };
};

export const createSeo = async (seoData) => {
  validateInput(seoData, ['pageName', 'title']);
  const data = await apiFetch(SEO_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(seoData),
  });
  return {
    success: true,
    seo: data.data,
    message: data.message,
  };
};

export const getSeoById = async (id) => {
  validateInput({ id }, ['id']);
  const data = await apiFetch(`${SEO_ENDPOINT}/${id}`, {
    method: 'GET',
  });
  return {
    success: true,
    seo: data.data,
  };
};

export const getSeoByPageName = async (pageName) => {
  validateInput({ pageName }, ['pageName']);
  const data = await apiFetch(`${SEO_ENDPOINT}/page/${encodeURIComponent(pageName)}`, {
    method: 'GET',
  });
  return {
    success: true,
    seo: data.data,
  };
};

export const updateSeo = async (id, seoData) => {
  validateInput({ id, ...seoData }, ['id', 'pageName', 'title']);
  const payload = { ...seoData, keywords: seoData.keywords || '' };
  const data = await apiFetch(`${SEO_ENDPOINT}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return {
    success: true,
    seo: data.data,
    message: data.message,
  };
};

export const deleteSeo = async (id) => {
  validateInput({ id }, ['id']);
  const data = await apiFetch(`${SEO_ENDPOINT}/${id}`, {
    method: 'DELETE',
  });
  return {
    success: true,
    message: data.message,
  };
};

// Contact API Functions
// Contact API Functions (Updated for Cookie-Based Auth)
export const submitContactForm = async (contactData) => {
  validateInput(contactData, ['name', 'email', 'phoneNumber', 'location', 'message'], {
    validateEmail: true,
  });

  const response = await fetch(`${CONTACTS_ENDPOINT}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // CRITICAL: Include cookies for httpOnly auth
    body: JSON.stringify(contactData),
  });

  // Handle 401 (expired/invalid session)
  if (response.status === 401) {
    clearAuthData(); // Clear localStorage user data
    throw new Error('Session expired. Redirecting to login.');
  }

  const data = await handleResponse(response);
  return {
    success: true,
    contact: data.data,
    message: data.message,
  };
};

export const getAllContacts = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams ? `${CONTACTS_ENDPOINT}/all?${queryParams}` : `${CONTACTS_ENDPOINT}/all`;

  const response = await fetch(url, {
    credentials: 'include', // CRITICAL: Include cookies for httpOnly auth
  });

  // Handle 401 (expired/invalid session)
  if (response.status === 401) {
    clearAuthData(); // Clear localStorage user data
    throw new Error('Session expired. Redirecting to login.');
  }

  const data = await handleResponse(response);
  return {
    success: true,
    contacts: data.data || [],
    pagination: data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 },
  };
};

export const getContactById = async (id) => {
  validateInput({ id }, ['id']);

  const response = await fetch(`${CONTACTS_ENDPOINT}/${id}`, {
    credentials: 'include', // CRITICAL: Include cookies for httpOnly auth
  });

  // Handle 401 (expired/invalid session)
  if (response.status === 401) {
    clearAuthData(); // Clear localStorage user data
    throw new Error('Session expired. Redirecting to login.');
  }

  const data = await handleResponse(response);
  return {
    success: true,
    contact: data.data,
  };
};

// Order API Functions
export const getUserOrderHistory = async (userId, {
  status,
  paymentStatus,
  startDate,
  endDate,
  page = 1,
  limit = 10,
  sortBy = 'orderDate',
  sortOrder = 'DESC'
} = {}) => {
  validateInput({ userId, page, limit }, ['userId', 'page', 'limit']);

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
    ...(status && { status: Array.isArray(status) ? status.join(',') : status }),
    ...(paymentStatus && { paymentStatus: Array.isArray(paymentStatus) ? paymentStatus.join(',') : paymentStatus }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  const data = await apiFetch(`${USERS_ENDPOINT}/${userId}/orders?${params.toString()}`, {
    method: 'GET',
  });
  return {
    success: true,
    orders: data.orders || [],
    orderSummary: data.orderSummary || {},
    filters: data.filters || {},
    pagination: data.pagination || {},
    sorting: data.sorting || {},
  };
};

export const getFullOrderHistory = async ({
  status,
  paymentStatus,
  startDate,
  endDate,
  page = 1,
  limit = 10,
  sortBy = 'orderDate',
  sortOrder = 'DESC'
} = {}) => {
  validateInput({ page, limit }, ['page', 'limit']);

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
    ...(status && { status: Array.isArray(status) ? status.join(',') : status }),
    ...(paymentStatus && { paymentStatus: Array.isArray(paymentStatus) ? paymentStatus.join(',') : paymentStatus }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  const data = await apiFetch(`${USERS_ENDPOINT}/orders/full?${params.toString()}`, {
    method: 'GET',
  });
  return {
    success: true,
    orders: data.orders || [],
    orderSummary: data.orderSummary || {},
    filters: data.filters || {},
    pagination: data.pagination || {},
    sorting: data.sorting || {},
  };
};

// Utility Functions
export const isAuthenticated = () => {
  // Check for user data in localStorage (for UX; actual auth via cookies)
  const user = getUser();
  return !!user;
};


export const getCurrentUser = () => {
  // Get user data from localStorage (for UX; actual auth via cookies)
  const user = getUser();
  if (!user) return { success: false, user: null, message: 'No user data found' };

  return {
    success: true,
    user: {
      id: user.id,
      role: user.role,
      status: user.status,
      email: user.email,
      userTypeId: user.userTypeId,
      name: user.name,
      company: user.company,
      mobile: user.mobile,
    },
  };
};

export const setAuthData = (user) => {
  try {
    if (!user || !user.id || !user.email || !user.role) {
      console.warn('Invalid user data:', user);
      return false;
    }
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status || 'Approved',
      userTypeId: user.userTypeId || null,
    };
    setUser(payload);
    return true;
  } catch (error) {
    console.error('Error setting auth data:', error);
    return false;
  }
};

export const clearAuth = () => {
  clearAuthData();
};