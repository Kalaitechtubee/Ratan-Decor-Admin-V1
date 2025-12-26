import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Filter, Eye, Edit, AlertCircle, CheckCircle, Loader2, X, FileText, Trash2, Search } from 'lucide-react';
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

  const searchTimeoutRef = useRef(null);
  const hasFetchedUserTypesRef = useRef(false);

  useEffect(() => {
    const user = getUser();
    if (user && user.role) {
      setUserRole(user.role);
    }
  }, []);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    source: '',
    role: '',
  });

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
  }, [filters]);

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
    <div className="p-6 space-y-6 font-roboto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enquiries Management</h1>
          <p className="text-gray-600">Manage customer enquiries</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddEnquiry(true)}
            className="flex items-center px-4 py-2 space-x-2 text-white rounded-lg bg-primary hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            <span>Add Enquiry</span>
          </button>
        </div>
      </div>

      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search enquiries... (auto-search after you stop typing)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value, false);
              }}
              className="w-full py-2 pl-4 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
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
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center px-4 py-2 space-x-2 text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <X size={16} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t border-gray-200 sm:grid-cols-3">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            >
              <option value="">All Status</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/([A-Z])/g, ' $1').trim()}
                </option>
              ))}
            </select>
            <select
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            >
              <option value="">All Sources</option>
              {SOURCES.map((source) => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            >
              <option value="">All Roles</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table
          data={enquiries}
          columns={columns}
          onRowClick={(enquiry) => {
            handleViewClick(enquiry);
          }}
          pagination={{
            currentPage: currentPage,
            totalPages: totalPages,
            onPageChange: setCurrentPage,
            totalItems: totalItems,
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