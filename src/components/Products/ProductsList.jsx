import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import { Plus, Search, Filter, Edit, Eye, Trash2, Package, Image, AlertCircle, Star, Tag, X } from 'lucide-react';
import Table from '../Common/Table';
import Modal from '../Common/Modal';
import {
  getProducts,
  getCategories,
  getSubCategories,
  getUserTypes,
  deleteProduct,
  addProductRating,
  getProductRatings,
} from '../../services/Api';
import ProductForm from './ProductForm';
import ProductDetails from './ProductDetails';
import { getUser, clearAuthData } from '../../utils/tokenHandler';
import { normalizeImageUrl } from '../../utils/imageUtils';

// Utility function to handle image URLs
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  return normalizeImageUrl(imageUrl);
};

// Utility function to safely format rating
const formatRating = (rating) => {
  if (rating === null || rating === undefined || rating === '' || isNaN(Number(rating))) {
    return null;
  }
  return Number(rating).toFixed(1);
};

const ProductsList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [activeUserTypes, setActiveUserTypes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editProduct, setEditProduct] = useState({});
  const [showRatingsModal, setShowRatingsModal] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [newRating, setNewRating] = useState({ rating: 0, review: '' });
  const [loading, setLoading] = useState(false); // Start with false
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    categoryId: '',
    subcategoryId: '',
    isActive: '',
    designNumber: '',
    minDesignNumber: '',
    maxDesignNumber: '',
    minPrice: '',
    maxPrice: '',
  });
  const [counts, setCounts] = useState({
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 20,
  });

  // Refs to track rendering and prevent duplicates
  const isMountedRef = useRef(false);
  const isInitialLoadRef = useRef(false);
  const lastFetchedParams = useRef({});
  const isFetchingRef = useRef(false);

  // Authentication check using stored user data
  useEffect(() => {
    const user = getUser();
    if (!user) {
      setError('Please log in to access this page.');
      navigate('/login');
    }
  }, [navigate]);

  // Compute serialized params for dependency tracking
  const paramsString = useMemo(() => {
    const params = {
      page: pagination.currentPage,
      limit: pagination.limit,
      search: searchTerm.trim(),
      categoryId: filters.categoryId,
      subcategoryId: filters.subcategoryId,
      isActive: filters.isActive,
      designNumber: filters.designNumber.trim(),
      minDesignNumber: filters.minDesignNumber.trim(),
      maxDesignNumber: filters.maxDesignNumber.trim(),
      minPrice: filters.minPrice.trim(),
      maxPrice: filters.maxPrice.trim(),
    };
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== '' && v !== undefined)
    );
    return JSON.stringify(cleanParams);
  }, [pagination.currentPage, pagination.limit, searchTerm, filters]);

  // Load products function
  const loadProducts = useCallback(async () => {
    if (isFetchingRef.current || !isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const currentParams = {
        page: pagination.currentPage,
        limit: pagination.limit,
        search: searchTerm.trim() || undefined,
        categoryId: filters.categoryId || undefined,
        subcategoryId: filters.subcategoryId || undefined,
        isActive: filters.isActive !== '' ? filters.isActive : undefined,
        designNumber: filters.designNumber.trim() || undefined,
        minDesignNumber: filters.minDesignNumber.trim() || undefined,
        maxDesignNumber: filters.maxDesignNumber.trim() || undefined,
        minPrice: filters.minPrice.trim() || undefined,
        maxPrice: filters.maxPrice.trim() || undefined,
      };

      Object.keys(currentParams).forEach(key => {
        if (currentParams[key] === undefined) {
          delete currentParams[key];
        }
      });

      if (JSON.stringify(currentParams) === JSON.stringify(lastFetchedParams.current)) {
        setLoading(false);
        return;
      }

      isFetchingRef.current = true;
      lastFetchedParams.current = currentParams;

      console.log('API Request params:', currentParams);

      const response = await getProducts(currentParams);

      if (response && response.success && Array.isArray(response.products)) {
        setProducts([...response.products]);
        setPagination(prev => ({
          ...prev,
          totalPages: response.pagination.totalPages || 1,
          totalProducts: response.pagination.total || 0,
          currentPage: response.pagination.currentPage || 1,
        }));
        setCounts({
          totalCount: response.counts.totalCount || 0,
          activeCount: response.counts.activeCount || 0,
          inactiveCount: response.counts.inactiveCount || 0,
        });
      } else {
        throw new Error('Invalid response format from getProducts');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      handleApiError(error, 'Failed to load products');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [pagination.currentPage, pagination.limit, searchTerm, filters]);

  // Debounced loadProducts function
  const debouncedLoadProducts = useCallback(debounce(loadProducts, 300), [loadProducts]);

  // Initialize component
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!isInitialLoadRef.current) {
      isInitialLoadRef.current = true;
      loadInitialData();
    }

    return () => {
      isMountedRef.current = false;
      debouncedLoadProducts.cancel();
    };
  }, []);

  // Load products when params change
  useEffect(() => {
    if (isMountedRef.current && isInitialLoadRef.current) {
      debouncedLoadProducts();
    }
  }, [paramsString, debouncedLoadProducts]);

  useEffect(() => {
    if (filters.categoryId) {
      loadSubcategories(filters.categoryId);
    } else {
      setSubcategories([]);
      setFilters(prev => ({ ...prev, subcategoryId: '' }));
    }
  }, [filters.categoryId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedProduct(null);
      setEditProduct({});
      setShowEditProduct(false);
      setShowAddProduct(false);

      const [categoriesResult, userTypesResult] = await Promise.all([
        getCategories(),
        getUserTypes(),
      ]);

      if (categoriesResult.success) {
        setCategories(categoriesResult.categories || []);
      } else {
        throw new Error('Failed to fetch categories');
      }

      if (userTypesResult.success) {
        const allUserTypes = userTypesResult.userTypes || [];
        setUserTypes(allUserTypes);
        const activeTypes = allUserTypes
          .filter(userType => userType.isActive && userType.name && userType.name.trim() !== '')
          .map(userType => userType.name);
        setActiveUserTypes(activeTypes);
      } else {
        throw new Error('Failed to fetch user types');
      }

      // Load products after initial data
      await loadProducts();
    } catch (error) {
      console.error('Error loading initial data:', error);
      handleApiError(error, 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = async (parentId) => {
    try {
      const response = await getSubCategories(parentId);
      if (response.success) {
        setSubcategories(response.subcategories || []);
      } else {
        throw new Error('Failed to load subcategories');
      }
    } catch (error) {
      handleApiError(error, 'Failed to load subcategories');
    }
  };

  const handleApiError = (error, defaultMessage) => {
    console.error(`${defaultMessage}:`, error);
    if (error.message && (error.message.includes('Invalid token') || error.message.includes('Token expired'))) {
      setError('Your session has expired. Please log in again.');
      clearAuthData();
      navigate('/login');
    } else {
      setError(error.message || defaultMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleFormSuccess = (isEdit, updatedProduct) => {
  console.log('handleFormSuccess called:', { isEdit, updatedProduct });
  
  setSuccess(isEdit ? 'Product updated successfully!' : 'Product created successfully!');
  
  if (isEdit && updatedProduct) {
    // Update the product in the state immediately
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === updatedProduct.id ? { ...product, ...updatedProduct } : product
      )
    );
    
    // Also update selected product if it's the same
    if (selectedProduct && selectedProduct.id === updatedProduct.id) {
      setSelectedProduct(prev => ({ ...prev, ...updatedProduct }));
    }
    
    // Close the edit modal immediately
    setShowEditProduct(false);
    setEditProduct({});
  } else {
    // For new product, add it to the beginning of the list immediately
    if (updatedProduct) {
      setProducts(prevProducts => [updatedProduct, ...prevProducts]);
      
      // Update counts
      setCounts(prev => ({
        totalCount: prev.totalCount + 1,
        activeCount: updatedProduct.isActive ? prev.activeCount + 1 : prev.activeCount,
        inactiveCount: !updatedProduct.isActive ? prev.inactiveCount + 1 : prev.inactiveCount,
      }));
    }
    
    // Close the add modal immediately
    setShowAddProduct(false);
  }
  
  // Optionally refresh the list to ensure data consistency
  setTimeout(() => {
    loadProducts();
  }, 500);
  
  setTimeout(() => setSuccess(null), 3000);
};

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    const previousProducts = [...products];
    const deletedProduct = products.find(p => p.id === productId);
    
    // Optimistic update
    setProducts(prev => prev.filter(product => product.id !== productId));
    setCounts(prev => ({
      ...prev,
      totalCount: prev.totalCount - 1,
      activeCount: deletedProduct?.isActive ? prev.activeCount - 1 : prev.activeCount,
      inactiveCount: !deletedProduct?.isActive ? prev.inactiveCount - 1 : prev.inactiveCount,
    }));

    try {
      setLoading(true);
      const response = await deleteProduct(productId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete product');
      }
      setSuccess('Product deleted successfully!');
      setSelectedProduct(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      // Revert on failure
      setProducts(previousProducts);
      setCounts(prev => ({
        ...prev,
        totalCount: prev.totalCount + 1,
        activeCount: deletedProduct?.isActive ? prev.activeCount + 1 : prev.activeCount,
        inactiveCount: !deletedProduct?.isActive ? prev.inactiveCount + 1 : prev.inactiveCount,
      }));
      handleApiError(error, 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRating = async (productId) => {
    try {
      setSubmitting(true);
      setError(null);

      if (!newRating.rating || newRating.rating < 1 || newRating.rating > 5) {
        throw new Error('Please provide a rating between 1 and 5');
      }

      const response = await addProductRating(productId, newRating);
      if (!response.success) {
        throw new Error(response.message || 'Failed to add rating');
      }

      setSuccess('Rating added successfully!');
      setNewRating({ rating: 0, review: '' });
      setShowRatingsModal(false);
      loadProducts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      handleApiError(error, 'Failed to add rating');
    } finally {
      setSubmitting(false);
    }
  };

  const loadProductRatings = async (productId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProductRatings(productId);
      if (response.success) {
        setRatings(response.ratings || []);
        setShowRatingsModal(true);
      } else {
        throw new Error(response.message || 'Failed to load ratings');
      }
    } catch (error) {
      handleApiError(error, 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (product) => {
    try {
      const productCopy = JSON.parse(JSON.stringify(product));
      setEditProduct(productCopy);
      setShowEditProduct(true);
    } catch (error) {
      console.error('Error opening edit modal:', error);
      setError('Failed to open edit modal. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleViewProduct = (product) => {
    try {
      const productCopy = JSON.parse(JSON.stringify(product));
      setSelectedProduct(productCopy);
    } catch (error) {
      console.error('Error viewing product:', error);
      setError('Failed to view product. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    if (key === 'categoryId' && value) {
      loadSubcategories(value);
    }
    if (key === 'categoryId' && !value) {
      setFilters(prev => ({ ...prev, subcategoryId: '' }));
    }
  };

  const handleClearFilter = (filterKey) => {
    handleFilterChange(filterKey, '');
  };

  const handleClearAllFilters = () => {
    setFilters({
      categoryId: '',
      subcategoryId: '',
      isActive: '',
      designNumber: '',
      minDesignNumber: '',
      maxDesignNumber: '',
      minPrice: '',
      maxPrice: '',
    });
    setSearchTerm('');
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const columns = [
    {
      key: 'imageUrls',
      header: 'Image',
      sortable: false,
      render: (value) => {
        const uniqueUrls = value ? [...new Set(value)] : [];
        return (
          <div className="flex justify-center items-center w-12 h-12 bg-gray-200 rounded-lg">
            {uniqueUrls?.length > 0 ? (
              <img
                src={getImageUrl(uniqueUrls[0])}
                alt="Product"
                className="object-cover w-full h-full rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22150%22%20height%3D%22150%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22150%22%20height%3D%22150%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22Arial%2C%20sans-serif%22%20fill%3D%22%23999%22%3EImage%20Not%20Found%3C%2Ftext%3E%3C%2Fsvg%3E';
                }}
              />
            ) : (
              <Image size={20} className="text-gray-400" />
            )}
          </div>
        );
      },
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (value) => (
        <div className="font-medium text-gray-900 font-roboto">{value}</div>
      ),
    },
    {
      key: 'designNumber',
      header: 'Design Number',
      sortable: true,
      render: (value) => (
        <div className="text-gray-900 font-roboto">{value || '-'}</div>
      ),
    },
    {
      key: 'generalPrice',
      header: 'General Price',
      sortable: true,
      render: (value) => `₹${Number(value || 0).toLocaleString()}`,
    },
    {
      key: 'architectPrice',
      header: 'Architect Price',
      sortable: true,
      render: (value) => `₹${Number(value || 0).toLocaleString()}`,
    },
    {
      key: 'dealerPrice',
      header: 'Dealer Price',
      sortable: true,
      render: (value) => `₹${Number(value || 0).toLocaleString()}`,
    },
    {
      key: 'unitType',
      header: 'Unit Type',
      sortable: true,
      render: (value) => (
        <div className="text-gray-900 font-roboto">{value || 'Per Sheet'}</div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (value) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${value
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
            }`}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (value, item) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleViewProduct(item);
            }}
            className="p-1 rounded text-primary hover:bg-red-50"
            title="View Product"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              openEditModal(item);
            }}
            className="p-1 text-gray-600 rounded hover:bg-gray-50"
            title="Edit Product"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleDeleteProduct(item.id);
            }}
            className="p-1 text-red-600 rounded hover:bg-red-50"
            title="Delete Product"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const stats = {
    total: counts.totalCount,
    active: counts.activeCount,
    inactive: counts.inactiveCount,
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '') || searchTerm !== '';

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full border-b-2 animate-spin border-primary"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-roboto">
      {/* Remove animation to prevent double rendering */}
      {error && (
        <div className="flex items-center p-4 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="mr-3 w-5 h-5 text-red-400" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="mr-3 w-5 h-5 bg-green-400 rounded-full"></div>
          <span className="text-green-800">{success}</span>
        </div>
      )}

      <div className="flex flex-col gap-4 justify-between items-start sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-roboto">Products Management</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddProduct(true)}
            className="flex items-center px-4 py-2 space-x-2 text-white rounded-lg bg-primary hover:bg-red-600"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold font-roboto text-primary">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold font-roboto text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active Products</div>
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold font-roboto text-red-600">{stats.inactive}</div>
          <div className="text-sm text-gray-600">Inactive Products</div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 text-gray-400 transform -translate-y-1/2"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by product name..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 space-x-2 rounded-lg border border-gray-300 hover:bg-gray-50 ${showFilters ? 'bg-gray-100' : ''}`}
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="flex items-center px-4 py-2 space-x-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
              >
                <X size={16} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t border-gray-200 sm:grid-cols-2 md:grid-cols-6">
            <div className="relative">
              <Tag
                className="absolute left-3 top-1/2 text-gray-400 transform -translate-y-1/2"
                size={18}
              />
              <input
                type="text"
                placeholder="Design Number"
                value={filters.designNumber}
                onChange={(e) => handleFilterChange('designNumber', e.target.value)}
                className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
              />
            </div>
            <div className="relative">
              <Tag
                className="absolute left-3 top-1/2 text-gray-400 transform -translate-y-1/2"
                size={18}
              />
              <input
                type="text"
                placeholder="Min Design Number"
                value={filters.minDesignNumber}
                onChange={(e) => handleFilterChange('minDesignNumber', e.target.value)}
                className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
              />
            </div>
            <div className="relative">
              <Tag
                className="absolute left-3 top-1/2 text-gray-400 transform -translate-y-1/2"
                size={18}
              />
              <input
                type="text"
                placeholder="Max Design Number"
                value={filters.maxDesignNumber}
                onChange={(e) => handleFilterChange('maxDesignNumber', e.target.value)}
                className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
              />
            </div>
            <div className="relative">
              <Tag
                className="absolute left-3 top-1/2 text-gray-400 transform -translate-y-1/2"
                size={18}
              />
              <input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
                min="0"
              />
            </div>
            <div className="relative">
              <Tag
                className="absolute left-3 top-1/2 text-gray-400 transform -translate-y-1/2"
                size={18}
              />
              <input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
                min="0"
              />
            </div>
            <select
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
              value={filters.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
              value={filters.subcategoryId}
              onChange={(e) => handleFilterChange('subcategoryId', e.target.value)}
              disabled={!filters.categoryId}
            >
              <option value="">All Subcategories</option>
              {subcategories.map((subcat) => (
                <option key={subcat.id} value={subcat.id}>{subcat.name}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <div className="flex items-center p-2 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-800 text-sm">Search: "{searchTerm}"</span>
              <button
                onClick={() => handleSearch('')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {filters.designNumber && (
            <div className="flex items-center p-2 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-800 text-sm">Design Number: {filters.designNumber}</span>
              <button
                onClick={() => handleClearFilter('designNumber')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {filters.minDesignNumber && (
            <div className="flex items-center p-2 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-800 text-sm">Min Design: {filters.minDesignNumber}</span>
              <button
                onClick={() => handleClearFilter('minDesignNumber')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {filters.maxDesignNumber && (
            <div className="flex items-center p-2 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-800 text-sm">Max Design: {filters.maxDesignNumber}</span>
              <button
                onClick={() => handleClearFilter('maxDesignNumber')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {filters.minPrice && (
            <div className="flex items-center p-2 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-800 text-sm">Min Price: ₹{filters.minPrice}</span>
              <button
                onClick={() => handleClearFilter('minPrice')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {filters.maxPrice && (
            <div className="flex items-center p-2 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-800 text-sm">Max Price: ₹{filters.maxPrice}</span>
              <button
                onClick={() => handleClearFilter('maxPrice')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {filters.categoryId && (
            <div className="flex items-center p-2 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-800 text-sm">
                Category: {categories.find(c => c.id === filters.categoryId)?.name || filters.categoryId}
              </span>
              <button
                onClick={() => handleClearFilter('categoryId')}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {filters.subcategoryId && (
            <div className="flex items-center p-2 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-800 text-sm">
                Subcategory: {subcategories.find(s => s.id === filters.subcategoryId)?.name || filters.subcategoryId}
              </span>
              <button
                onClick={() => handleClearFilter('subcategoryId')}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {filters.isActive !== '' && (
            <div className="flex items-center p-2 bg-purple-50 rounded-lg border border-purple-200">
              <span className="text-purple-800 text-sm">
                Status: {filters.isActive === 'true' ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => handleClearFilter('isActive')}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      <Table
        data={products}
        columns={columns}
        onRowClick={(product) => handleViewProduct(product)}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        loading={loading}
        emptyMessage={hasActiveFilters ? "No products found matching your filters." : "No products available."}
      />

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        title="Add New Product"
        size="lg"
      >
        <ProductForm
          isEdit={false}
          product={null}
          categories={categories}
          initialSubcategories={subcategories}
          activeUserTypes={activeUserTypes}
          onSuccess={handleFormSuccess}
          handleApiError={handleApiError}
          getImageUrl={getImageUrl}
          onCancel={() => setShowAddProduct(false)}
        />
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={showEditProduct}
        onClose={() => {
          setShowEditProduct(false);
          setEditProduct({});
        }}
        title="Edit Product"
        size="lg"
      >
        <ProductForm
          isEdit={true}
          product={editProduct}
          categories={categories}
          initialSubcategories={subcategories}
          activeUserTypes={activeUserTypes}
          onSuccess={handleFormSuccess}
          handleApiError={handleApiError}
          getImageUrl={getImageUrl}
          onCancel={() => {
            setShowEditProduct(false);
            setEditProduct({});
          }}
        />
      </Modal>

      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name || 'Product Details'}
        size="lg"
      >
        <ProductDetails
          product={selectedProduct}
          onViewRatings={() => loadProductRatings(selectedProduct.id)}
          getImageUrl={getImageUrl}
          formatRating={formatRating}
        />
      </Modal>

      <Modal
        isOpen={showRatingsModal}
        onClose={() => {
          setShowRatingsModal(false);
          setRatings([]);
          setNewRating({ rating: 0, review: '' });
        }}
        title="Product Ratings"
        size="md"
      >
        <div className="space-y-6 font-roboto">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Add New Rating</h3>
            <div className="flex items-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={24}
                  className={`cursor-pointer ${newRating.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  onClick={() => setNewRating({ ...newRating, rating: star })}
                />
              ))}
            </div>
            <textarea
              value={newRating.review}
              onChange={(e) => setNewRating({ ...newRating, review: e.target.value })}
              rows={3}
              placeholder="Write your review..."
              className="mt-2 px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
            />
            <button
              onClick={() => handleAddRating(selectedProduct?.id)}
              disabled={submitting}
              className="mt-2 px-4 py-2 text-white rounded-lg bg-primary hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900">Existing Ratings</h3>
            {ratings.length > 0 ? (
              <div className="space-y-4 mt-2">
                {ratings.map((rating, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Star size={16} className="text-yellow-400 mr-1" />
                      <span>{rating.rating}/5</span>
                    </div>
                    <p className="mt-1 text-gray-600">{rating.review || 'No review provided'}</p>
                    <p className="text-sm text-gray-500">
                      By {rating.user?.name || 'Anonymous'} on {new Date(rating.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-gray-600">No ratings available.</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductsList;