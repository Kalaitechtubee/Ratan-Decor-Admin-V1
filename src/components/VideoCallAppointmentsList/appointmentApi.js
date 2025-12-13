// appointmentApi.js (Updated for Cookie-Based Auth - No Token Storage Needed)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Interfaces for type safety (pseudo-TypeScript)
const AppointmentData = {
  name: String,
  email: String,
  phoneNo: String,
  videoCallDate: String,
  videoCallTime: String,
  source: String,
  notes: String,
  status: String,
  userId: Number,
};

const NoteData = {
  note: String,
  noteType: String,
  isImportant: Boolean,
  followUpDate: String,
};

const validateId = (id) => {
  if (!id || isNaN(Number(id))) throw new Error('Invalid or missing ID');
};

const apiFetchWithAuth = async (url, options = {}) => {
  // Always include credentials for httpOnly cookies
  const config = {
    ...options,
    credentials: 'include', // ✅ Critical: Send cookies for auth
  };

  // Remove any Authorization header - rely on cookies
  if (config.headers && config.headers.Authorization) {
    delete config.headers.Authorization;
  }

  const response = await fetch(url, config);

  // Handle 401 globally (session expired)
  if (response.status === 401) {
    // Clear frontend user data (no token to clear)
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    throw new Error('Access denied. Session expired. Redirecting to login.');
  }

  // Handle other errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
};

const appointmentApi = {
  async createAppointment(appointmentData, currentUser) {
    try {
      if (!appointmentData || typeof appointmentData !== 'object') {
        throw new Error('Invalid appointment data');
      }
      const dataWithUser = { ...appointmentData, userId: currentUser?.id || null };
      return await apiFetchWithAuth(`${API_BASE_URL}/video-call-enquiries/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataWithUser),
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw new Error(error.message || 'Failed to create appointment');
    }
  },

  async getAllAppointments({ page = 1, limit = 10, status = '', search = '', includeNotes = false } = {}) {
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
        ...(search && { search }),
        ...(includeNotes && { includeNotes: 'true' }),
      });
      return await apiFetchWithAuth(`${API_BASE_URL}/video-call-enquiries/all?${query}`, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Error fetching all appointments:', error);
      throw new Error(error.message || 'Failed to fetch appointments');
    }
  },

  async getAppointmentById(id, includeNotes = false) {
    try {
      validateId(id);
      const query = includeNotes ? '?includeNotes=true' : '';
      return await apiFetchWithAuth(`${API_BASE_URL}/video-call-enquiries/${id}${query}`, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Error fetching appointment by ID:', error);
      throw new Error(error.message || 'Failed to fetch appointment');
    }
  },

  async getMyAppointments() {
    try {
      return await apiFetchWithAuth(`${API_BASE_URL}/video-call-enquiries/my-enquiries`, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Error fetching my appointments:', error);
      throw new Error(error.message || 'Failed to fetch your appointments');
    }
  },

  async updateAppointment(id, appointmentData, currentUser) {
    try {
      validateId(id);
      if (!appointmentData || typeof appointmentData !== 'object') {
        throw new Error('Invalid appointment data');
      }
      const dataWithUser = { ...appointmentData, userId: currentUser?.id || null };
      return await apiFetchWithAuth(`${API_BASE_URL}/video-call-enquiries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataWithUser),
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw new Error(error.message || 'Failed to update appointment');
    }
  },

  async deleteAppointment(id) {
    try {
      validateId(id);
      return await apiFetchWithAuth(`${API_BASE_URL}/video-call-enquiries/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw new Error(error.message || 'Failed to delete appointment');
    }
  },

  async addInternalNote(enquiryId, noteData) {
    try {
      validateId(enquiryId);
      if (!noteData?.note?.trim()) throw new Error('Note content is required');
      return await apiFetchWithAuth(`${API_BASE_URL}/video-call-enquiries/${enquiryId}/internal-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });
    } catch (error) {
      console.error('Error adding internal note:', error);
      throw new Error(error.message || 'Failed to add internal note');
    }
  },

  async getInternalNotes(enquiryId, { page = 1, limit = 20 } = {}) {
    try {
      validateId(enquiryId);
      const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      return await apiFetchWithAuth(`${API_BASE_URL}/video-call-enquiries/${enquiryId}/internal-notes?${query}`, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Error fetching internal notes:', error);
      throw new Error(error.message || 'Failed to fetch internal notes');
    }
  },

  async updateInternalNote(noteId, noteData) {
    try {
      validateId(noteId);
      if (!noteData || typeof noteData !== 'object') throw new Error('Invalid note data');
      return await apiFetchWithAuth(`${API_BASE_URL}/video-call-enquiries/internal-notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });
    } catch (error) {
      console.error('Error updating internal note:', error);
      throw new Error(error.message || 'Failed to update internal note');
    }
  },

  async deleteInternalNote(noteId) {
    try {
      validateId(noteId);
      return await apiFetchWithAuth(`${API_BASE_URL}/video-call-enquiries/internal-notes/${noteId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting internal note:', error);
      throw new Error(error.message || 'Failed to delete internal note');
    }
  },

  async getFollowUpDashboard(days = 7) {
    try {
      const query = new URLSearchParams({ days: days.toString() });
      return await apiFetchWithAuth(`${API_BASE_URL}/video-call-enquiries/dashboard/follow-ups?${query}`, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Error fetching follow-up dashboard:', error);
      throw new Error(error.message || 'Failed to fetch follow-up dashboard');
    }
  },
};

export default appointmentApi;