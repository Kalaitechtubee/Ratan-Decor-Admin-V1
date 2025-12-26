import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Shield,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { getAllStaffUsers, getStaffUserById } from '../../services/Api';

const StaffList = ({ currentUser, onToast }) => {
  const navigate = useNavigate();
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 10;

  // Updated staff roles to include all possible from data: Sales, Support, Admin, Manager, SuperAdmin
  const staffRoles = [
    { value: 'Sales', label: 'Sales' },
    { value: 'Support', label: 'Support' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Manager', label: 'Manager' },
    { value: 'SuperAdmin', label: 'SuperAdmin' }
  ];

  // Status options
  const statusOptions = [
    { value: 'Pending', label: 'Pending', color: 'yellow' },
    { value: 'Approved', label: 'Approved', color: 'green' },
    { value: 'Rejected', label: 'Rejected', color: 'red' }
  ];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    fetchStaffUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const fetchStaffUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllStaffUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        role: roleFilter,
        status: statusFilter
      });

      console.log('API Response:', response); // Debug log

      if (response.success) {
        setStaffUsers(response.staffUsers || []); // Use staffUsers from response
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalItems(response.pagination?.totalItems || 0);
      } else {
        if (onToast) {
          onToast('Failed to fetch staff users', 'error');
        }
        setStaffUsers([]);
      }
    } catch (error) {
      console.error('Error fetching staff users:', error);
      if (onToast) {
        onToast(error.message || 'Failed to fetch staff users', 'error');
      }
      setStaffUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const response = await getStaffUserById(userId);
      console.log('User Details Response:', response); // Debug log
      if (response.success) {
        setSelectedUser(response.data || response.user || null); // Handle both possible keys
        setShowUserModal(true);
      } else {
        if (onToast) {
          onToast('Failed to fetch user details', 'error');
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      if (onToast) {
        onToast(error.message || 'Failed to fetch user details', 'error');
      }
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Debug log for staffUsers
  useEffect(() => {
    console.log('Staff Users Updated:', staffUsers);
  }, [staffUsers]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="mr-3 text-primary" size={28} />
                Staff Management
              </h1>
              <p className="mt-1 text-gray-600">View and manage all staff users</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Filter className="mr-2" size={16} />
                Filters
              </button>
              <button
                onClick={() => navigate("/staff-registration")}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <UserPlus className="mr-2" size={16} />
                Create Staff
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  {staffRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Staff Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading staff users...</span>
            </div>
          ) : staffUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Staff Users Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || roleFilter || statusFilter
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by creating your first staff user.'}
              </p>
              <button
                onClick={() => navigate("/staff-registration")}
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <UserPlus className="mr-2" size={16} />
                Create Staff User
              </button>
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
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staffUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {user.name.charAt(0).toUpperCase()}
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
                            <span className="text-sm text-gray-900">{user.role}</span>
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
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewUser(user.id)}
                            className="text-primary hover:text-primary-700 p-1 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                        <span className="font-medium">{totalItems}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                          const page = Math.max(1, Math.min(totalPages - 2, currentPage - 1)) + i;
                          return (
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
                          );
                        })}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
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
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Staff User Details</h2>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Avatar */}
                  <div className="flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-2xl font-medium text-white">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h3>
                    <div className="flex items-center justify-center mt-2">
                      <Shield className="text-primary mr-2" size={16} />
                      <span className="text-sm text-gray-600">{selectedUser.role}</span>
                    </div>
                    <div className="flex items-center justify-center mt-1">
                      {getStatusIcon(selectedUser.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedUser.status)}`}>
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center">
                      <Mail className="text-gray-400 mr-3" size={16} />
                      <span className="text-sm text-gray-900">{selectedUser.email}</span>
                    </div>
                    {selectedUser.mobile && (
                      <div className="flex items-center">
                        <Phone className="text-gray-400 mr-3" size={16} />
                        <span className="text-sm text-gray-900">{selectedUser.mobile}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="text-gray-400 mr-3" size={16} />
                      <span className="text-sm text-gray-600">
                        Created: {formatDate(selectedUser.createdAt)}
                      </span>
                    </div>
                    {selectedUser.updatedAt && (
                      <div className="flex items-center">
                        <Calendar className="text-gray-400 mr-3" size={16} />
                        <span className="text-sm text-gray-600">
                          Updated: {formatDate(selectedUser.updatedAt)}
                        </span>
                      </div>
                    )}
                    {selectedUser.company && (
                      <div className="flex items-center">
                        <Users className="text-gray-400 mr-3" size={16} />
                        <span className="text-sm text-gray-900">{selectedUser.company}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffList;