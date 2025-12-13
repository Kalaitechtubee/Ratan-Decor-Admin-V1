import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Search, Filter, X, RefreshCw, Eye, Edit, Trash2, AlertCircle, CheckCircle, Loader2, FileText } from 'lucide-react';
import Table from '../Common/Table';
import StatusBadge from '../Common/StatusBadge';
import Modal from '../Common/Modal';
import appointmentApi from './appointmentApi';
import AddEditAppointment from './AddEditAppointment';
import AppointmentDetails from './AppointmentDetails';
import InternalNotes from './InternalNotes';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
  const textColor = type === 'error' ? 'text-red-700' : 'text-green-700';
  const iconColor = type === 'error' ? 'text-red-500' : 'text-green-500';

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg border ${bgColor} shadow-lg z-50 max-w-sm`}>
      <div className="flex items-start gap-3">
        {type === 'error' ? (
          <AlertCircle size={20} className={iconColor} />
        ) : (
          <CheckCircle size={20} className={iconColor} />
        )}
        <div className="flex-1">
          <p className={`${textColor} text-sm font-medium`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`${textColor} hover:opacity-70 transition-opacity`}
          aria-label="Close toast"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

const LoadingSpinner = ({ size = 'default', className = '' }) => {
  const sizeClass = size === 'small' ? 'w-4 h-4' : 'w-6 h-6';
  return <Loader2 className={`animate-spin ${sizeClass} ${className}`} />;
};

const EmptyState = ({ onRefresh, isStaff }) => (
  <div className="text-center py-12">
    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
    <p className="mt-1 text-sm text-gray-500">
      {isStaff 
        ? 'Get started by adding your first video call appointment.' 
        : 'No appointments scheduled yet. Schedule one to get started.'
      }
    </p>
    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
      <button
        onClick={onRefresh}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Refresh
      </button>
      {isStaff && (
        <button
          className="px-4 py-2 bg-primary text-white rounded-md shadow-sm text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={() => { /* Trigger add modal */ }}
        >
          Add Appointment
        </button>
      )}
    </div>
  </div>
);

const VideoCallAppointmentsList = ({ currentUser }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(10);
  const [errorMessage, setErrorMessage] = useState(null);
  const [toast, setToast] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [showEditAppointment, setShowEditAppointment] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Use useRef to store the search timeout
  const searchTimeoutRef = useRef(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    source: '',
  });

  const SOURCES = ['VideoCall', 'Website', 'Phone', 'Email'];
  const STATUSES = ['New', 'Scheduled', 'Completed', 'Cancelled'];
  const STAFF_ROLES = ['SuperAdmin', 'Admin', 'Manager', 'Sales', 'Support'];

  const showToast = React.useCallback((message, type = 'success') => setToast({ message, type }), []);
  const closeToast = React.useCallback(() => setToast(null), []);

  const hasActiveFilters = useMemo(() => Object.values(filters).some((value) => value !== ''), [filters]);
  const isStaff = STAFF_ROLES.includes(currentUser?.role);

  // Use a ref to track if component is mounted to prevent multiple calls on mount
  const isMountedRef = React.useRef(false);

  const fetchAppointments = useCallback(
    async (showLoader = true, isSearching = false) => {
      try {
        if (showLoader) setLoading(true);
        else if (isSearching) setSearching(true);
        else setRefreshing(true);
        setErrorMessage(null);

        let response;
        if (isStaff) {
          response = await appointmentApi.getAllAppointments({
            page: currentPage,
            limit: pageSize,
            ...filters,
            includeNotes: true,
          });
          console.log('API Response (All Appointments):', response);
        } else {
          response = await appointmentApi.getMyAppointments();
          console.log('API Response (My Appointments):', response);
        }

        const appointmentsData = Array.isArray(response.data) ? response.data : (response || []);
        setAppointments(appointmentsData);
        
        const pagination = response.pagination || {};
        setTotalPages(pagination.totalPages || 1);
        setTotalItems(pagination.totalItems || appointmentsData.length);
        
        if (appointmentsData.length === 0 && currentPage === 1 && showLoader) {
          showToast('No appointments found. Create one to get started!', 'info');
        }
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setErrorMessage(err.message || 'Failed to fetch appointments. Please try again later.');
        showToast(err.message || 'Failed to load appointments', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setSearching(false);
      }
    },
    [currentUser?.role, currentPage, pageSize, filters, isStaff, showToast]
  );

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      fetchAppointments();
    } else {
      // Fetch when filters change
      fetchAppointments(false, true);
    }
  }, [fetchAppointments, filters]);

  // Search function that triggers on button click or after typing stops
  const handleSearch = useCallback((value, isButtonClick = false) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (isButtonClick) {
      // Immediate search on button click
      setFilters((prev) => ({ ...prev, search: value.trim() }));
      setCurrentPage(1);
      setSearching(true);
      return;
    }

    if (!value.trim()) {
      // Clear search
      setFilters((prev) => ({ ...prev, search: '' }));
      setCurrentPage(1);
      return;
    }

    // Auto-search after 1.5 seconds of typing
    searchTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value.trim() }));
      setCurrentPage(1);
    }, 1500);
  }, []);

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  }, []);

  const handleRefreshAndClearFilters = useCallback(() => {
    // Clear search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Reset all filters and search term
    setFilters({ search: '', status: '', source: '' });
    setSearchTerm('');
    setCurrentPage(1);
    setShowFilters(false);
    
    // Fetch fresh data after filters are cleared
    setTimeout(() => {
      fetchAppointments(false);
    }, 0);
  }, [fetchAppointments]);

  const clearFilters = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    setFilters({ search: '', status: '', source: '' });
    setSearchTerm('');
    setCurrentPage(1);
    setShowFilters(false);
  }, []);

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) return;

    try {
      await appointmentApi.deleteAppointment(appointmentId);
      setAppointments((prev) => prev.filter((appt) => appt.id !== appointmentId));
      setShowDetailsModal(false);
      setSelectedAppointment(null);
      showToast('Appointment deleted successfully!');

      if (appointments.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchAppointments(false);
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
      showToast(err.message || 'Failed to delete appointment. Please try again.', 'error');
    }
  };

  const handleEditClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowEditAppointment(true);
  };

  const handleViewClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleAppointmentSaved = (savedAppointment, isEdit = false) => {
    if (isEdit) {
      setAppointments((prev) =>
        prev.map((appt) => (appt.id === savedAppointment.id ? savedAppointment : appt))
      );
      setSelectedAppointment(savedAppointment);
      showToast('Appointment updated successfully!');
    } else {
      setAppointments((prev) => [savedAppointment, ...prev.slice(0, pageSize - 1)]);
      showToast('Appointment created successfully!');
      if (currentPage === 1) fetchAppointments(false);
    }
  };

  const handleAppointmentAdded = (newAppointment) => {
    setAppointments((prev) => [newAppointment, ...prev.slice(0, pageSize - 1)]);
    setShowAddAppointment(false);
    showToast('Appointment created successfully!');
    if (currentPage === 1) {
      fetchAppointments(false);
    }
  };

  const handleAppointmentUpdated = (updatedAppointment) => {
    setAppointments((prev) =>
      prev.map((appt) => (appt.id === updatedAppointment.id ? { ...appt, ...updatedAppointment } : appt))
    );
    setSelectedAppointment((prev) => ({ ...prev, ...updatedAppointment }));
    setShowEditAppointment(false);
    showToast('Appointment updated successfully!');
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      const response = await appointmentApi.updateAppointment(appointmentId, { status: newStatus }, currentUser);
      setSelectedAppointment(response.data);
      setAppointments((prev) =>
        prev.map((appt) => (appt.id === appointmentId ? response.data : appt))
      );
      showToast('Status updated successfully!');
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Failed to update status', 'error');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'id',
        header: 'Appointment #',
        sortable: true,
        render: (value, item) => (
          <div>
            <div className="font-medium text-gray-900 font-roboto flex items-center">
              {value}
              {item.internalNotes && item.internalNotes.length > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {item.internalNotes.length} notes
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(item.createdAt).toLocaleDateString()}
            </div>
          </div>
        ),
      },
      {
        key: 'name',
        header: 'Customer',
        sortable: true,
        render: (value, item) => (
          <div>
            <div className="font-medium text-gray-900 font-roboto">{value}</div>
            <div className="text-sm text-gray-500">{item.email}</div>
            <div className="text-xs text-gray-500">{item.phoneNo}</div>
          </div>
        ),
      },
      {
        key: 'videoCallDate',
        header: 'Schedule',
        sortable: true,
        render: (value, item) => (
          <div className="text-sm">
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-gray-500">{item.videoCallTime}</div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (value) => <StatusBadge status={value} type="appointment" />,
      },
      {
        key: 'source',
        header: 'Source',
        sortable: true,
        render: (value) => (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 font-roboto">
            {value || 'VideoCall'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (value, item) => (
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewClick(item);
              }}
              className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors"
              title="View Details"
            >
              <Eye size={16} />
            </button>
            {isStaff && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(item);
                  }}
                  className="p-1 rounded text-primary hover:bg-red-50 transition-colors"
                  title="Edit Appointment"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAppointment(item);
                    setShowNotesModal(true);
                  }}
                  className="p-1 rounded text-green-600 hover:bg-green-50 transition-colors"
                  title="View Notes"
                >
                  <FileText size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAppointment(item.id);
                  }}
                  className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete Appointment"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [currentUser?.role, isStaff]
  );

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center" role="alert">
          <AlertCircle size={40} className="mx-auto mb-4 text-red-500" />
          <p className="text-gray-600">{errorMessage}</p>
          <button
            onClick={() => fetchAppointments(false)}
            className="mt-4 flex items-center px-4 py-2 space-x-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            aria-label="Retry fetching appointments"
          >
            <RefreshCw size={16} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center" role="alert">
          <LoadingSpinner className="mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 font-roboto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Call Appointments</h1>
          <p className="text-gray-600">
            {isStaff
              ? `Manage video call appointment requests (${totalItems} total)`
              : 'View and manage your video call appointments'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          {isStaff && (
            <button
              onClick={() => setShowAddAppointment(true)}
              className="flex items-center px-4 py-2 space-x-2 text-white rounded-lg bg-primary hover:opacity-90 transition-opacity"
              aria-label="Add Appointment"
            >
              <Plus size={16} />
              <span>Add Appointment</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Section */}
      {isStaff && (
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search appointments... (auto-search after you stop typing)"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value, false);
                }}
                className="w-full py-2 pl-4 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                aria-label="Search Appointments"
              />
              <button
                onClick={() => handleSearch(searchTerm, true)}
                disabled={searching}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary disabled:opacity-50 transition-colors"
                title="Search"
                aria-label="Search Button"
              >
                {searching ? (
                  <LoadingSpinner size="small" className="text-primary" />
                ) : (
                  <Search size={18} />
                )}
              </button>
            </div>
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="flex items-center px-4 py-2 space-x-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap"
              aria-label="Toggle Filters"
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center px-4 py-2 space-x-2 text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap"
                aria-label="Clear Filters"
              >
                <X size={16} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t border-gray-200 sm:grid-cols-2">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                aria-label="Filter by Status"
              >
                <option value="">All Status</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select
                value={filters.source}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                aria-label="Filter by Source"
              >
                <option value="">All Sources</option>
                {SOURCES.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {appointments.length === 0 ? (
          <EmptyState onRefresh={() => fetchAppointments(false)} isStaff={isStaff} />
        ) : (
          <Table
            data={appointments}
            columns={columns}
            onRowClick={(appointment) => {
              setSelectedAppointment(appointment);
              setShowDetailsModal(true);
            }}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            className="min-w-full"
            aria-label="Appointments Table"
          />
        )}
      </div>

      {/* Add Appointment Modal */}
      <AddEditAppointment
        isOpen={showAddAppointment}
        onClose={() => setShowAddAppointment(false)}
        onSave={(savedAppointment) => {
          handleAppointmentAdded(savedAppointment);
        }}
        onToast={showToast}
        currentUser={currentUser}
        title="Add New Video Call Appointment"
        sources={SOURCES}
        statuses={STATUSES}
      />

      {/* Edit Appointment Modal */}
      <AddEditAppointment
        isOpen={showEditAppointment}
        onClose={() => setShowEditAppointment(false)}
        onSave={(savedAppointment) => {
          handleAppointmentUpdated(savedAppointment);
        }}
        onToast={showToast}
        currentUser={currentUser}
        appointment={selectedAppointment}
        title={`Edit Appointment - ${selectedAppointment?.id}`}
        sources={SOURCES}
        statuses={STATUSES}
      />

      {/* Appointment Details Modal */}
      <AddEditAppointment
        isOpen={showDetailsModal}
        onClose={() => {
          setSelectedAppointment(null);
          setShowDetailsModal(false);
        }}
        onSave={(savedAppointment) => {
          handleAppointmentUpdated(savedAppointment);
        }}
        onToast={showToast}
        currentUser={currentUser}
        appointment={selectedAppointment}
        title={`Appointment Details - ${selectedAppointment?.id}`}
        sources={SOURCES}
        statuses={STATUSES}
        readOnly={true}
      />

      {/* Internal Notes Modal */}
      <Modal
        isOpen={showNotesModal}
        onClose={() => {
          setShowNotesModal(false);
          setSelectedAppointment(null);
        }}
        title={`Internal Notes - Appointment ${selectedAppointment?.id}`}
      >
        <InternalNotes
          enquiryId={selectedAppointment?.id}
          currentUser={currentUser}
          onToast={showToast}
        />
      </Modal>
    </div>
  );
};

export default VideoCallAppointmentsList;