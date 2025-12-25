import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Filter, Search, Eye, Edit, Calendar, X, RefreshCw, Package } from 'lucide-react';
import Table from '../Common/Table';
import StatusBadge from '../Common/StatusBadge';
import Modal from '../Common/Modal';
import OrderDetails from './OrderDetails';
import OrderEdit from './OrderEdit';
import adminOrderApi from './adminOrderApi';
import { debounce } from 'lodash';
import { getUser } from '../../utils/tokenHandler';

const OrdersList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState(null); // 'details' or 'edit'
  const [showFilters, setShowFilters] = useState(true); // Show filters by default

  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    paymentStatus: searchParams.get('paymentStatus') || '',
    customer: searchParams.get('customer') || '',
    orderId: searchParams.get('orderId') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: parseInt(searchParams.get('limit')) || 10,
  });

  const [loading, setLoading] = useState({
    fetch: false,
    export: false,
  });
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
  });
  const [userRole, setUserRole] = useState(null);

  // Get user role from stored user data (tokens are now in httpOnly cookies)
  useEffect(() => {
    const user = getUser();
    if (user && user.role) {
      setUserRole(user.role);
    } else {
      setError('No user data found. Please log in.');
    }
  }, []);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value !== 1 && value !== 10) {
        params.set(key, value.toString());
      }
    });
    // Only update if different to prevent loops
    const newSearch = params.toString();
    const currentSearch = searchParams.toString();
    if (newSearch !== currentSearch) {
      setSearchParams(params, { replace: true });
    }
  }, [filters, setSearchParams, searchParams]);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    setLoading(prev => ({ ...prev, fetch: true }));
    setError(null);
    try {
      const response = await adminOrderApi.getOrders({
        status: filters.status,
        paymentStatus: filters.paymentStatus,
        customer: filters.customer,
        orderId: filters.orderId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        page: filters.page,
        limit: filters.limit,
      });
      setOrders(response.orders || []);
      setPagination({
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 1,
        currentPage: response.pagination?.page || 1,
      });

      // Use stats from backend (global stats, not just current page)
      const summary = response.orderSummary || {};
      const statusBreakdown = summary.statusBreakdown || {};

      setStats({
        total: summary.totalOrders || 0,
        pending: statusBreakdown['Pending']?.count || 0,
        processing: statusBreakdown['Processing']?.count || 0,
        completed: statusBreakdown['Completed']?.count || 0,
        cancelled: statusBreakdown['Cancelled']?.count || 0,
      });
    } catch (err) {
      console.error('Fetch Orders Error:', err);
      setError(err.message || 'Failed to fetch orders. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, fetch: false }));
    }
  }, [filters]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((field, value) => {
      setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
    }, 500),
    []
  );

  // Fetch orders when filters change
  const hasFetchedRef = useRef(false);
  const prevFiltersRef = useRef(JSON.stringify(filters));

  useEffect(() => {
    const currentFiltersString = JSON.stringify(filters);
    if (!hasFetchedRef.current || prevFiltersRef.current !== currentFiltersString) {
      hasFetchedRef.current = true;
      prevFiltersRef.current = currentFiltersString;
      fetchOrders();
    }
  }, [filters, fetchOrders]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle export to CSV
  const handleExport = async () => {
    setLoading(prev => ({ ...prev, export: true }));
    setError(null);
    try {
      const response = await adminOrderApi.getOrders({
        status: filters.status,
        paymentStatus: filters.paymentStatus,
        page: 1,
        limit: 1000, // Fetch more for export
      });
      const csvContent = [
        ['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Payment Status', 'Order Date'],
        ...response.orders.map(order => [
          `ORD-${order.id.toString().padStart(3, '0')}`,
          order.user?.name || 'Unknown',
          order.orderItems?.length || 0,
          `₹${Number(order.total).toLocaleString('en-IN')}`,
          order.status,
          order.paymentStatus,
          new Date(order.orderDate).toLocaleDateString('en-IN'),
        ]),
      ].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to export orders');
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };

  // Handle order actions from child components
  const handleOrderUpdate = async (orderId, updateData) => {
    await fetchOrders();
    setSelectedOrder(null);
    setModalType(null);
  };

  const handleModalClose = () => {
    setSelectedOrder(null);
    setModalType(null);
  };

  // Handle Edit button click
  const handleEditClick = (e, order) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setModalType('edit');
  };

  // Handle View button click
  const handleViewClick = (e, order) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setModalType('details');
  };

  const columns = [
    {
      key: 'id',
      header: 'Order ID',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary">ORD-{value.toString().padStart(3, '0')}</span>
      ),
    },
    {
      key: 'user',
      header: 'Customer',
      sortable: true,
      render: (value, item) => (
        <div>
          <div className="font-medium text-gray-900 font-roboto">{value?.name || 'Unknown'}</div>
          <div className="text-sm text-gray-500">ID: CUST-{item.userId?.toString().padStart(3, '0') || 'N/A'}</div>
          {value?.city && value?.state && (
            <div className="text-xs text-gray-400">{value.city}, {value.state}</div>
          )}
        </div>
      ),
    },
    {
      key: 'orderItems',
      header: 'Items',
      render: (value) => (
        <div className="text-sm">
          {value.length} item{value.length !== 1 ? 's' : ''}
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (value) => `₹${Number(value).toLocaleString('en-IN')}`,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} type="order" />,
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      sortable: true,
      render: (value) => <StatusBadge status={value} type="payment" />,
    },
    {
      key: 'orderDate',
      header: 'Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value, item) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => handleViewClick(e, item)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={(e) => handleEditClick(e, item)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Edit Order"
          >
            <Edit size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-roboto animate-fade-in-left p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Orders Management</h1>
          <p className="text-gray-600">Manage and track all customer orders</p>
        </div>
        <div className="flex space-x-3">
          {['Admin', 'Manager'].includes(userRole) && (
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 space-x-2 text-white rounded-lg transition-colors bg-primary hover:bg-red-600 disabled:bg-gray-400"
              disabled={loading.export}
            >
              <Download size={16} />
              <span>{loading.export ? 'Exporting...' : 'Export'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={fetchOrders}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div
          className={`p-4 bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${filters.status === '' ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
          onClick={() => setFilters({ ...filters, status: '', page: 1 })}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              <p className="text-xs text-gray-500">Total Orders</p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${filters.status === 'Pending' ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-transparent'}`}
          onClick={() => setFilters({ ...filters, status: 'Pending', page: 1 })}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${filters.status === 'Processing' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent'}`}
          onClick={() => setFilters({ ...filters, status: 'Processing', page: 1 })}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
              <p className="text-xs text-gray-500">Processing</p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${filters.status === 'Completed' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-transparent'}`}
          onClick={() => setFilters({ ...filters, status: 'Completed', page: 1 })}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${filters.status === 'Cancelled' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-transparent'}`}
          onClick={() => setFilters({ ...filters, status: 'Cancelled', page: 1 })}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-xs text-gray-500">Cancelled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 sm:p-6 bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
            <Filter size={18} />
            Filters
          </h3>
          <div className="flex items-center gap-3">
            {(filters.status || filters.paymentStatus || filters.customer || filters.orderId || filters.startDate || filters.endDate) && (
              <button
                onClick={() => setFilters({
                  status: '',
                  paymentStatus: '',
                  customer: '',
                  orderId: '',
                  startDate: '',
                  endDate: '',
                  page: 1,
                  limit: filters.limit,
                })}
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
          <div className="space-y-4">
            {/* Row 1: Status, Payment, Items per page */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Order Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Payment Status</label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value, page: 1 })}
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Payment Status</option>
                  <option value="Awaiting">Awaiting</option>
                  <option value="Received">Received</option>
                  <option value="Not Received">Not Received</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Items per page</label>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Order ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.orderId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters({ ...filters, orderId: value });
                      debouncedSearch('orderId', value);
                    }}
                    placeholder="Search order ID..."
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent pl-10"
                  />
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Row 2: Customer, Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Customer</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.customer}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters({ ...filters, customer: value });
                      debouncedSearch('customer', value);
                    }}
                    placeholder="Search customer name..."
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent pl-10"
                  />
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent pl-10"
                  />
                  <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent pl-10"
                  />
                  <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Active Filters Chips */}
            {(filters.status || filters.paymentStatus || filters.customer || filters.orderId || filters.startDate || filters.endDate) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-500">Active filters:</span>
                {filters.status && (
                  <div className="flex items-center px-3 py-1 bg-yellow-50 rounded-full border border-yellow-200">
                    <span className="text-yellow-700 text-xs font-medium">Status: {filters.status}</span>
                    <button onClick={() => setFilters({ ...filters, status: '', page: 1 })} className="ml-2 text-yellow-400 hover:text-yellow-600">
                      <X size={12} />
                    </button>
                  </div>
                )}
                {filters.paymentStatus && (
                  <div className="flex items-center px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
                    <span className="text-blue-700 text-xs font-medium">Payment: {filters.paymentStatus}</span>
                    <button onClick={() => setFilters({ ...filters, paymentStatus: '', page: 1 })} className="ml-2 text-blue-400 hover:text-blue-600">
                      <X size={12} />
                    </button>
                  </div>
                )}
                {filters.customer && (
                  <div className="flex items-center px-3 py-1 bg-purple-50 rounded-full border border-purple-200">
                    <span className="text-purple-700 text-xs font-medium">Customer: {filters.customer}</span>
                    <button onClick={() => setFilters({ ...filters, customer: '', page: 1 })} className="ml-2 text-purple-400 hover:text-purple-600">
                      <X size={12} />
                    </button>
                  </div>
                )}
                {filters.orderId && (
                  <div className="flex items-center px-3 py-1 bg-green-50 rounded-full border border-green-200">
                    <span className="text-green-700 text-xs font-medium">Order: {filters.orderId}</span>
                    <button onClick={() => setFilters({ ...filters, orderId: '', page: 1 })} className="ml-2 text-green-400 hover:text-green-600">
                      <X size={12} />
                    </button>
                  </div>
                )}
                {(filters.startDate || filters.endDate) && (
                  <div className="flex items-center px-3 py-1 bg-orange-50 rounded-full border border-orange-200">
                    <span className="text-orange-700 text-xs font-medium">
                      Date: {filters.startDate || '...'} to {filters.endDate || '...'}
                    </span>
                    <button onClick={() => setFilters({ ...filters, startDate: '', endDate: '', page: 1 })} className="ml-2 text-orange-400 hover:text-orange-600">
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Orders Table */}
      <Table
        data={orders}
        columns={columns}
        onRowClick={(order) => {
          setSelectedOrder(order);
          setModalType('details');
        }}
        loading={loading.fetch}
        pagination={{
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          itemsPerPage: filters.limit,
          onPageChange: handlePageChange,
        }}
      />

      {/* Order Details Modal */}
      {selectedOrder && modalType === 'details' && (
        <Modal
          isOpen={true}
          onClose={handleModalClose}
          title={`Order Details - ORD-${selectedOrder.id.toString().padStart(3, '0')}`}
          size="lg"
        >
          <OrderDetails
            order={selectedOrder}
            onUpdate={handleOrderUpdate}
            onClose={handleModalClose}
          />
        </Modal>
      )}

      {/* Order Edit Modal */}
      {selectedOrder && modalType === 'edit' && (
        <Modal
          isOpen={true}
          onClose={handleModalClose}
          title={`Edit Order - ORD-${selectedOrder.id.toString().padStart(3, '0')}`}
          size="lg"
        >
          <OrderEdit
            order={selectedOrder}
            userRole={userRole}
            onUpdate={handleOrderUpdate}
            onClose={handleModalClose}
          />
        </Modal>
      )}
    </div>
  );
};

export default OrdersList;