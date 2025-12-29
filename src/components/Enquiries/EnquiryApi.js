import axios from 'axios';
import {
  getAccessToken,
  setAccessToken,
  clearAuthData,
  updateTokenFromResponse,
  updateTokenFromData,
  refreshAccessToken,
  redirectToLogin,
} from '../../utils/tokenHandler';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Include cookies (refresh token) in requests
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (import.meta.env.DEV) {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        data: config.data,
        params: config.params,
      });
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    // Check if backend returned a new access token in response header (after middleware refresh)
    const tokenUpdated = updateTokenFromResponse(response, true);
    if (tokenUpdated) {
      const newToken = getAccessToken();
      if (newToken) {
        apiClient.defaults.headers.Authorization = `Bearer ${newToken}`;
      }
    }

    // Also check if response contains a token refresh (legacy support)
    const tokenUpdatedFromData = updateTokenFromData(response.data);
    if (tokenUpdatedFromData) {
      const newToken = getAccessToken();
      if (newToken) {
        apiClient.defaults.headers.Authorization = `Bearer ${newToken}`;
      }
    }

    if (import.meta.env.DEV) {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const errorDetails = {
      message: error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    };

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.log('EnquiryApi: Received 401, attempting token refresh...');
        const refreshResult = await refreshAccessToken(API_URL.replace('/api', ''));

        if (refreshResult.success && refreshResult.token) {
          console.log('EnquiryApi: Token refreshed, retrying original request');
          apiClient.defaults.headers.Authorization = `Bearer ${refreshResult.token}`;
          originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
          return apiClient(originalRequest);
        }

        // No token received
        throw new Error('No access token received from refresh endpoint');
      } catch (refreshError) {
        console.error('EnquiryApi: Refresh token failed:', refreshError.message);
        clearAuthData();
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    console.error('API Error:', errorDetails);

    // If 401 and refresh failed, redirect to login
    if (error.response?.status === 401) {
      clearAuthData();
      redirectToLogin();
    }

    return Promise.reject(new Error(errorDetails.message));
  }
);

// Get current user info from token
const getCurrentUserFromToken = () => {
  try {
    const token = getAccessToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.id, role: payload.role, email: payload.email };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const validateInput = (data, requiredFields, options = {}) => {
  const { validateEmail, validStatuses, validatePincode } = options;
  let inputData = { ...data };
  const missingFields = requiredFields.filter(
    (field) =>
      inputData[field] === undefined ||
      inputData[field] === null ||
      (typeof inputData[field] === 'string' && inputData[field].trim() === '')
  );
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  if (validateEmail && inputData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inputData.email)) {
      throw new Error('Invalid email format');
    }
  }

  if (inputData.phoneNo) {
    const cleanPhone = inputData.phoneNo.replace(/[^\d]/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      throw new Error('Phone number must be between 10-15 digits');
    }
    inputData.phoneNo = cleanPhone;
  }

  if (validStatuses && inputData.status && !validStatuses.includes(inputData.status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  if (validatePincode && inputData.pincode) {
    const cleanPincode = inputData.pincode.replace(/[^\d]/g, '');
    if (!cleanPincode || cleanPincode.length !== 6) {
      throw new Error('Pincode must be a 6-digit number');
    }
    inputData.pincode = cleanPincode;
  }

  if (inputData.productId !== undefined && inputData.productId !== null && inputData.productId !== '') {
    const productId = parseInt(inputData.productId, 10);
    if (isNaN(productId)) {
      throw new Error('Invalid product ID format');
    }
    inputData.productId = productId;
  }

  return inputData;
};

export const createEnquiry = async (enquiryData) => {
  try {
    const validSources = ['WhatsApp', 'Phone', 'VideoCall', 'Website'];
    const currentUser = getCurrentUserFromToken();

    // Ensure userId is an integer or null (not undefined or string)
    let userId = null;
    if (currentUser?.id) {
      const parsedId = parseInt(currentUser.id, 10);
      userId = isNaN(parsedId) ? null : parsedId;
    }

    // Ensure productId is an integer or null
    let productId = null;
    if (enquiryData.productId) {
      const parsedProductId = parseInt(enquiryData.productId, 10);
      productId = isNaN(parsedProductId) ? null : parsedProductId;
    }

    const formattedData = validateInput(
      {
        userId: userId, // Now guaranteed to be integer or null
        productId: productId, // Now guaranteed to be integer or null
        name: enquiryData.name?.trim(),
        email: enquiryData.email?.trim().toLowerCase(),
        phoneNo: enquiryData.phoneNo,
        companyName: enquiryData.companyName?.trim() || null,
        state: enquiryData.state?.trim(),
        city: enquiryData.city?.trim(),
        userType: enquiryData.userType || 'General',
        source: enquiryData.source || 'Website',
        notes: enquiryData.notes?.trim() || null,
        videoCallDate: enquiryData.videoCallDate || null,
        videoCallTime: enquiryData.videoCallTime || null,
        productDesignNumber: enquiryData.productDesignNumber?.trim() || null,
        role: enquiryData.role || 'Customer',
        pincode: enquiryData.pincode || null,
      },
      ['name', 'email', 'phoneNo', 'state', 'city'],
      { validateEmail: true, validSources, validatePincode: true }
    );

    console.log('Creating enquiry with formatted data:', formattedData);

    const response = await apiClient.post('/enquiries/create', formattedData);
    if (!response.data?.success || !response.data?.data) {
      throw new Error(response.data?.message || 'Invalid response format from server');
    }

    return {
      success: true,
      message: response.data.message || 'Enquiry created successfully',
      data: response.data.data,
    };
  } catch (error) {
    console.error('Create enquiry failed:', error);
    throw new Error(error.message || 'Failed to create enquiry');
  }
};

export const getAllEnquiries = async ({ page = 1, limit = 10, search, status, source, userType, state, city, role, pincode, priority, startDate, endDate, includeNotes = false }) => {
  try {
    const validStatuses = ['New', 'InProgress', 'Confirmed', 'Delivered', 'Rejected'];
    const validSources = ['WhatsApp', 'Phone', 'VideoCall', 'Website'];

    validateInput({ page, limit, pincode }, ['page', 'limit'], { validStatuses, validSources, validatePincode: true });

    const params = { page, limit, search, status, source, userType, state, city, role, pincode, priority, startDate, endDate, includeNotes };
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== '' && value !== null && value !== undefined && value !== 'all')
    );

    const response = await apiClient.get('/enquiries/all', { params: cleanParams });
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to fetch enquiries');
    }

    return {
      success: true,
      data: response.data.data || [],
      pagination: response.data.pagination || {},
      summary: response.data.summary || { totalEnquiries: 0, statusBreakdown: {} },
    };
  } catch (error) {
    console.error('Get all enquiries failed:', error);
    throw new Error(error.message || 'Failed to fetch enquiries');
  }
};

export const getEnquiryById = async (id, includeNotes = false) => {
  try {
    validateInput({ id }, ['id']);

    const response = await apiClient.get(`/enquiries/${id}`, { params: { includeNotes } });
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to fetch enquiry');
    }

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Get enquiry by ID failed:', error);
    throw new Error(error.message || 'Failed to fetch enquiry');
  }
};

export const updateEnquiry = async (id, enquiryData) => {
  try {
    const validStatuses = ['New', 'InProgress', 'Confirmed', 'Delivered', 'Rejected'];
    const validSources = ['WhatsApp', 'Phone', 'VideoCall', 'Website'];

    const formattedData = validateInput(
      {
        name: enquiryData.name?.trim(),
        email: enquiryData.email?.trim().toLowerCase(),
        phoneNo: enquiryData.phoneNo,
        companyName: enquiryData.companyName?.trim() || null,
        state: enquiryData.state?.trim(),
        city: enquiryData.city?.trim(),
        userType: enquiryData.userType || 'General',
        source: enquiryData.source || 'Website',
        notes: enquiryData.notes?.trim() || null,
        videoCallDate: enquiryData.videoCallDate || null,
        videoCallTime: enquiryData.videoCallTime || null,
        productId: enquiryData.productId || null,
        productDesignNumber: enquiryData.productDesignNumber?.trim() || null,
        role: enquiryData.role || 'Customer',
        status: enquiryData.status || undefined,
        pincode: enquiryData.pincode || null, // New field
      },
      [], // No required fields for update - allow partial updates
      { validateEmail: enquiryData.email ? true : false, validStatuses, validSources, validatePincode: true }
    );

    // Remove undefined values to avoid backend issues
    const cleanData = Object.fromEntries(
      Object.entries(formattedData).filter(([_, v]) => v !== undefined)
    );

    console.log('Updating enquiry with formatted data:', cleanData);

    const response = await apiClient.put(`/enquiries/${id}`, cleanData);
    if (!response.data?.success || !response.data?.data) {
      throw new Error(response.data?.message || 'Invalid response format from server');
    }

    return {
      success: true,
      message: response.data.message || 'Enquiry updated successfully',
      data: response.data.data,
    };
  } catch (error) {
    console.error('Update enquiry failed:', error);
    throw new Error(error.message || 'Failed to update enquiry');
  }
};

export const updateEnquiryStatus = async (id, { status, notes, role, pincode }) => {
  try {
    const validStatuses = ['New', 'InProgress', 'Confirmed', 'Delivered', 'Rejected'];

    const formattedData = validateInput(
      {
        id,
        status,
        notes: notes?.trim() || null,
        role: role || 'Customer',
        pincode: pincode || null, // New field
      },
      ['id', 'status'],
      { validStatuses, validatePincode: true }
    );

    const response = await apiClient.put(`/enquiries/${id}/status`, formattedData);
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to update enquiry status');
    }

    return {
      success: true,
      message: response.data.message || 'Status updated successfully',
      data: response.data.data,
    };
  } catch (error) {
    console.error('Update enquiry status failed:', error);
    throw new Error(error.message || 'Failed to update enquiry status');
  }
};

export const addInternalNote = async (enquiryId, noteData) => {
  try {
    const validNoteTypes = ['Follow-up', 'Contact Attempt', 'Meeting Notes', 'Status Update', 'Other'];
    const currentUser = getCurrentUserFromToken();

    const formattedData = validateInput(
      {
        note: noteData.note?.trim(),
        noteType: noteData.noteType || 'Follow-up',
        isImportant: noteData.isImportant || false,
        followUpDate: noteData.followUpDate || null,
        userId: noteData.userId || null,
        productId: noteData.productId || null,
      },
      ['note'],
      { validNoteTypes }
    );

    console.log('Adding internal note with formatted data:', formattedData);

    const response = await apiClient.post(`/enquiries/${enquiryId}/internal-notes`, formattedData);
    if (!response.data?.success || !response.data?.data) {
      throw new Error(response.data?.message || 'Invalid response format from server');
    }

    return {
      success: true,
      message: response.data.message || 'Internal note added successfully',
      data: response.data.data,
    };
  } catch (error) {
    console.error('Add internal note failed:', error);
    throw new Error(error.message || 'Failed to add internal note');
  }
};

export const getInternalNotes = async (enquiryId, { page = 1, limit = 20 }) => {
  try {
    validateInput({ enquiryId, page, limit }, ['enquiryId', 'page', 'limit']);

    const response = await apiClient.get(`/enquiries/${enquiryId}/internal-notes`, { params: { page, limit } });
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to fetch internal notes');
    }

    return {
      success: true,
      data: response.data.data || [],
      pagination: response.data.pagination || {},
    };
  } catch (error) {
    console.error('Get internal notes failed:', error);
    throw new Error(error.message || 'Failed to fetch internal notes');
  }
};

export const updateInternalNote = async (noteId, noteData) => {
  try {
    const validNoteTypes = ['Follow-up', 'Contact Attempt', 'Meeting Notes', 'Status Update', 'Other'];

    const formattedData = validateInput(
      {
        note: noteData.note?.trim(),
        noteType: noteData.noteType,
        isImportant: noteData.isImportant,
        followUpDate: noteData.followUpDate,
      },
      [], // No required fields for update - allow partial updates
      { validNoteTypes }
    );

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(formattedData).filter(([_, v]) => v !== undefined)
    );

    console.log('Updating internal note with formatted data:', cleanData);

    const response = await apiClient.put(`/enquiries/internal-notes/${noteId}`, cleanData);
    if (!response.data?.success || !response.data?.data) {
      throw new Error(response.data?.message || 'Invalid response format from server');
    }

    return {
      success: true,
      message: response.data.message || 'Internal note updated successfully',
      data: response.data.data,
    };
  } catch (error) {
    console.error('Update internal note failed:', error);
    throw new Error(error.message || 'Failed to update internal note');
  }
};

export const deleteInternalNote = async (noteId) => {
  try {
    validateInput({ noteId }, ['noteId']);

    const response = await apiClient.delete(`/enquiries/internal-notes/${noteId}`);
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to delete internal note');
    }

    return {
      success: true,
      message: response.data.message || 'Internal note deleted successfully',
    };
  } catch (error) {
    console.error('Delete internal note failed:', error);
    throw new Error(error.message || 'Failed to delete internal note');
  }
};

export const getFollowUpDashboard = async (days = 7) => {
  try {
    validateInput({ days }, ['days']);

    const response = await apiClient.get('/enquiries/dashboard/follow-ups', { params: { days } });
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to fetch follow-up dashboard');
    }

    return {
      success: true,
      data: response.data.data || { upcoming: [], overdue: [], summary: {} },
    };
  } catch (error) {
    console.error('Get follow-up dashboard failed:', error);
    throw new Error(error.message || 'Failed to fetch follow-up dashboard');
  }
};

export const getUserTypes = async () => {
  try {
    const response = await apiClient.get('/user-types');
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to fetch user types');
    }
    return {
      success: true,
      data: response.data.data || [],
    };
  } catch (error) {
    console.error('Get user types failed:', error);
    throw new Error(error.message || 'Failed to fetch user types');
  }
};

export const deleteEnquiry = async (id) => {
  try {
    // Validate enquiry ID
    validateInput({ id }, ['id']);

    // Make DELETE request to the server
    const response = await apiClient.delete(`/enquiries/${id}`);
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to delete enquiry');
    }

    return {
      success: true,
      message: response.data.message || 'Enquiry deleted successfully',
    };
  } catch (error) {
    console.error('Delete enquiry failed:', error);
    throw new Error(error.message || 'Failed to delete enquiry');
  }
};

export default {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  updateEnquiryStatus,
  addInternalNote,
  getInternalNotes,
  updateInternalNote,
  deleteInternalNote,
  getFollowUpDashboard,
  getUserTypes,
  deleteEnquiry,
};