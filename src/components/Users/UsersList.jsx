import React, { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';
import {
  Users,
  Search,
  Filter,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Pencil,
  Trash2,
  ShoppingBag,
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Mail,
  Phone,
  Clock,
  Shield,
  MoreVertical,
  Loader2,
  X
} from 'lucide-react';
import {
  getAllUsers,
  getUserById,
  approveUser,
  getPendingUsers,
  updateUser,
  deleteUser,
  getUserOrderHistory
} from '../../services/Api';

// Allowed role/status options shown in filters and edit forms (customer view only)
const roleOptions = [
  { value: 'customer', label: 'Customer' },
  { value: 'architect', label: 'Architect' },
  { value: 'dealer', label: 'Dealer' },
];

const validStatuses = ['Pending', 'Approved', 'Rejected'];

const LoadingSpinner = ({ size = 'default', className = '' }) => {
  const sizeClass = size === 'small' ? 'w-4 h-4' : 'w-6 h-6';
  return <Loader2 className={`animate-spin ${sizeClass} ${className}`} />;
};

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
    userTypeName: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    status: '',
    company: '',
    userTypeId: ''
  });

  // Order history state
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [orderHistory, setOrderHistory] = useState({
    orders: [],
    summary: null,
    pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
    loading: false,
    error: null
  });
  const [orderFilters, setOrderFilters] = useState({
    status: '',
    paymentStatus: '',
    page: 1,
    limit: 5
  });

  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeoutRef = useRef(null);
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);
  const showPendingOnlyRef = useRef(showPendingOnly);
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  useEffect(() => {
    showPendingOnlyRef.current = showPendingOnly;
  }, [showPendingOnly]);

  const debouncedLoadUsers = useCallback(
    debounce(async () => {
      try {
        setLoading(true);
        setError(null);

        const currentFilters = filtersRef.current;
        const currentPagination = paginationRef.current;
        const currentShowPendingOnly = showPendingOnlyRef.current;

        const queryParams = {
          page: currentPagination.currentPage,
          limit: currentPagination.limit,
          ...(currentFilters.role ? { role: currentFilters.role.toLowerCase() } : {}),
          ...(currentFilters.status ? { status: currentFilters.status } : {}),
          ...(currentFilters.search ? { search: currentFilters.search } : {}),
          ...(currentFilters.userTypeName ? { userTypeName: currentFilters.userTypeName } : {}),
        };

        const response = currentShowPendingOnly
          ? await getPendingUsers(queryParams)
          : await getAllUsers(queryParams);

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch users');
        }

        setUsers(response.users || []);
        setPagination({
          currentPage: response.pagination.currentPage || 1,
          totalPages: response.pagination.totalPages || 1,
          totalItems: response.pagination.totalItems || 0,
          limit: response.pagination.limit || 10,
        });
      } catch (err) {
        console.error('Error loading users:', err);
        setError(err.message || 'Failed to load users. Please try again.');
        setUsers([]);
      } finally {
        setLoading(false);
        setSearching(false);
      }
    }, 300),
    []
  );

  // Search function that triggers on button click or after typing stops
  const handleSearch = useCallback((value, isButtonClick = false) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (isButtonClick) {
      // Immediate search on button click
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      setFilters((prev) => ({ ...prev, search: value.trim() }));
      return;
    }

    if (!value.trim()) {
      // Clear search immediately
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      setFilters((prev) => ({ ...prev, search: '' }));
      return;
    }

    // Auto-search after 1.5 seconds of typing
    searchTimeoutRef.current = setTimeout(() => {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      setFilters((prev) => ({ ...prev, search: value.trim() }));
    }, 1500);
  }, []);

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearchTerm('');
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setShowFilters(false);
    setFilters({
      role: '',
      status: '',
      search: '',
      userTypeName: '',
    });
  }, []);

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  // Order history refs
  const orderFiltersRef = useRef(orderFilters);

  useEffect(() => {
    orderFiltersRef.current = orderFilters;
  }, [orderFilters]);

  // Load user order history
  const loadUserOrderHistory = useCallback(async (userId) => {
    if (!userId) return;

    try {
      setOrderHistory(prev => ({ ...prev, loading: true, error: null }));

      const currentOrderFilters = orderFiltersRef.current;

      const response = await getUserOrderHistory(userId, {
        ...currentOrderFilters,
        sortBy: 'orderDate',
        sortOrder: 'DESC'
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch order history');
      }

      setOrderHistory({
        orders: response.orders || [],
        summary: response.orderSummary || null,
        pagination: response.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 },
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('Error loading order history:', err);
      setOrderHistory(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load order history'
      }));
    }
  }, []);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      debouncedLoadUsers();
    }
  }, [debouncedLoadUsers]);

  useEffect(() => {
    if (hasFetchedRef.current && !isFetchingRef.current) {
      isFetchingRef.current = true;
      debouncedLoadUsers();
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 500);
    }
  }, [filters, showPendingOnly, debouncedLoadUsers]);

  useEffect(() => {
    if (hasFetchedRef.current) {
      debouncedLoadUsers();
    }
  }, [pagination.currentPage, debouncedLoadUsers]);

  // Load order history when showing it
  useEffect(() => {
    if (showOrderHistory && selectedUser?.id) {
      loadUserOrderHistory(selectedUser.id);
    }
  }, [showOrderHistory, selectedUser?.id, orderFilters, loadUserOrderHistory]);

  const handleViewUserDetails = async (user) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getUserById(user.id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch user details');
      }

      setSelectedUser(response.user);
      setIsEditing(false);
      setShowOrderHistory(false);
      setOrderHistory({
        orders: [],
        summary: null,
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(err.message || 'Failed to load user details. Please try again.');
      setSelectedUser(user);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (user) => {
    await handleViewUserDetails(user);
    const u = user.id === selectedUser?.id ? selectedUser : user;
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      role: u.role || '',
      status: u.status || '',
      company: u.company || '',
      userTypeId: u.userTypeId || ''
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true);
      setError(null);
      const resp = await updateUser(selectedUser.id, editForm);
      if (!resp.success) {
        throw new Error(resp.message || 'Failed to update user');
      }
      setSelectedUser(resp.user);
      setIsEditing(false);
      debouncedLoadUsers();
      toast.success('User updated successfully');
    } catch (err) {
      console.error('Update user error:', err);
      toast.error(err.message || 'Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm('Are you sure you want to delete this user? This action cannot be undone.');
    if (!confirmed) return;
    try {
      setLoading(true);
      setError(null);
      const resp = await deleteUser(userId);
      if (!resp.success) {
        throw new Error(resp.message || 'Failed to delete user');
      }
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
      debouncedLoadUsers();
      toast.success('User deleted successfully');
    } catch (err) {
      console.error('Delete user error:', err);
      toast.error(err.message || 'Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId, status, reason = '') => {
    try {
      setLoading(true);
      setError(null);

      const response = await approveUser(userId, { status, reason });
      if (!response.success) {
        throw new Error(response.message || `Failed to ${status.toLowerCase()} user`);
      }

      debouncedLoadUsers();

      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({
          ...selectedUser,
          status: response.user.status,
          rejectionReason: response.user.rejectionReason,
        });
      }

      toast.success(`User ${status.toLowerCase()} successfully!`);
    } catch (err) {
      console.error(`Error ${status.toLowerCase()} user:`, err);
      toast.error(err.message || `Failed to ${status.toLowerCase()} user. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectWithReason = (userId) => {
    const reason = prompt('Please enter rejection reason:');
    if (reason) {
      handleApproveUser(userId, 'Rejected', reason);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'Rejected':
        return <XCircle className="text-red-500" size={16} />;
      case 'Pending':
        return <Clock className="text-yellow-500" size={16} />;
      default:
        return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getOrderStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'processing': 'bg-purple-100 text-purple-800',
      'shipped': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'returned': 'bg-gray-100 text-gray-800'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-orange-100 text-orange-800',
      'partially refunded': 'bg-orange-100 text-orange-600'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const handlePageChange = (page) => {
    setPagination({ ...pagination, currentPage: page });
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="  mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="mr-3 text-primary" size={28} />
                Users Management
              </h1>
              <p className="mt-1 text-gray-600">View and manage all users</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPendingOnly(!showPendingOnly)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <Filter className="mr-2" size={16} />
                {showPendingOnly ? 'Show All' : 'Show Pending'}
              </button>
              <button
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <Download className="mr-2" size={16} />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by name or email... (auto-search after you stop typing)"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value, false);
                }}
                className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                onClick={() => handleSearch(searchTerm, true)}
                disabled={searching}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary disabled:opacity-50 transition-colors"
                title="Search"
              >
                {searching ? (
                  <LoadingSpinner size="small" className="text-primary" />
                ) : (
                  <Search size={20} />
                )}
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <Filter className="mr-2" size={16} />
              Filters
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
                className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <option value="">All Roles</option>
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              <select
                className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                {validStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search by user type..."
                value={filters.userTypeName}
                onChange={(e) => handleFilterChange('userTypeName', e.target.value)}
                className="py-2 pr-4 pl-4 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner className="text-primary mr-3" />
              <span className="text-gray-600">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.role || filters.status
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by creating your first user.'}
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registered
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewUserDetails(user)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {user.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Shield className="text-primary mr-2" size={16} />
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'Architect' || user.role === 'Dealer'
                                ? 'bg-red-100 text-primary'
                                : 'bg-gray-100 text-gray-800'
                              }`}>
                              {user.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(user.status)}
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                              {user.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.company || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.userType?.name || `Type ${user.userTypeId}` || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewUserDetails(user);
                              }}
                              className="text-primary hover:text-red-700 p-1 rounded transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditUser(user);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                              title="Edit User"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(user.id);
                              }}
                              className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                            {user.status === 'Pending' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveUser(user.id, 'Approved');
                                  }}
                                  className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                                  title="Approve User"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectWithReason(user.id);
                                  }}
                                  className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                                  title="Reject User"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                            {user.status === 'Rejected' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alert(`Rejection Reason: ${user.rejectionReason || 'No reason provided'}`);
                                }}
                                className="text-yellow-600 hover:text-yellow-800 p-1 rounded transition-colors"
                                title="View Rejection Reason"
                              >
                                <AlertCircle size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)}</span> of{' '}
                        <span className="font-medium">{pagination.totalItems}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        {(() => {
                          const pages = [];
                          const maxVisible = 3;
                          const totalPages = pagination.totalPages;
                          const currentPage = pagination.currentPage;

                          if (totalPages <= maxVisible) {
                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                          } else {
                            let startPage = Math.max(1, currentPage - 1);
                            let endPage = startPage + maxVisible - 1;

                            if (endPage > totalPages) {
                              endPage = totalPages;
                              startPage = Math.max(1, endPage - maxVisible + 1);
                            }

                            for (let i = startPage; i <= endPage; i++) pages.push(i);
                          }

                          return pages.map((page) => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                                  ? 'z-10 bg-primary border-primary text-white'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                              {page}
                            </button>
                          ));
                        })()}
                        <button
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle size={24} />
                  </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                  <button
                    onClick={() => setShowOrderHistory(false)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${!showOrderHistory
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    User Information
                  </button>
                  <button
                    onClick={() => setShowOrderHistory(true)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ml-4 ${showOrderHistory
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <div className="flex items-center space-x-2">
                      <ShoppingBag size={16} />
                      <span>Order History</span>
                    </div>
                  </button>
                </div>

                {!showOrderHistory ? (
                  /* User Information Tab */
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="mb-3 font-medium text-gray-900">Personal Information</h3>
                        {!isEditing ? (
                          <div className="space-y-3">
                            <div className="flex items-center">
                              <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-2xl font-medium text-white">
                                  {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div className="ml-4">
                                <h4 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h4>
                                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                              </div>
                            </div>
                            <div className="space-y-2 text-sm">
                              <p><span className="font-medium text-gray-700">Name:</span> {selectedUser.name}</p>
                              <p><span className="font-medium text-gray-700">Email:</span> {selectedUser.email}</p>
                              <p><span className="font-medium text-gray-700">Phone:</span> {selectedUser.mobile || '-'}</p>
                              {selectedUser.company && (
                                <p><span className="font-medium text-gray-700">Company:</span> {selectedUser.company}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block mb-1 text-sm text-gray-700">Name</label>
                              <input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-sm text-gray-700">Email</label>
                              <input
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-sm text-gray-700">Company</label>
                              <input
                                value={editForm.company}
                                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="mb-3 font-medium text-gray-900">Account Details</h3>
                        {!isEditing ? (
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center">
                              <Shield className="text-primary mr-2" size={16} />
                              <span className="font-medium text-gray-700">Role:</span>
                              <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-primary bg-opacity-10 text-primary">
                                {selectedUser.role}
                              </span>
                            </div>
                            <div className="flex items-center">
                              {getStatusIcon(selectedUser.status)}
                              <span className="ml-2 font-medium text-gray-700">Status:</span>
                              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedUser.status)}`}>
                                {selectedUser.status}
                              </span>
                            </div>
                            <p>
                              <span className="font-medium text-gray-700">User Type:</span>{' '}
                              {selectedUser.userType?.name || `Type ${selectedUser.userTypeId}` || '-'}
                            </p>
                            <p>
                              <span className="font-medium text-gray-700">Registered:</span>{' '}
                              {formatDate(selectedUser.createdAt)}
                            </p>
                            {selectedUser.rejectionReason && (
                              <p>
                                <span className="font-medium text-gray-700">Rejection Reason:</span>{' '}
                                <span className="text-red-600">{selectedUser.rejectionReason}</span>
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block mb-1 text-sm text-gray-700">Role</label>
                              <select
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                              >
                                <option value="">Select Role</option>
                                {roleOptions.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block mb-1 text-sm text-gray-700">Status</label>
                              <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </div>
                            <div>
                              <label className="block mb-1 text-sm text-gray-700">User Type Id</label>
                              <input
                                value={editForm.userTypeId}
                                onChange={(e) => setEditForm({ ...editForm, userTypeId: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {(selectedUser.status === 'Pending' || selectedUser.status === 'Rejected') && (
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="mb-3 font-medium text-gray-900">Admin Actions</h3>
                        <div className="flex space-x-4">
                          <button
                            onClick={() => handleApproveUser(selectedUser.id, 'Approved')}
                            className="flex items-center px-4 py-2 space-x-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                            disabled={loading}
                          >
                            <CheckCircle size={16} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectWithReason(selectedUser.id)}
                            className="flex items-center px-4 py-2 space-x-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            disabled={loading}
                          >
                            <XCircle size={16} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Edit
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            disabled={loading}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Save Changes
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Order History Tab */
                  <div className="space-y-4">
                    {/* Order Summary Cards */}
                    {orderHistory.summary && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-blue-600">Total Orders</p>
                              <p className="text-2xl font-bold text-blue-900">{orderHistory.summary.totalOrders}</p>
                            </div>
                            <ShoppingBag className="text-blue-600" size={24} />
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-green-600">Delivered Orders</p>
                              <p className="text-2xl font-bold text-green-900">
                                {orderHistory.summary.statusBreakdown?.Delivered?.count || 0}
                              </p>
                            </div>
                            <Package className="text-green-600" size={24} />
                          </div>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-purple-600">Total Value</p>
                              <p className="text-2xl font-bold text-purple-900">
                                {formatCurrency(
                                  Object.values(orderHistory.summary.statusBreakdown || {})
                                    .reduce((sum, status) => sum + (status.totalAmount || 0), 0)
                                )}
                              </p>
                            </div>
                            <DollarSign className="text-purple-600" size={24} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Filters */}
                    <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg sm:flex-row">
                      <div className="flex-1">
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={orderFilters.status}
                          onChange={(e) => setOrderFilters({ ...orderFilters, status: e.target.value, page: 1 })}
                        >
                          <option value="">All Order Status</option>
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Returned">Returned</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={orderFilters.paymentStatus}
                          onChange={(e) => setOrderFilters({ ...orderFilters, paymentStatus: e.target.value, page: 1 })}
                        >
                          <option value="">All Payment Status</option>
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                          <option value="Failed">Failed</option>
                          <option value="Refunded">Refunded</option>
                          <option value="Partially Refunded">Partially Refunded</option>
                        </select>
                      </div>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-4">
                      {orderHistory.loading ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="text-center">
                            <LoadingSpinner className="text-primary mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Loading orders...</p>
                          </div>
                        </div>
                      ) : orderHistory.error ? (
                        <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg">
                          {orderHistory.error}
                        </div>
                      ) : orderHistory.orders.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No orders found</p>
                          <p className="text-sm">This user hasn't placed any orders yet.</p>
                        </div>
                      ) : (
                        orderHistory.orders.map((order) => (
                          <div key={order.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                            {/* Order Header */}
                            <div className="flex flex-col justify-between mb-3 sm:flex-row sm:items-center">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-medium text-gray-900">Order #{order.id}</h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                                  {order.paymentStatus}
                                </span>
                              </div>
                              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 sm:mt-0">
                                <div className="flex items-center space-x-1">
                                  <Calendar size={14} />
                                  <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <DollarSign size={14} />
                                  <span className="font-medium text-gray-900">{formatCurrency(order.total)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Order Items */}
                            {order.orderItems && order.orderItems.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="text-sm font-medium text-gray-700">Items ({order.orderItems.length})</h5>
                                <div className="space-y-2">
                                  {order.orderItems.slice(0, 2).map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                          {item.product?.name || 'Product Unavailable'}
                                        </p>
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                          <span>Qty: {item.quantity}</span>
                                          <span>Price: {formatCurrency(item.price)}</span>
                                          {item.product?.currentPrice && item.product.currentPrice !== item.price && (
                                            <span className={`${item.product.priceChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                              ({item.product.priceChange > 0 ? '+' : ''}{formatCurrency(item.product.priceChange)} current)
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {formatCurrency(item.price * item.quantity)}
                                      </div>
                                    </div>
                                  ))}
                                  {order.orderItems.length > 2 && (
                                    <div className="p-2 text-center text-sm text-gray-500 bg-gray-50 rounded">
                                      +{order.orderItems.length - 2} more items
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Delivery Address */}
                            {order.deliveryAddress && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <h5 className="text-sm font-medium text-gray-700 mb-1">Delivery Address</h5>
                                <div className="text-sm text-gray-600">
                                  <p>{order.deliveryAddress.data?.name}</p>
                                  <p>{order.deliveryAddress.data?.address}</p>
                                  <p>{order.deliveryAddress.data?.city}, {order.deliveryAddress.data?.state} {order.deliveryAddress.data?.pincode}</p>
                                  {order.deliveryAddress.data?.phone && (
                                    <p>Phone: {order.deliveryAddress.data.phone}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}

                      {/* Order Pagination */}
                      {orderHistory.pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                          <div className="text-sm text-gray-700">
                            Showing {((orderHistory.pagination.currentPage - 1) * orderFilters.limit) + 1} to{' '}
                            {Math.min(orderHistory.pagination.currentPage * orderFilters.limit, orderHistory.pagination.totalItems)} of{' '}
                            {orderHistory.pagination.totalItems} orders
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setOrderFilters({ ...orderFilters, page: orderFilters.page - 1 })}
                              disabled={orderFilters.page <= 1}
                              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            <span className="px-3 py-1 text-sm">
                              {orderFilters.page} of {orderHistory.pagination.totalPages}
                            </span>
                            <button
                              onClick={() => setOrderFilters({ ...orderFilters, page: orderFilters.page + 1 })}
                              disabled={orderFilters.page >= orderHistory.pagination.totalPages}
                              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersList;