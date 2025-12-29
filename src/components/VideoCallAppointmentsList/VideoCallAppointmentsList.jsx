import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, X, RefreshCw, Eye, Edit, Trash2, AlertCircle, CheckCircle, Loader2, FileText, Calendar, Package, Clock, Video } from 'lucide-react';
import Table from '../Common/Table';
import StatusBadge from '../Common/StatusBadge';
import Modal from '../Common/Modal';
import DeleteConfirmationModal from '../Common/DeleteConfirmationModal';
import ExportButton from '../Common/ExportButton';
import appointmentApi from './appointmentApi';

import { getUserTypes } from '../Enquiries/EnquiryApi';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  // Use useRef to store the search timeout
  const searchTimeoutRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    source: searchParams.get('source') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    userType: searchParams.get('userType') || '',
    role: searchParams.get('role') || '',
  });

  const [summary, setSummary] = useState({
    totalItems: 0,
    statusBreakdown: {},
  });

  const [userTypes, setUserTypes] = useState([]);
  const hasFetchedUserTypesRef = useRef(false);

  // Sync filters and pagination to URL
  useEffect(() => {
    const params = {};
    if (currentPage > 1) params.page = currentPage;
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    setSearchParams(params, { replace: true });
  }, [filters, currentPage, setSearchParams]);

  // Handle URL changes
  useEffect(() => {
    const search = searchParams.get('search') || '';
    setSearchTerm(search);
    setFilters({
      search,
      status: searchParams.get('status') || '',
      source: searchParams.get('source') || '',
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      userType: searchParams.get('userType') || '',
      role: searchParams.get('role') || '',
    });
    const page = parseInt(searchParams.get('page')) || 1;
    setCurrentPage(page);
  }, [searchParams]);

  useEffect(() => {
    if (!hasFetchedUserTypesRef.current) {
      hasFetchedUserTypesRef.current = true;
      getUserTypes().then(res => setUserTypes(res.data || [])).catch(console.error);
    }
  }, []);

  const SOURCES = ['WhatsApp', 'Phone', 'VideoCall', 'Website'];
  const STATUSES = ['New', 'Scheduled', 'Completed', 'Cancelled'];
  const STAFF_ROLES = ['SuperAdmin', 'Admin', 'Manager', 'Sales', 'Support'];
  const ROLES = [
    { label: 'Customer', value: 'customer' },
    { label: 'Architect', value: 'Architect' },
    { label: 'Dealer', value: 'Dealer' },
    { label: 'Admin', value: 'Admin' },
    // { label: 'Manager', value: 'Manager' },
    { label: 'Sales', value: 'Sales' },
    { label: 'Support', value: 'Support' }
  ];

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
        setSummary(response.summary || { totalItems: 0, statusBreakdown: {} });

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

    setFilters({
      search: '',
      status: '',
      source: '',
      startDate: '',
      endDate: '',
      userType: '',
      role: '',
    });
    setSearchTerm('');
    setCurrentPage(1);
    setShowFilters(false);
  }, []);

  const handleDeleteAppointment = (appointmentId) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    setAppointmentToDelete(appointment);
    setShowDeleteModal(true);
  };

  const confirmDeleteAppointment = async () => {
    if (!appointmentToDelete) return;

    try {
      setDeleting(true);
      await appointmentApi.deleteAppointment(appointmentToDelete.id);
      setAppointments((prev) => prev.filter((appt) => appt.id !== appointmentToDelete.id));
      setShowDeleteModal(false);
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
    } finally {
      setDeleting(false);
      setAppointmentToDelete(null);
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
    <div className="p-4 sm:p-6 space-y-6 font-roboto animate-fade-in-left">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Video Call Appointments</h1>
          <p className="text-gray-600">
            {isStaff
              ? `Manage customer video call schedules`
              : 'View and manage your video call appointments'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          {isStaff && (
            <>
              <ExportButton
                data={appointments} // Pass appointments for count display
                columns={[
                  { key: 'appointmentId', header: 'Appointment #' },
                  { key: 'customer', header: 'Customer' },
                  { key: 'email', header: 'Email' },
                  { key: 'phone', header: 'Phone' },
                  { key: 'videoCallDate', header: 'Date' },
                  { key: 'videoCallTime', header: 'Time' },
                  { key: 'status', header: 'Status' },
                  { key: 'source', header: 'Source' },
                  { key: 'notes', header: 'Notes' },
                  { key: 'createdAt', header: 'Created Date' },
                ]}
                filename="video-call-appointments"
                loading={exporting}
                hasFilters={hasActiveFilters}
                onExport={async (format, exportType) => {
                  setExporting(true);
                  try {
                    let allData = [];

                    if (exportType === 'all') {
                      let page = 1;
                      let hasMore = true;

                      while (hasMore) {
                        const response = await appointmentApi.getAllAppointments({
                          page,
                          limit: 100,
                          ...filters,
                          includeNotes: true,
                        });
                        const data = response.data || [];
                        allData = [...allData, ...data];

                        const totalPages = response.pagination?.totalPages || 1;
                        hasMore = page < totalPages;
                        page++;
                      }
                    } else {
                      const response = await appointmentApi.getAllAppointments({
                        page: currentPage,
                        limit: pageSize,
                        ...filters,
                        includeNotes: true,
                      });
                      allData = response.data || [];
                    }

                    return allData.map(a => ({
                      appointmentId: a.id,
                      customer: a.name,
                      email: a.email,
                      phone: a.phoneNo,
                      videoCallDate: a.videoCallDate,
                      videoCallTime: a.videoCallTime,
                      status: a.status,
                      source: a.source || 'VideoCall',
                      notes: a.internalNotes ? a.internalNotes.map(n => n.note).join('; ') : '-',
                      createdAt: new Date(a.createdAt).toLocaleDateString('en-IN'),
                    }));
                  } catch (err) {
                    console.error('Export failed:', err);
                    showToast('Export failed. Please try again.', 'error');
                    return null;
                  } finally {
                    setExporting(false);
                  }
                }}
                totalRecords={totalItems}
                currentPage={currentPage}
                totalPages={totalPages}
              />
              <button
                onClick={() => setShowAddAppointment(true)}
                className="flex items-center px-4 py-2 space-x-2 text-white rounded-lg bg-primary hover:bg-red-600 transition-colors shadow-sm"
              >
                <Plus size={16} />
                <span>Add Appointment</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {isStaff && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Requests', icon: Video, color: 'blue', value: summary.totalItems, status: '' },
            { label: 'New', icon: AlertCircle, color: 'yellow', value: summary.statusBreakdown['New'] || 0, status: 'New' },
            { label: 'Scheduled', icon: Clock, color: 'indigo', value: summary.statusBreakdown['Scheduled'] || 0, status: 'Scheduled', animate: true },
            { label: 'Completed', icon: CheckCircle, color: 'green', value: summary.statusBreakdown['Completed'] || 0, status: 'Completed' },
            { label: 'Cancelled', icon: X, color: 'red', value: summary.statusBreakdown['Cancelled'] || 0, status: 'Cancelled' },
          ].map((stat) => {
            const Icon = stat.icon;
            const isActive = filters.status === stat.status;
            const colors = {
              blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500', ring: 'ring-blue-500/20' },
              yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-500', ring: 'ring-yellow-500/20' },
              indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-500', ring: 'ring-indigo-500/20' },
              green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-500', ring: 'ring-green-500/20' },
              red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-500', ring: 'ring-red-500/20' },
            };
            const c = colors[stat.color] || colors.blue;

            return (
              <div
                key={stat.label}
                className={`p-4 bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${isActive ? `${c.border} ring-2 ${c.ring}` : 'border-transparent'}`}
                onClick={() => handleFilterChange('status', stat.status)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${c.bg} rounded-lg`}>
                    <Icon className={`w-5 h-5 ${c.text} ${stat.animate ? 'animate-spin-slow' : ''}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isActive ? c.text : 'text-gray-900'}`}>{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search and Filters Section */}
      {isStaff && (
        <div className="p-4 sm:p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
              <Filter size={18} />
              Filters
            </h3>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <X size={14} />
                  <span>Clear All</span>
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-gray-600 transition-colors hover:text-primary"
              >
                <Filter size={16} />
                <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="space-y-6">
              {/* Search and Main Selects */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      handleSearch(e.target.value, false);
                    }}
                    className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all bg-white"
                >
                  <option value="">All Status</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={filters.source}
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all bg-white"
                >
                  <option value="">All Sources</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Detailed Grid Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <select
                  value={filters.userType}
                  onChange={(e) => handleFilterChange('userType', e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all bg-white"
                >
                  <option value="">All User Types</option>
                  {userTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>

                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all bg-white"
                >
                  <option value="">All Roles</option>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>



                <div className="relative">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all text-sm"
                  />
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <span className="absolute -top-2 left-2 px-1 bg-white text-[10px] text-gray-500">From</span>
                </div>

                <div className="relative">
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all text-sm"
                  />
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <span className="absolute -top-2 left-2 px-1 bg-white text-[10px] text-gray-500">To</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-500 mr-2">Active filters:</span>
              {Object.entries(filters).map(([key, value]) => {
                if (!value || key === 'search') return null;

                let displayValue = value;
                if (key === 'userType') {
                  const type = userTypes.find(t => t.id.toString() === value.toString());
                  displayValue = type ? type.name : value;
                } else if (key === 'role') {
                  const roleObj = ROLES.find(r => r.value === value);
                  displayValue = roleObj ? roleObj.label : value;
                }

                const chipStyles = {
                  status: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                  priority: 'bg-red-50 text-red-700 border-red-200',
                  role: 'bg-purple-50 text-purple-700 border-purple-200',
                  source: 'bg-blue-50 text-blue-700 border-blue-200',
                  default: 'bg-gray-50 text-gray-700 border-gray-200'
                };
                const style = chipStyles[key] || chipStyles.default;

                return (
                  <div key={key} className={`flex items-center px-3 py-1 rounded-full border text-xs font-medium ${style}`}>
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="ml-1">{displayValue}</span>
                    <button
                      onClick={() => handleFilterChange(key, '')}
                      className="ml-2 hover:opacity-70 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
            loading={refreshing || searching}
            pagination={{
              currentPage: currentPage,
              totalPages: totalPages,
              onPageChange: setCurrentPage,
              totalItems: totalItems,
              itemsPerPage: pageSize,
            }}
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
      <AppointmentDetails
        isOpen={showDetailsModal}
        onClose={() => {
          setSelectedAppointment(null);
          setShowDetailsModal(false);
        }}
        appointment={selectedAppointment}
        onStatusUpdate={handleStatusUpdate}
        onAppointmentDeleted={(id) => {
          setAppointments(prev => prev.filter(appt => appt.id !== id));
          setShowDetailsModal(false);
          setSelectedAppointment(null);
        }}
        isStaff={isStaff}
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

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteAppointment}
        title="Delete Appointment"
        message={`Are you sure you want to delete appointment #${appointmentToDelete?.id} for ${appointmentToDelete?.name}? This action cannot be undone.`}
        loading={deleting}
        itemDisplayName={`Appointment #${appointmentToDelete?.id}`}
      />
    </div>
  );
};

export default VideoCallAppointmentsList;
