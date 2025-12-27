import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Filter, Eye, Edit, AlertCircle, CheckCircle, Loader2, X, FileText, Trash2, Search, Calendar, Package, RefreshCw, Clock } from 'lucide-react';
import Table from '../Common/Table';
import StatusBadge from '../Common/StatusBadge';
import { getAllEnquiries, updateEnquiryStatus, deleteEnquiry, getUserTypes } from './EnquiryApi';
import AddEnquiryForm from './AddEnquiryForm';
import ViewEnquiryModal from './ViewEnquiryModal';
import EditEnquiryModal from './EditEnquiryModal';
import InternalNotesModal from './InternalNotesModal';
import { getUser } from '../../utils/tokenHandler';

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

const EnquiriesList = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(10);
  const [showAddEnquiry, setShowAddEnquiry] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypes, setUserTypes] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [summary, setSummary] = useState({
    totalEnquiries: 0,
    statusBreakdown: {},
  });

  const searchTimeoutRef = useRef(null);
  const hasFetchedUserTypesRef = useRef(false);

  useEffect(() => {
    const user = getUser();
    if (user && user.role) {
      setUserRole(user.role);
    }
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    source: searchParams.get('source') || '',
    role: searchParams.get('role') || '',
    priority: searchParams.get('priority') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    userType: searchParams.get('userType') || '',
  });

  // Effect to sync filters and pagination to URL
  useEffect(() => {
    const params = {};
    if (currentPage > 1) params.page = currentPage;

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });

    setSearchParams(params, { replace: true });
  }, [filters, currentPage, setSearchParams]);

  // Handle URL changes (back/forward)
  useEffect(() => {
    const search = searchParams.get('search') || '';
    setSearchTerm(search);

    setFilters({
      search,
      status: searchParams.get('status') || '',
      source: searchParams.get('source') || '',
      role: searchParams.get('role') || '',
      priority: searchParams.get('priority') || '',
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      userType: searchParams.get('userType') || '',
    });

    const page = parseInt(searchParams.get('page')) || 1;
    setCurrentPage(page);
  }, [searchParams]);

  const ROLES = ['Customer', 'Dealer', 'Architect', 'Admin', 'Manager', 'Sales', 'Support'];
  const SOURCES = ['Email', 'WhatsApp', 'Phone', 'VideoCall'];
  const STATUSES = ['New', 'InProgress', 'Confirmed', 'Delivered', 'Rejected'];

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => value !== '');
  }, [filters]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const fetchEnquiries = useCallback(
    async (showLoader = true, isSearching = false) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else if (isSearching) {
          setSearching(true);
        } else {
          setRefreshing(true);
        }

        const response = await getAllEnquiries({
          page: currentPage,
          limit: pageSize,
          ...filters,
          includeNotes: false,
        });

        setEnquiries(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalItems(response.pagination?.totalItems || 0);
        setSummary(response.summary || { totalEnquiries: 0, statusBreakdown: {} });
      } catch (err) {
        console.error('Error fetching enquiries:', err);
        showToast(err.message || 'Failed to fetch enquiries. Please try again later.', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setSearching(false);
      }
    },
    [currentPage, pageSize, filters, showToast]
  );

  // Search function that triggers on button click or after typing stops
  const handleSearch = useCallback((value, isButtonClick = false) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (isButtonClick) {
      // Immediate search on button click
      setCurrentPage(1);
      setFilters((prev) => ({ ...prev, search: value.trim() }));
      return;
    }

    if (!value.trim()) {
      // Clear search immediately
      setCurrentPage(1);
      setFilters((prev) => ({ ...prev, search: '' }));
      return;
    }

    // Auto-search after 1.5 seconds of typing
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      setFilters((prev) => ({ ...prev, search: value.trim() }));
    }, 1500);
  }, []);

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearchTerm('');
    setCurrentPage(1);
    setShowFilters(false);
    setFilters({
      search: '',
      status: '',
      source: '',
      role: '',
      priority: '',
      startDate: '',
      endDate: '',
      userType: '',
    });
  }, []);

  const handleStatusUpdate = async (enquiryId, status, notes = '') => {
    try {
      const response = await updateEnquiryStatus(enquiryId, { status, notes });
      setEnquiries((prev) =>
        prev.map((enq) => (enq.id === enquiryId ? { ...enq, ...response.data } : enq))
      );
      showToast(`Status updated to ${status}`);
    } catch (err) {
      console.error('Error updating status:', err);
      showToast(err.message || 'Failed to update status. Please try again.', 'error');
    }
  };

  const handleEditClick = (enquiry) => {
    setSelectedEnquiryId(enquiry.id);
    setShowEditModal(true);
    setShowViewModal(false);
  };

  const handleViewClick = (enquiry) => {
    setSelectedEnquiryId(enquiry.id);
    setShowViewModal(true);
    setShowEditModal(false);
  };

  // New function to handle edit button click from view modal
  const handleEditFromView = (enquiry) => {
    setSelectedEnquiryId(enquiry.id);
    setShowViewModal(false);
    setShowEditModal(true);
  };

  const handleNotesClick = (enquiry) => {
    setSelectedEnquiryId(enquiry.id);
    setShowNotesModal(true);
  };

  const handleDeleteClick = async (enquiry) => {
    if (window.confirm(`Are you sure you want to delete enquiry #${enquiry.id}?`)) {
      try {
        await deleteEnquiry(enquiry.id);
        setEnquiries((prev) => prev.filter((enq) => enq.id !== enquiry.id));
        setTotalItems((prev) => prev - 1);
        showToast('Enquiry deleted successfully!');

        if (enquiries.length === 1 && currentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        } else {
          fetchEnquiries(false);
        }
      } catch (err) {
        console.error('Error deleting enquiry:', err);
        showToast(err.message || 'Failed to delete enquiry. Please try again.', 'error');
      }
    }
  };

  const handleEnquiryAdded = (newEnquiry) => {
    setEnquiries((prev) => [newEnquiry, ...prev.slice(0, pageSize - 1)]);
    setShowAddEnquiry(false);
    showToast('Enquiry created successfully!');
    if (currentPage === 1) {
      fetchEnquiries(false);
    }
  };

  const handleEnquiryUpdated = (updatedEnquiry) => {
    setEnquiries((prev) =>
      prev.map((enq) => (enq.id === updatedEnquiry.id ? { ...enq, ...updatedEnquiry } : enq))
    );
    setShowEditModal(false);
    showToast('Enquiry updated successfully!');
  };

  const handleNotesUpdated = () => {
    fetchEnquiries(false);
    setShowNotesModal(false);
    showToast('Internal notes updated successfully!');
  };

  const columns = useMemo(
    () => [
      {
        key: 'id',
        header: 'Enquiry #',
        sortable: true,
        render: (value, item) => (
          <div>
            <div className="font-medium text-gray-900 font-roboto">{value}</div>
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
            <div className="text-xs text-gray-500">{item.phone || item.phoneNo}</div>
            {item.user?.city && item.user?.state && (
              <div className="text-xs text-gray-400">{item.user.city}, {item.user.state}</div>
            )}
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        sortable: true,
        render: (value, item) => (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 font-roboto">
            {value}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (value) => <StatusBadge status={value} type="enquiry" />,
      },
      {
        key: 'source',
        header: 'Source',
        sortable: true,
        render: (value) => value || '-',
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(item);
              }}
              className="p-1 rounded text-primary hover:bg-red-50 transition-colors"
              title="Edit Enquiry"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNotesClick(item);
              }}
              className="p-1 rounded text-green-600 hover:bg-green-50 transition-colors"
              title="View/Edit Notes"
            >
              <FileText size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(item);
              }}
              className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
              title="Delete Enquiry"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchEnquiries();
    }
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current && !isFetchingRef.current) {
      isFetchingRef.current = true;
      fetchEnquiries(false, true);
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 500);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    if (!hasFetchedUserTypesRef.current) {
      hasFetchedUserTypesRef.current = true;
      const fetchUserTypes = async () => {
        try {
          const response = await getUserTypes();
          setUserTypes(response.data || []);
        } catch (error) {
          console.error('Error fetching user types:', error);
        }
      };
      fetchUserTypes();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading enquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 font-roboto animate-fade-in-left">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Enquiries Management</h1>
          <p className="text-gray-600">Track and manage customer product enquiries</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddEnquiry(true)}
            className="flex items-center px-4 py-2 space-x-2 text-white rounded-lg bg-primary hover:bg-red-600 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Add Enquiry</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Matching Orders Page */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Enquiries', icon: Package, color: 'blue', value: summary.totalEnquiries, status: '' },
          { label: 'New', icon: AlertCircle, color: 'yellow', value: summary.statusBreakdown['New'] || 0, status: 'New' },
          { label: 'In Progress', icon: Clock, color: 'indigo', value: summary.statusBreakdown['InProgress'] || 0, status: 'InProgress', animate: true },
          { label: 'Confirmed', icon: CheckCircle, color: 'green', value: summary.statusBreakdown['Confirmed'] || 0, status: 'Confirmed' },
          { label: 'Rejected', icon: X, color: 'red', value: summary.statusBreakdown['Rejected'] || 0, status: 'Rejected' },
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

      {/* Filters Section - Matching Orders Page Layout */}
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
                  placeholder="Search by name, email, phone, company..."
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
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
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

      {/* Main Table Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table
          data={enquiries}
          columns={columns}
          onRowClick={(enquiry) => {
            handleViewClick(enquiry);
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
      </div>

      <AddEnquiryForm
        isOpen={showAddEnquiry}
        onClose={() => setShowAddEnquiry(false)}
        onEnquiryAdded={handleEnquiryAdded}
        roles={ROLES}
        sources={SOURCES}
        showToast={showToast}
      />

      {/* View Details Modal */}
      <ViewEnquiryModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        enquiryId={selectedEnquiryId}
        onEnquiryUpdated={handleEnquiryUpdated}
        userTypes={userTypes}
        showToast={showToast}
        onEditClick={handleEditFromView}
      />

      {/* Edit Modal */}
      <EditEnquiryModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        enquiryId={selectedEnquiryId}
        onEnquiryUpdated={handleEnquiryUpdated}
        roles={ROLES}
        sources={SOURCES}
        statuses={STATUSES}
        userTypes={userTypes}
        showToast={showToast}
      />

      <InternalNotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        enquiry={selectedEnquiryId ? enquiries.find(e => e.id === selectedEnquiryId) : null}
        onNotesUpdated={handleNotesUpdated}
        showToast={showToast}
      />
    </div>
  );
};

export default EnquiriesList;