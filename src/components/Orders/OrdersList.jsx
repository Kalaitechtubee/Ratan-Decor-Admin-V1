import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Download, Filter, Search, Eye, Edit } from 'lucide-react';
import Table from '../Common/Table';
import StatusBadge from '../Common/StatusBadge';
import Modal from '../Common/Modal';
import OrderDetails from './OrderDetails';
import OrderEdit from './OrderEdit';
import adminOrderApi from './adminOrderApi';
import { debounce } from 'lodash';
import { getUser } from '../../utils/tokenHandler';


const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState(null); // 'details' or 'edit'
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    customer: '',
    page: 1,
    limit: 10,
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

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    setLoading(prev => ({ ...prev, fetch: true }));
    setError(null);
    try {
      const response = await adminOrderApi.getOrders({
        status: filters.status,
        paymentStatus: filters.paymentStatus,
        customer: filters.customer,
        page: filters.page,
        limit: filters.limit,
      });
      setOrders(response.orders || []);
      setPagination({
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
        currentPage: response.pagination.page,
      });
    } catch (err) {
      console.error('Fetch Orders Error:', err);
      setError(err.message || 'Failed to fetch orders. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, fetch: false }));
    }
  }, [filters.status, filters.paymentStatus, filters.customer, filters.page, filters.limit]);

  // Debounced customer search
  const debouncedCustomerSearch = useCallback(
    debounce((value) => {
      setFilters(prev => ({ ...prev, customer: value, page: 1 }));
    }, 500),
    []
  );

  // Fetch orders when filters change
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchOrders();
    }
  }, [fetchOrders]);

  // Reset fetch flag when filters change (for subsequent fetches)
  useEffect(() => {
    if (filters.status || filters.paymentStatus || filters.customer || filters.page > 1) {
      hasFetchedRef.current = false;
    }
  }, [filters.status, filters.paymentStatus, filters.customer, filters.page]);

  // Handle customer search input
  const handleCustomerSearch = (value) => {
    debouncedCustomerSearch(value);
  };

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
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(item);
              setModalType('details');
            }}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {['Admin', 'Manager'].includes(userRole) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOrder(item);
                setModalType('edit');
              }}
              className="p-1 text-green-600 hover:text-green-800 transition-colors"
              title="Edit Order"
            >
              <Edit size={16} />
            </button>
          )}
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

      {/* Filters */}
      <div className="p-4 sm:p-6 bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-primary">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-gray-600 transition-colors hover:text-primary"
          >
            <Filter size={16} />
            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Status</label>
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
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Customer</label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.customer}
                  onChange={(e) => {
                    setFilters({ ...filters, customer: e.target.value });
                    handleCustomerSearch(e.target.value);
                  }}
                  placeholder="Search customer..."
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent pl-10"
                />
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
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