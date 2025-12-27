import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  X,
  MapPin,
  Globe,
  Plus
} from 'lucide-react';
import {
  getAllUsers,
  getUserById,
  approveUser,
  getPendingUsers,
  updateUser,
  deleteUser,
  getUserOrderHistory,
  getUserTypes
} from '../../services/Api';

// Allowed role/status options shown in filters and edit forms
const roleOptions = [
  { value: 'customer', label: 'Customer' },
  { value: 'architect', label: 'Architect' },
  { value: 'dealer', label: 'Dealer' },
  { value: 'Admin', label: 'Admin' },
  { value: 'SuperAdmin', label: 'SuperAdmin' },
  { value: 'staff', label: 'Staff' }
];

const STAFF_ROLES = ['Admin', 'SuperAdmin', 'staff', 'Manager'];

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
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state
  const [filters, setFilters] = useState({
    role: searchParams.get('role') || '',
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
    userTypeName: searchParams.get('userTypeName') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    state: searchParams.get('state') || '',
    city: searchParams.get('city') || '',
    pincode: searchParams.get('pincode') || '',
  });

  const [userTypes, setUserTypes] = useState([]);
  const hasFetchedUserTypesRef = useRef(false);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    statusBreakdown: {},
    roleBreakdown: {},
  });

  // Sync filters and pagination to URL
  useEffect(() => {
    const params = {};
    if (pagination.currentPage > 1) params.page = pagination.currentPage;
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    setSearchParams(params, { replace: true });
  }, [filters, pagination.currentPage, setSearchParams]);

  // Handle URL changes
  useEffect(() => {
    const search = searchParams.get('search') || '';
    setSearchTerm(search);
    setFilters({
      search,
      role: searchParams.get('role') || '',
      status: searchParams.get('status') || '',
      userTypeName: searchParams.get('userTypeName') || '',
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      state: searchParams.get('state') || '',
      city: searchParams.get('city') || '',
      pincode: searchParams.get('pincode') || '',
    });
    const page = parseInt(searchParams.get('page')) || 1;
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, [searchParams]);

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
          ...(currentFilters.startDate ? { startDate: currentFilters.startDate } : {}),
          ...(currentFilters.endDate ? { endDate: currentFilters.endDate } : {}),
          ...(currentFilters.state ? { state: currentFilters.state } : {}),
          ...(currentFilters.city ? { city: currentFilters.city } : {}),
          ...(currentFilters.pincode ? { pincode: currentFilters.pincode } : {}),
        };

        const response = currentShowPendingOnly
          ? await getPendingUsers(queryParams)
          : await getAllUsers(queryParams);

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch users');
        }

        setUsers(response.users || []);
        setSummary(response.summary || { totalUsers: 0, statusBreakdown: {}, roleBreakdown: {} });
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

  const handleSearch = (value, isButtonClick = false) => {
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (isButtonClick) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      setFilters(prev => ({ ...prev, search: value.trim() }));
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      setFilters(prev => ({ ...prev, search: value.trim() }));
    }, 1000);
  };

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
      startDate: '',
      endDate: '',
      state: '',
      city: '',
      pincode: '',
    });
  }, []);

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  // Load user order history
  const loadUserOrderHistory = useCallback(async (userId) => {
    if (!userId) return;

    try {
      setOrderHistory(prev => ({ ...prev, loading: true, error: null }));

      const response = await getUserOrderHistory(userId, {
        status: orderFilters.status,
        paymentStatus: orderFilters.paymentStatus,
        page: orderFilters.page,
        limit: orderFilters.limit,
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
  }, [orderFilters]);

  useEffect(() => {
    if (!hasFetchedUserTypesRef.current) {
      hasFetchedUserTypesRef.current = true;
      const fetchUserTypes = async () => {
        try {
          const response = await getUserTypes();
          // Support both response formats for compatibility
          const types = response.userTypes || response.data || [];
          setUserTypes(types);
        } catch (error) {
          console.error('Error fetching user types:', error);
        }
      };
      fetchUserTypes();
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
  }, [showOrderHistory, selectedUser?.id, loadUserOrderHistory]);

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
      toast.error(err.message || 'Failed to load user details');
      setSelectedUser(user);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (user) => {
    try {
      setLoading(true);
      const response = await getUserById(user.id);
      if (!response.success) throw new Error(response.message);

      const u = response.user;
      setSelectedUser(u);
      setEditForm({
        name: u.name || '',
        email: u.email || '',
        role: u.role || '',
        status: u.status || '',
        company: u.company || '',
        userTypeId: u.userTypeId || ''
      });
      setIsEditing(true);
    } catch (err) {
      console.error('Error loading user for edit:', err);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
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
      toast.error(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm('Are you sure you want to delete this user? This action cannot be undone.');
    if (!confirmed) return;
    try {
      setLoading(true);
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
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId, status, reason = '') => {
    try {
      setLoading(true);
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
      toast.error(err.message || `Failed to ${status.toLowerCase()} user`);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR'
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

  const handlePageChange = (page) => {
    setPagination({ ...pagination, currentPage: page });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 font-roboto">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Users Management</h1>
          <p className="text-gray-600">View and manage all registered platform users</p>
        </div>
        <div className="flex space-x-3">
          <button
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="mr-2" size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Users', icon: Users, color: 'blue', value: summary.totalUsers || 0, status: '' },
          { label: 'Pending', icon: Clock, color: 'yellow', value: summary.statusBreakdown?.['Pending'] || 0, status: 'Pending' },
          { label: 'Customers', icon: ShoppingBag, color: 'green', value: summary.roleBreakdown?.['customer'] || 0, role: 'customer' },
          { label: 'Dealers', icon: Package, color: 'red', value: summary.roleBreakdown?.['Dealer'] || 0, role: 'Dealer' },
          { label: 'Architects', icon: TrendingUp, color: 'purple', value: summary.roleBreakdown?.['Architect'] || 0, role: 'Architect' },
        ].map((stat) => {
          const Icon = stat.icon;
          const isActive = (stat.status && filters.status === stat.status) || (stat.role && filters.role === stat.role);
          const colors = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500', ring: 'ring-blue-500/20' },
            yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-500', ring: 'ring-yellow-500/20' },
            green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-500', ring: 'ring-green-500/20' },
            red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-500', ring: 'ring-red-500/20' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500', ring: 'ring-purple-500/20' },
            indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-500', ring: 'ring-indigo-500/20' },
          };
          const c = colors[stat.color] || colors.blue;

          return (
            <div
              key={stat.label}
              className={`p-4 bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${isActive ? `${c.border} ring-2 ${c.ring}` : 'border-transparent'}`}
              onClick={() => {
                if (stat.status) handleFilterChange('status', stat.status);
                else if (stat.role) handleFilterChange('role', stat.role);
                else clearFilters();
              }}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 ${c.bg} rounded-lg`}>
                  <Icon className={`w-5 h-5 ${c.text}`} size={18} />
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

      {/* Filters Section */}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm, true)}
                    className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
                <button
                  onClick={() => handleSearch(searchTerm, true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors shadow-sm font-medium"
                >
                  Search
                </button>
              </div>
              <select
                className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all bg-white"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                {validStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all bg-white"
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <option value="">All Roles</option>
                {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <select
                className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all bg-white"
                value={filters.userTypeName}
                onChange={(e) => handleFilterChange('userTypeName', e.target.value)}
              >
                <option value="">All User Types</option>
                {userTypes.map(type => (
                  <option key={type.id} value={type.name}>{type.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="State"
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all text-sm"
              />
              <input
                type="text"
                placeholder="City"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all text-sm"
              />
              <input
                type="text"
                placeholder="Pincode"
                value={filters.pincode}
                onChange={(e) => handleFilterChange('pincode', e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all text-sm"
              />
              <div className="relative">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all text-sm h-[42px]"
                />
                <Calendar className="absolute left-3 top-[13px] text-gray-400" size={16} />
                <span className="absolute -top-2.5 left-2 px-1 bg-white text-[10px] text-gray-500 font-bold z-10">FROM DATE</span>
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all text-sm h-[42px]"
                />
                <Calendar className="absolute left-3 top-[13px] text-gray-400" size={16} />
                <span className="absolute -top-2.5 left-2 px-1 bg-white text-[10px] text-gray-500 font-bold z-10">TO DATE</span>
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
              return (
                <div key={key} className="flex items-center px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="ml-1">{value}</span>
                  <button onClick={() => handleFilterChange(key, '')} className="ml-2 hover:opacity-70 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
        {loading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner className="text-primary mb-4" />
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No Users Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Adjust your filters to find what you're looking for.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <LoadingSpinner className="text-primary" />
              </div>
            )}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleViewUserDetails(user)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${STAFF_ROLES.includes(user.role) ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.company || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                        {user.userType?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => handleViewUserDetails(user)} className="text-blue-600 hover:text-blue-900"><Eye size={18} /></button>
                        <button onClick={() => handleEditUser(user)} className="text-gray-600 hover:text-gray-900"><Pencil size={18} /></button>
                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span> to <span className="font-medium">{Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)}</span> of <span className="font-medium">{pagination.totalItems}</span> results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === pagination.totalPages || (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 border rounded-md text-sm font-medium ${page === pagination.currentPage ? 'bg-primary text-white border-primary' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                          {page}
                        </button>
                      );
                    }
                    if (page === pagination.currentPage - 2 || page === pagination.currentPage + 2) return <span key={page}>...</span>;
                    return null;
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && !isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                  {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleEditUser(selectedUser)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-full hover:bg-gray-100 transition-all text-sm font-semibold border border-gray-200"
                >
                  <Pencil size={14} className="text-gray-500" />
                  Edit
                </button>
                <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 p-2 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Modal Tabs */}
              <div className="flex gap-6 border-b border-gray-100 mb-6">
                <button
                  onClick={() => setShowOrderHistory(false)}
                  className={`pb-3 text-sm font-medium transition-colors border-b-2 ${!showOrderHistory ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  User Information
                </button>
                <button
                  onClick={() => setShowOrderHistory(true)}
                  className={`pb-3 text-sm font-medium transition-colors border-b-2 ${showOrderHistory ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Order History
                </button>
              </div>

              {!showOrderHistory ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="mb-3 text-lg font-medium text-gray-900">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Phone:</span> {selectedUser.mobile || '-'}
                      </p>
                      <p>
                        <span className="font-medium">Company:</span> {selectedUser.company || '-'}
                      </p>
                      <p>
                        <span className="font-medium">Role:</span> {selectedUser.role}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="mb-3 text-lg font-medium text-gray-900">Account Status</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Status:</span>
                        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(selectedUser.status)}`}>
                          {selectedUser.status}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium">Registered:</span> {formatDate(selectedUser.createdAt)}
                      </p>
                      {selectedUser.rejectionReason && (
                        <p>
                          <span className="font-medium">Reason:</span> {selectedUser.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="mb-3 text-lg font-medium text-gray-900">Location Details</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">City:</span> {selectedUser.city || '-'}
                      </p>
                      <p>
                        <span className="font-medium">State:</span> {selectedUser.state || '-'}
                      </p>
                      <p>
                        <span className="font-medium">Pincode:</span> {selectedUser.pincode || '-'}
                      </p>
                      <p>
                        <span className="font-medium">Country:</span> {selectedUser.country || '-'}
                      </p>
                    </div>
                  </div>
                  {selectedUser.status === 'Pending' && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h3 className="mb-3 text-lg font-medium text-gray-900">Pending Review</h3>
                      <p className="text-sm text-gray-700 mb-4">This account requires administrative review.</p>
                      <div className="flex gap-3">
                        <button onClick={() => handleApproveUser(selectedUser.id, 'Approved')} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">Approve</button>
                        <button onClick={() => handleRejectWithReason(selectedUser.id)} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">Reject</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {orderHistory.summary && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-600 uppercase font-bold mb-1">Total Orders</p>
                        <p className="text-2xl font-bold text-blue-900">{orderHistory.summary.totalOrders}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-xs text-green-600 uppercase font-bold mb-1">Delivered</p>
                        <p className="text-2xl font-bold text-green-900">{orderHistory.summary.statusBreakdown?.delivered?.count || 0}</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <p className="text-xs text-purple-600 uppercase font-bold mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-purple-900">{formatCurrency(orderHistory.summary.totalSpent || 0)}</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {orderHistory.loading ? <LoadingSpinner className="mx-auto" /> : orderHistory.orders.length === 0 ? <p className="text-center py-10 text-gray-400">No orders found for this user.</p> : (
                      orderHistory.orders.map(order => (
                        <div key={order.id} className="p-4 border border-gray-100 rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <ShoppingBag className="text-gray-400" size={20} />
                            <div>
                              <p className="font-bold text-gray-900">Order #{order.id}</p>
                              <p className="text-xs text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{formatCurrency(order.total)}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${getOrderStatusColor(order.status)}`}>{order.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 focus:outline-none"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Role</label>
                  <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none">
                    {roleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none">
                    {validStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Company</label>
                <input type="text" value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">User Type</label>
                <select
                  value={editForm.userTypeId}
                  onChange={(e) => setEditForm({ ...editForm, userTypeId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
                >
                  <option value="">Select User Type</option>
                  {userTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-all border border-gray-200">Cancel</button>
              <button onClick={handleSaveEdit} disabled={loading} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md hover:shadow-lg active:scale-95">{loading ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;