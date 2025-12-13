// src/components/Contact/ContactsList.jsx (updated: aligned permission check and error message)
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Mail, Phone, MapPin, Calendar, MessageSquare, ArrowLeft, User } from 'lucide-react';
import { getAllContacts, getContactById } from '../../services/Api';
import { moduleAccess } from '../../utils/roleAccess'; // Import for consistent role check

const ContactsList = ({ currentUser, onToast }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    totalItems: 0,
  });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Check if user has permission (Fixed: Use requireContactsAccess to match table/backend)
  const hasPermission = moduleAccess.requireContactsAccess(currentUser);

  const lastFetchedParams = useRef({ page: 0, search: '', sortBy: '', sortOrder: '' });
  const isFetchingRef = useRef(false);

  // Fetch all contacts
  const fetchContacts = async () => {
    if (!hasPermission || isFetchingRef.current) return;

    const currentParams = {
      page: pagination.currentPage,
      search,
      sortBy,
      sortOrder,
    };

    if (JSON.stringify(currentParams) === JSON.stringify(lastFetchedParams.current)) {
      return;
    }

    isFetchingRef.current = true;
    lastFetchedParams.current = currentParams;

    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllContacts({
        page: pagination.currentPage,
        limit: pagination.limit,
        search,
        sortBy,
        sortOrder,
      });
      setContacts(response.contacts || []);
      setPagination({
        currentPage: response.pagination?.currentPage || 1,
        totalPages: response.pagination?.totalPages || 1,
        totalItems: response.pagination?.totalItems || response.contacts?.length || 0,
        limit: response.pagination?.limit || 10,
      });
    } catch (err) {
      // Handle specific auth errors
      if (err.message?.includes('token') || err.status === 401) {
        setError('Access denied. No valid token provided.');
        onToast('Session expired. Please login again.', 'error');
        // Redirect to login if token invalid
        localStorage.removeItem('token'); // Clear invalid token
        navigate('/login');
        return;
      }
      setError(err.message);
      onToast(err.message, 'error');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Fetch single contact by ID
  const fetchContactById = async (contactId) => {
    if (!hasPermission) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await getContactById(contactId);
      setSelectedContact(response.contact);
    } catch (err) {
      // Handle specific auth errors
      if (err.message?.includes('token') || err.status === 401) {
        setError('Access denied. No valid token provided.');
        onToast('Session expired. Please login again.', 'error');
        localStorage.removeItem('token'); // Clear invalid token
        navigate('/login');
        return;
      }
      setError(err.message);
      onToast(err.message, 'error');
      navigate('/contacts');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  // Handle search
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // List view fetch
  useEffect(() => {
    if (id) return;
    if (!hasPermission) {
      onToast('Access Denied: SuperAdmin, Admin, Support, or Sales role required', 'error');
      navigate('/dashboard');
      return;
    }
    fetchContacts();
  }, [pagination.currentPage, search, sortBy, sortOrder, hasPermission]);

  // Fetch for detail view
  useEffect(() => {
    if (!id) return;
    if (!hasPermission) {
      onToast('Access Denied: SuperAdmin, Admin, Support, or Sales role required', 'error');
      navigate('/dashboard');
      return;
    }
    fetchContactById(id);
  }, [id]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#ff4747] border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-600">Loading contacts...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-red-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#ff4747]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-red-600 mb-6 text-lg font-medium">{error}</p>
          <button
            onClick={() => navigate('/contacts')}
            className="px-6 py-3 bg-gradient-to-r from-[#ff4747] to-[#ff6b6b] text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
          >
            Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  // Render single contact details
  if (selectedContact) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-[#ff4747] to-[#ff6b6b] p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center">
                    <User className="text-white" size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Contact Details</h2>
                    <p className="text-white text-opacity-90 text-sm mt-1">View full contact information</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/contacts')}
                  className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl hover:bg-opacity-30 transition-all duration-200"
                >
                  <ArrowLeft size={18} />
                  <span>Back to List</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Name */}
                <div className="group">
                  <div className="flex items-start space-x-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      <User className="text-blue-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Full Name</p>
                      <p className="text-gray-900 font-semibold text-lg">{selectedContact.name}</p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="group">
                  <div className="flex items-start space-x-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                      <Mail className="text-green-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email Address</p>
                      <p className="text-gray-900 font-medium truncate">{selectedContact.email}</p>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="group">
                  <div className="flex items-start space-x-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 transition-colors">
                      <Phone className="text-purple-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Phone Number</p>
                      <p className="text-gray-900 font-medium">{selectedContact.phoneNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="group">
                  <div className="flex items-start space-x-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
                      <MapPin className="text-amber-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Location</p>
                      <p className="text-gray-900 font-medium">{selectedContact.location}</p>
                    </div>
                  </div>
                </div>

                {/* Submitted Date */}
                <div className="group md:col-span-2">
                  <div className="flex items-start space-x-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                      <Calendar className="text-[#ff4747]" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Submitted On</p>
                      <p className="text-gray-900 font-medium">
                        {new Date(selectedContact.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="group">
                <div className="p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <MessageSquare className="text-[#ff4747]" size={20} />
                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Message</p>
                  </div>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {selectedContact.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render contacts list
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#ff4747] to-[#ff6b6b] p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center">
                <Mail className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Contact Submissions</h2>
                <p className="text-white text-opacity-90 text-sm mt-1">
                  {pagination.totalItems} total contact{pagination.totalItems !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search by name, email, phone, or location..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4747] focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                />
              </div>
            </div>

            {/* Contacts Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { field: 'name', label: 'Name' },
                      { field: 'email', label: 'Email' },
                      { field: 'phoneNumber', label: 'Phone' },
                      { field: 'location', label: 'Location' },
                      { field: 'message', label: 'Message' },
                      { field: 'createdAt', label: 'Submitted' }
                    ].map(({ field, label }) => (
                      <th
                        key={field}
                        onClick={() => handleSort(field)}
                        className="group px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-1">
                          <span>{label}</span>
                          <ArrowUpDown 
                            size={14} 
                            className={`transition-colors ${
                              sortBy === field ? 'text-[#ff4747]' : 'text-gray-400 group-hover:text-gray-600'
                            }`}
                          />
                          {sortBy === field && (
                            <span className="text-[#ff4747] font-bold">
                              {sortOrder === 'ASC' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {contacts.length > 0 ? (
                    contacts.map((contact, index) => (
                      <tr
                        key={contact.id}
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                        className="hover:bg-red-50 cursor-pointer transition-colors group"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4747] to-[#ff6b6b] flex items-center justify-center text-white text-sm font-semibold mr-3">
                              {contact.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900 group-hover:text-[#ff4747] transition-colors">
                              {contact.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {contact.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {contact.phoneNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {contact.location}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                          <div className="truncate">
                            {contact.message.length > 50
                              ? `${contact.message.substring(0, 50)}...`
                              : contact.message}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(contact.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Mail className="text-gray-400" size={32} />
                          </div>
                          <p className="text-gray-500 font-medium">No contacts found</p>
                          <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600 font-medium">
                  Showing <span className="text-[#ff4747] font-semibold">{contacts.length}</span> of{' '}
                  <span className="text-[#ff4747] font-semibold">{pagination.totalItems}</span> contacts
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="flex items-center space-x-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors font-medium"
                  >
                    <ChevronLeft size={18} />
                    <span>Previous</span>
                  </button>
                  <div className="px-4 py-2 bg-gradient-to-r from-[#ff4747] to-[#ff6b6b] text-white rounded-lg font-semibold">
                    {pagination.currentPage} / {pagination.totalPages}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="flex items-center space-x-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors font-medium"
                  >
                    <span>Next</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactsList;