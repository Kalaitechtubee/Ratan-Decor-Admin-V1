import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserPlus, Image as ImageIcon } from 'lucide-react';
import { getUserTypes, createUserType, updateUserType, deleteUserType } from '../../services/Api';

// Helper component to handle icon display with error handling
const UserTypeIcon = ({ iconUrl, name }) => {
  const [imageError, setImageError] = useState(false);

  if (!iconUrl || imageError) {
    return (
      <div className="w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
        <ImageIcon className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={iconUrl}
      alt={`${name} icon`}
      className="w-14 h-14 rounded-lg object-cover border border-gray-200 bg-gray-50 p-1"
      onError={() => {
        console.error('Failed to load icon:', iconUrl);
        setImageError(true);
      }}
    />
  );
};

function UserTypes() {
  const [userTypes, setUserTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', icon: null });
  const [editingId, setEditingId] = useState(null);
  const [editingIconUrl, setEditingIconUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [errors, setErrors] = useState({ name: '' });
  const [iconPreview, setIconPreview] = useState(null);

  const isInitialLoadedRef = useRef(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchUserTypes();
  }, []);

  const fetchUserTypes = async () => {
    if (isInitialLoadedRef.current || isFetchingRef.current) {
      console.log('UserTypes: Skipping fetch - already loaded or fetching');
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    try {
      console.log('UserTypes: Fetching user types...');
      const response = await getUserTypes();
      console.log('UserTypes: Raw API response:', response);
      
      if (response.success) {
        // Process the response to ensure iconUrl is included
        const processedUserTypes = (response.userTypes || []).map(ut => ({
          ...ut,
          iconUrl: ut.iconUrl || null
        }));
        setUserTypes(processedUserTypes);
        console.log('UserTypes: User types fetched and processed:', processedUserTypes);
        isInitialLoadedRef.current = true;
      } else {
        throw new Error(response.message || 'Failed to fetch user types');
      }
    } catch (error) {
      console.error('UserTypes: Failed to fetch user types:', error);
      alert('Failed to load user types. Please refresh the page.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const validateForm = useCallback(() => {
    const newErrors = { name: '' };
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (userTypes.some(ut => ut.name.toLowerCase() === formData.name.toLowerCase() && ut.id !== editingId)) {
      newErrors.name = 'Name already exists';
    }
    setErrors(newErrors);
    return !newErrors.name;
  }, [formData, userTypes, editingId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (2MB for icons)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPEG, PNG, WebP, and SVG images are allowed');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        icon: file,
      }));
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setIconPreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      if (formData.description) {
        submitData.append('description', formData.description.trim());
      }
      if (formData.icon instanceof File) {
        submitData.append('icon', formData.icon);
      }

      if (editingId) {
        console.log('UserTypes: Updating user type:', { id: editingId });
        const response = await updateUserType(editingId, submitData);
        console.log('UserTypes: Update response:', response);
        
        if (response.success) {
          // Update the user type in the list with the returned data including iconUrl
          setUserTypes(userTypes.map((ut) => 
            ut.id === editingId ? {
              ...response.userType,
              iconUrl: response.userType.iconUrl || null
            } : ut
          ));
          console.log('UserTypes: User type updated successfully:', response.userType);
          alert('User type updated successfully!');
        } else {
          throw new Error(response.message || 'Failed to update user type');
        }
      } else {
        console.log('UserTypes: Creating user type');
        const response = await createUserType(submitData);
        console.log('UserTypes: Create response:', response);
        
        if (response.success) {
          // Add the new user type to the list with iconUrl
          setUserTypes([...userTypes, {
            ...response.userType,
            iconUrl: response.userType.iconUrl || null
          }]);
          console.log('UserTypes: User type created successfully:', response.userType);
          alert('User type created successfully!');
        } else {
          throw new Error(response.message || 'Failed to create user type');
        }
      }
      resetForm();
    } catch (error) {
      console.error('UserTypes: Failed to save user type:', error);
      alert(error.message || 'Failed to save user type');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user type?')) return;
    setLoading(true);
    try {
      console.log('UserTypes: Deleting user type:', { id });
      const response = await deleteUserType(id);
      if (response.success) {
        const updatedUserTypes = userTypes.filter((ut) => ut.id !== id);
        setUserTypes(updatedUserTypes);
        console.log('UserTypes: User type deleted successfully');
        alert('User type deleted successfully!');
      } else {
        throw new Error(response.message || 'Failed to delete user type');
      }
    } catch (error) {
      console.error('UserTypes: Failed to delete user type:', error);
      alert(error.message || 'Failed to delete user type');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (userType) => {
    console.log('UserTypes: Editing user type:', userType);
    setFormData({
      name: userType.name,
      description: userType.description || '',
      icon: null, // Reset file input
    });
    setEditingId(userType.id);
    setEditingIconUrl(userType.iconUrl || null);
    setIconPreview(userType.iconUrl || null);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', icon: null });
    setEditingId(null);
    setEditingIconUrl(null);
    setIconPreview(null);
    setShowModal(false);
    setErrors({ name: '' });
    
    // Clean up preview URL
    if (iconPreview && iconPreview.startsWith('blob:')) {
      URL.revokeObjectURL(iconPreview);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredUserTypes = userTypes
    .filter(ut => ut.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aValue = sortConfig.key === 'name' ? a.name.toLowerCase() : a.isActive ? 1 : 0;
      const bValue = sortConfig.key === 'name' ? b.name.toLowerCase() : b.isActive ? 1 : 0;
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const pageTitle = 'Manage User Types';
  const pageDescription = 'Efficiently manage user types in the Ratan Decor admin panel. Create, update, and organize user roles for optimal business management.';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitle,
    description: pageDescription,
    url: 'https://www.ratandecor.com/manage-user-types',
    publisher: {
      '@type': 'Organization',
      name: 'Ratan Decor',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.ratandecor.com/images/logo.png',
      },
    },
  };

  return (
    <div className="p-6 mx-auto max-w-7xl space-y-8 font-roboto">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="Ratan Decor, user types management, admin panel, business roles, user role optimization" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="author" content="Ratan Decor" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.ratandecor.com/manage-user-types" />
        <meta property="og:image" content="https://www.ratandecor.com/images/og-image.jpg" />
        <meta property="og:image:alt" content="Ratan Decor User Types Management" />
        <meta property="og:site_name" content="Ratan Decor Admin" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="https://www.ratandecor.com/images/og-image.jpg" />
        <meta name="twitter:image:alt" content="Ratan Decor User Types Management" />
        <link rel="canonical" href="https://www.ratandecor.com/manage-user-types" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Manage Business Types</h1>
          <p className="text-gray-600 mt-1">Create, update, or delete Business Types for your application with modern efficiency.</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-primary">Business Types Overview</h3>
            <button
              onClick={() => {
                setFormData({ name: '', description: '', icon: null });
                setEditingId(null);
                setEditingIconUrl(null);
                setIconPreview(null);
                setShowModal(true);
              }}
              className="flex items-center px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg"
              aria-label="Add User Type"
            >
              <UserPlus size={20} className="mr-2" />
              Add User Type
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user types..."
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                aria-label="Search user types"
              />
              <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading Business Types...</span>
            </div>
          ) : filteredUserTypes.length === 0 ? (
            <div className="py-12 text-center animate-fade-in-left">
              <svg className="mx-auto mb-4 w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
              <p className="text-lg text-gray-600">No user types found.</p>
              <p className="text-sm text-gray-400 mt-1">Create a new Business Type to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUserTypes.map((userType, index) => (
                <div 
                  key={userType.id} 
                  className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-left"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        <UserTypeIcon iconUrl={userType.iconUrl} name={userType.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-800 truncate">{userType.name}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {userType.description || 'No description available'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(userType)}
                      className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 transition-all duration-200"
                      aria-label={`Edit ${userType.name} user type`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(userType.id)}
                      className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50 transition-all duration-200"
                      aria-label={`Delete ${userType.name} user type`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl transform scale-100 transition-transform duration-300">
            <h3 className="text-lg font-semibold text-primary mb-4">
              {editingId ? 'Edit User Type' : 'Create User Type'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full p-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300`}
                  placeholder="Enter user type name"
                  required
                  onBlur={validateForm}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                  placeholder="Enter description (optional)"
                  rows={3}
                  aria-label="User type description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Icon</label>
                {iconPreview && (
                  <div className="mb-3 flex items-center space-x-3">
                    <img 
                      src={iconPreview} 
                      alt="Icon preview" 
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200 bg-gray-50 p-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (iconPreview.startsWith('blob:')) {
                          URL.revokeObjectURL(iconPreview);
                        }
                        setIconPreview(null);
                        setFormData(prev => ({ ...prev, icon: null }));
                      }}
                      className="text-sm text-red-600 hover:text-red-700 underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                  aria-label="User type icon"
                />
                <p className="mt-2 text-xs text-gray-500">Max size: 2MB. Formats: JPEG, PNG, WebP, SVG</p>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || errors.name}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${loading || errors.name ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
                  aria-label={editingId ? 'Update User Type' : 'Create User Type'}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </div>
                  ) : editingId ? 'Update User Type' : 'Create User Type'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all duration-300 disabled:opacity-50"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserTypes;