import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  getCategories,
  getSubCategories,
  createCategory,
  createSubCategory,
  updateCategory,
  deleteCategory,
  searchCategories,
  isAuthenticated,
  getCurrentUser,
  deleteCategoryWithProductMove,
  getCategoriesForSelection,
  prepareCategoryFormData,
  validateCategoryData,
} from '../../services/Api';
import CategoryTable from './CategoryTable';
import CategoryModals from './CategoryModals';

// Category Component - Redesigned with tabbed interface and table view
const Category = ({ currentUser }) => {
  // State management
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tab management
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' or 'subcategories'

  // Form states for main category
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState(null);
  const [newCategoryImagePreview, setNewCategoryImagePreview] = useState(null);

  // Form states for subcategory
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryBrandName, setNewSubcategoryBrandName] = useState('');

  // Edit states
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryBrandName, setEditCategoryBrandName] = useState('');
  const [editCategoryImage, setEditCategoryImage] = useState(null);
  const [editCategoryImagePreview, setEditCategoryImagePreview] = useState(null);
  const [editCategoryIsSubcategory, setEditCategoryIsSubcategory] = useState(false);

  const [isAdminOrManager, setIsAdminOrManager] = useState(false);
  const [nameError, setNameError] = useState(null);
  const [operationLoading, setOperationLoading] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalType, setModalType] = useState('category'); // 'category' or 'subcategory'

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedItems, setSelectedItems] = useState([]);

  const isFetchingRef = useRef(false);

  // Category deletion states
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Memoized validation
  const isFormValid = useMemo(() => {
    return !nameError && newCategoryName.trim().length >= 2;
  }, [nameError, newCategoryName]);

  const isSubcategoryFormValid = useMemo(() => {
    return !nameError && newSubcategoryName.trim().length >= 2 && selectedCategory;
  }, [nameError, newSubcategoryName, selectedCategory]);

  const isEditFormValid = useMemo(() => {
    return !nameError && editCategoryName.trim().length >= 2;
  }, [nameError, editCategoryName]);

  // Loading state management
  const setItemLoading = (id, isLoading) => {
    setOperationLoading(prev => ({
      ...prev,
      [id]: isLoading,
    }));
  };

  // Image handling functions
  const handleImageSelect = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('Category: Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.log('Category: Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditCategoryImage(file);
        setEditCategoryImagePreview(reader.result);
      } else {
        setNewCategoryImage(file);
        setNewCategoryImagePreview(reader.result);
      }
      console.log(`Category: Image selected for ${isEdit ? 'edit' : 'new'} category:`, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleImageDrop = (file, isEdit = false) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('Category: Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.log('Category: Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditCategoryImage(file);
        setEditCategoryImagePreview(reader.result);
      } else {
        setNewCategoryImage(file);
        setNewCategoryImagePreview(reader.result);
      }
      console.log(`Category: Image dropped for ${isEdit ? 'edit' : 'new'} category:`, file.name);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = (isEdit = false) => {
    if (isEdit) {
      setEditCategoryImage(null);
      setEditCategoryImagePreview(null);
      console.log('Category: Cleared edit category image');
    } else {
      setNewCategoryImage(null);
      setNewCategoryImagePreview(null);
      console.log('Category: Cleared new category image');
    }
  };

  // Name validation
  const validateName = (name, parentId = null, excludeId = null) => {
    if (!name || name.length < 2) {
      setNameError('Name must be at least 2 characters long');
      console.log('Category: Name validation failed: Name must be at least 2 characters long');
      return;
    }

    let items = [];
    if (parentId) {
      // For subcategories, find parent and check its subCategories
      const parentCat = categories.find(c => c.id === parentId);
      items = parentCat ? (parentCat.subCategories || []) : [];
    } else {
      // For main categories
      items = categories;
    }

    const exists = items.some(
      item => item.name.toLowerCase() === name.toLowerCase() && item.id !== excludeId
    );
    if (exists) {
      setNameError('Name already exists for this parent');
      console.log('Category: Name validation failed: Name already exists for this parent');
    } else {
      setNameError(null);
      console.log('Category: Name validation passed:', name);
    }
  };

  // Flatten categories to get all subcategories
  const getAllSubcategories = useMemo(() => {
    const flattenCategories = (cats) => {
      let allSubcats = [];
      cats.forEach(cat => {
        if (cat.subCategories && cat.subCategories.length > 0) {
          allSubcats = [...allSubcats, ...cat.subCategories];
          allSubcats = [...allSubcats, ...flattenCategories(cat.subCategories)];
        }
      });
      return allSubcats;
    };
    return flattenCategories(categories);
  }, [categories]);

  // Effects
  useEffect(() => {
    if (!isAuthenticated()) {
      setError('You must be logged in to manage categories');
      console.log('Category: Authentication error: Please log in to continue');
      return;
    }
    const user = getCurrentUser();
    if (user.success) {
      setIsAdminOrManager(user.user?.role === 'Admin' || user.user?.role === 'Manager' || user.user?.role === 'SuperAdmin');
      console.log('Category: User role set:', user.user?.role, 'isAdminOrManager:', user.user?.role === 'Admin' || user.user?.role === 'Manager' || user.user?.role === 'SuperAdmin');
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'subcategories' && selectedCategory) {
      // Get subcategories from the selected category's subCategories array
      const subs = selectedCategory.subCategories || [];
      setSubcategories(subs);
      
      // Update pagination for subcategories
      const itemsPerPage = 10;
      const totalPages = Math.ceil(subs.length / itemsPerPage);
      const startIndex = (pagination.currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedSubcats = subs.slice(startIndex, endIndex);
      
      setSubcategories(paginatedSubcats);
      setPagination(prev => ({ 
        ...prev, 
        totalPages,
        totalItems: subs.length,
        itemsPerPage
      }));
      
      console.log(`Category: Loaded ${paginatedSubcats.length} subcategories for category ID ${selectedCategory.id}`);
    } else {
      setSubcategories([]);
      setPagination(prev => ({ ...prev, currentPage: 1, totalItems: 0 }));
      console.log('Category: No category selected, cleared subcategories');
    }
  }, [selectedCategory, activeTab, pagination.currentPage]);

  useEffect(() => {
    if (newCategoryName) {
      validateName(newCategoryName);
    } else {
      setNameError(null);
      console.log('Category: Cleared new category name validation');
    }
  }, [newCategoryName]);

  useEffect(() => {
    if (newSubcategoryName && selectedCategory) {
      validateName(newSubcategoryName, selectedCategory.id);
    } else {
      setNameError(null);
      console.log('Category: Cleared new subcategory name validation');
    }
  }, [newSubcategoryName, selectedCategory]);

  useEffect(() => {
    if (editCategoryName && editCategoryId) {
      const category = [...categories, ...getAllSubcategories].find(c => c.id === editCategoryId);
      const parentId = category?.parentId || null;
      validateName(editCategoryName, parentId, editCategoryId);
    } else {
      setNameError(null);
      console.log('Category: Cleared edit category name validation');
    }
  }, [editCategoryName, editCategoryId, categories, getAllSubcategories]);

  // API functions
  const fetchCategories = async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      console.log('Category: Fetching categories...');
      const response = await getCategories();
      if (response.success) {
        setCategories(response.categories || []);
        console.log(`Category: Loaded ${response.categories?.length || 0} categories:`, response.categories);
      } else {
        throw new Error(response.message || 'Failed to fetch categories');
      }
    } catch (err) {
      console.log('Category: Fetch categories error:', err.message || 'Unknown error');
      setError(err.message);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const fetchSubcategories = useCallback(async (parentId, page = 1) => {
    if (!parentId) return;
    
    setLoading(true);
    try {
      console.log(`Category: Fetching subcategories for parent ID: ${parentId}, page: ${page}`);
      const response = await getSubCategories(parentId, { page, limit: 10 });
      
      if (response.success) {
        setSubcategories(response.subcategories || []);
        setPagination({
          currentPage: page,
          totalPages: response.pagination?.totalPages || 1,
          totalItems: response.pagination?.totalItems || 0,
          itemsPerPage: response.pagination?.itemsPerPage || 10,
        });
        console.log(`Category: Loaded ${response.subcategories?.length || 0} subcategories`);
      } else {
        throw new Error(response.message || 'Failed to fetch subcategories');
      }
    } catch (err) {
      console.log('Category: Fetch subcategories error:', err.message || 'Unknown error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Event handlers
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!isAdminOrManager || !isFormValid) {
      console.log('Category: Create category aborted: Not admin/manager or form invalid');
      return;
    }
    
    setItemLoading('create-category', true);
    try {
      const categoryData = {
        name: newCategoryName.trim(),
        image: newCategoryImage,
      };

      console.log('Category: Validating category data:', categoryData);
      const validation = validateCategoryData(categoryData, true);
      if (!validation.isValid) {
        console.log('Category: Validation failed:', validation.errors.join(', '));
        return;
      }

      const formData = prepareCategoryFormData(categoryData, true);
      console.log('Category: Creating category with data:', categoryData);
      const response = await createCategory(formData);
      
      if (response.success) {
        setNewCategoryName('');
        clearImage(false);
        setShowCreateModal(false);
        await fetchCategories();
        console.log('Category: Category created successfully:', response);
      } else {
        throw new Error(response.message || 'Failed to create category');
      }
    } catch (err) {
      console.log('Category: Create category error:', err.message || 'Unknown error');
    } finally {
      setItemLoading('create-category', false);
    }
  };

  const handleCreateSubcategory = async (e) => {
    e.preventDefault();
    if (!isAdminOrManager || !isSubcategoryFormValid || !selectedCategory) {
      console.log('Category: Create subcategory aborted: Not admin/manager or form invalid');
      return;
    }
    
    setItemLoading('create-subcategory', true);
    try {
      const subcategoryData = {
        name: newSubcategoryName.trim(),
        brandName: newSubcategoryBrandName.trim() || undefined,
        parentId: selectedCategory.id,
      };

      console.log('Category: Creating subcategory with data:', subcategoryData);
      const response = await createSubCategory(selectedCategory.id, subcategoryData);
      
      if (response.success) {
        setNewSubcategoryName('');
        setNewSubcategoryBrandName('');
        setShowCreateModal(false);
        await fetchCategories();
        
        // Update selected category with refreshed data
        const updatedCategories = await getCategories();
        if (updatedCategories.success) {
          const updatedCat = updatedCategories.categories.find(c => c.id === selectedCategory.id);
          if (updatedCat) {
            setSelectedCategory(updatedCat);
            // Update subcategories list
            if (activeTab === 'subcategories') {
              fetchSubcategories(updatedCat.id, pagination.currentPage);
            }
          }
        }
        console.log('Category: Subcategory created successfully:', response);
      } else {
        throw new Error(response.message || 'Failed to create subcategory');
      }
    } catch (err) {
      console.log('Category: Create subcategory error:', err.message || 'Unknown error');
    } finally {
      setItemLoading('create-subcategory', false);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!isAdminOrManager || !isEditFormValid) {
      console.log('Category: Update category aborted: Not admin/manager or form invalid');
      return;
    }
    
    setItemLoading(`update-${editCategoryId}`, true);
    try {
      const category = [...categories, ...getAllSubcategories].find(c => c.id === editCategoryId);
      const isSubcategory = !!category?.parentId;

      const updateData = {
        name: editCategoryName.trim(),
        brandName: editCategoryBrandName.trim() || undefined,
        parentId: category?.parentId || null,
      };

      if (!isSubcategory && editCategoryImage) {
        updateData.image = editCategoryImage;
      }

      console.log('Category: Validating update data:', updateData);
      const validation = validateCategoryData(updateData, !isSubcategory);
      if (!validation.isValid) {
        console.log('Category: Validation failed:', validation.errors.join(', '));
        return;
      }

      const formData = prepareCategoryFormData(updateData, !isSubcategory);
      console.log('Category: Updating category ID:', editCategoryId, 'with data:', updateData);
      const response = await updateCategory(editCategoryId, formData);
      
      if (response.success) {
        setShowEditModal(false);
        setEditCategoryId(null);
        setEditCategoryName('');
        setEditCategoryBrandName('');
        clearImage(true);
        await fetchCategories();
        
        // Update selected if it was the edited one
        if (selectedCategory?.id === editCategoryId) {
          const updatedCategories = await getCategories();
          if (updatedCategories.success) {
            const updatedCat = updatedCategories.categories.find(c => c.id === editCategoryId);
            if (updatedCat) {
              setSelectedCategory(updatedCat);
              if (activeTab === 'subcategories') {
                fetchSubcategories(updatedCat.id, pagination.currentPage);
              }
            }
          }
        }
        console.log('Category: Category updated successfully:', response);
      } else {
        throw new Error(response.message || 'Failed to update category');
      }
    } catch (err) {
      console.log('Category: Update category error:', err.message || 'Unknown error');
    } finally {
      setItemLoading(`update-${editCategoryId}`, false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!isAdminOrManager) {
      console.log('Category: Delete category aborted: User is not admin or manager');
      return;
    }

    setItemLoading(`delete-${id}`, true);
    try {
      console.log(`Category: Attempting to delete category ID: ${id}, Name: ${name}`);
      const response = await deleteCategory(id);
      if (response.success) {
        await fetchCategories();
        // If deleted was selected, clear selection
        if (selectedCategory?.id === id) {
          setSelectedCategory(null);
          setActiveTab('categories');
          console.log('Category: Deleted selected category, cleared selection');
        } else if (selectedCategory) {
          // Re-update subcats from refreshed data
          const updatedCategories = await getCategories();
          if (updatedCategories.success) {
            const updatedCat = updatedCategories.categories.find(c => c.id === selectedCategory.id);
            if (updatedCat) {
              setSelectedCategory(updatedCat);
              if (activeTab === 'subcategories') {
                fetchSubcategories(updatedCat.id, pagination.currentPage);
              }
            }
          }
        }
        console.log(`Category: Category "${name}" (ID: ${id}) deleted successfully:`, response);
        return;
      }

      if (response.canForceDelete && response.activeProductsCount > 0) {
        console.log(`Category: Category "${name}" (ID: ${id}) has ${response.activeProductsCount} active products, prompting for relocation`);
        const confirmed = window.confirm(
          `"${name}" has ${response.activeProductsCount} active products. Would you like to move these products to another category and delete "${name}"?`
        );
        if (!confirmed) {
          console.log('Category: Deletion cancelled by user');
          return;
        }

        console.log('Category: Fetching available categories for product relocation');
        const categoriesResponse = await getCategoriesForSelection(response.affectedCategoryIds);
        if (!categoriesResponse.success || categoriesResponse.categories.length === 0) {
          console.log('Category: No available categories for product relocation');
          return;
        }

        setAvailableCategories(categoriesResponse.categories);
        setCategoryToDelete({ id, name, activeProductsCount: response.activeProductsCount });
        setShowCategorySelector(true);
        console.log('Category: Opened category selector modal with available categories:', categoriesResponse.categories);
      } else {
        throw new Error(response.message || 'Failed to delete category');
      }
    } catch (err) {
      console.log('Category: Delete category error:', err.message || 'Unknown error');
    } finally {
      setItemLoading(`delete-${id}`, false);
    }
  };

  const handleCategorySelection = async (targetCategoryId) => {
    if (!targetCategoryId || !categoryToDelete) {
      console.log('Category: No target category selected for product relocation');
      setShowCategorySelector(false);
      return;
    }

    setItemLoading(`delete-${categoryToDelete.id}`, true);
    try {
      console.log(`Category: Deleting category ID: ${categoryToDelete.id} with product move to target ID: ${targetCategoryId}`);
      const response = await deleteCategoryWithProductMove(categoryToDelete.id, targetCategoryId);
      if (response.success) {
        await fetchCategories();
        // If deleted was selected, clear selection
        if (selectedCategory?.id === categoryToDelete.id) {
          setSelectedCategory(null);
          setActiveTab('categories');
          console.log('Category: Deleted selected category, cleared selection');
        } else if (selectedCategory) {
          // Re-update subcats from refreshed data
          const updatedCategories = await getCategories();
          if (updatedCategories.success) {
            const updatedCat = updatedCategories.categories.find(c => c.id === selectedCategory.id);
            if (updatedCat) {
              setSelectedCategory(updatedCat);
              if (activeTab === 'subcategories') {
                fetchSubcategories(updatedCat.id, pagination.currentPage);
              }
            }
          }
        }
        console.log(`Category: Category "${categoryToDelete.name}" (ID: ${categoryToDelete.id}) deleted with products moved to ID: ${targetCategoryId}:`, response);
      } else {
        throw new Error(response.message || 'Failed to delete category with product move');
      }
    } catch (err) {
      console.log('Category: Delete category with product move error:', err.message || 'Unknown error');
    } finally {
      setItemLoading(`delete-${categoryToDelete.id}`, false);
      setShowCategorySelector(false);
      setCategoryToDelete(null);
      setAvailableCategories([]);
      console.log('Category: Closed category selector modal and cleared deletion state');
    }
  };

  // New modal handlers for the redesigned interface
  const openCreateModal = (type = 'category') => {
    setModalType(type);
    setShowCreateModal(true);
    // Reset form states
    if (type === 'category') {
      setNewCategoryName('');
      clearImage(false);
    } else {
      setNewSubcategoryName('');
      setNewSubcategoryBrandName('');
    }
    setNameError(null);
  };

  const openEditModal = (category) => {
    setEditCategoryId(category.id);
    setEditCategoryName(category.name);
    setEditCategoryBrandName(category.brandName || '');
    setEditCategoryIsSubcategory(!!category.parentId);
    setEditCategoryImagePreview(category.imageUrl || null);
    setEditCategoryImage(null);
    setModalType(category.parentId ? 'subcategory' : 'category');
    setShowEditModal(true);
    setNameError(null);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditCategoryId(null);
    setEditCategoryName('');
    setEditCategoryBrandName('');
    setEditCategoryIsSubcategory(false);
    clearImage(true);
    setNameError(null);
  };

  // Sorting and filtering functions
  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const filteredAndSortedItems = useMemo(() => {
    let items = activeTab === 'categories' ? categories : subcategories;

    // Filter by search term
    if (searchTerm) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.brandName && item.brandName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort items
    if (sortConfig.key) {
      items.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'name') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return items;
  }, [categories, subcategories, activeTab, searchTerm, sortConfig]);

  // Bulk operations
  const handleBulkDelete = async () => {
    if (!selectedItems.length || !isAdminOrManager) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedItems.length} selected items?`);
    if (!confirmed) return;

    setOperationLoading(prev => ({ ...prev, 'bulk-delete': true }));

    try {
      // Delete items one by one (can be optimized with batch API if available)
      for (const itemId of selectedItems) {
        const item = [...categories, ...subcategories].find(c => c.id === itemId);
        if (item) {
          await handleDeleteCategory(itemId, item.name);
        }
      }
      setSelectedItems([]);
    } catch (err) {
      console.log('Category: Bulk delete error:', err.message);
    } finally {
      setOperationLoading(prev => ({ ...prev, 'bulk-delete': false }));
    }
  };

  const startEdit = (category) => {
    if (!isAdminOrManager) {
      console.log('Category: Start edit aborted: User is not admin or manager');
      return;
    }
    openEditModal(category);
  };

  const cancelEdit = () => {
    closeModals();
  };

  const handleViewSubcategories = (category) => {
    setSelectedCategory(category);
    setActiveTab('subcategories');
    // Reset pagination when switching to subcategories
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    if (selectedCategory && activeTab === 'subcategories') {
      fetchSubcategories(selectedCategory.id, newPage);
    }
  };

  return (
    <div className="p-6 mx-auto max-w-7xl font-roboto">
      <Helmet>
        <title>Manage Categories - Ratan Decor Admin</title>
        <meta name="description" content="Manage product categories and subcategories for the Ratan Decor admin panel" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Header */}
      <div className="mb-8 animate-fade-in-left">
        <h1 className="mb-3 text-4xl font-bold text-gray-800">Category Management</h1>
        <p className="text-lg text-gray-600">Organize and manage your product categories efficiently</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('categories');
                setSelectedCategory(null);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Main Categories ({categories.length})
            </button>
            <button
              onClick={() => {
                if (selectedCategory) {
                  setActiveTab('subcategories');
                }
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subcategories'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              disabled={!selectedCategory}
            >
              Subcategories ({selectedCategory ? (selectedCategory.subCategories?.length || 0) : 0})
            </button>
          </nav>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && isAdminOrManager && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedItems.length} selected</span>
              <button
                onClick={handleBulkDelete}
                disabled={operationLoading['bulk-delete']}
                className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700 disabled:bg-red-400"
              >
                {operationLoading['bulk-delete'] ? 'Deleting...' : 'Delete Selected'}
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Create Buttons */}
        {isAdminOrManager && (
          <div className="flex gap-2">
            <button
              onClick={() => openCreateModal('category')}
              className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
            >
              Add Category
            </button>
            {activeTab === 'subcategories' && selectedCategory && (
              <button
                onClick={() => openCreateModal('subcategory')}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                Add Subcategory
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
          <div className="flex items-start">
            <svg className="mr-3 mt-0.5 w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-grow">
              <span className="text-red-800 font-medium">{error}</span>
              <button
                onClick={() => fetchCategories()}
                className="block mt-2 px-3 py-1 text-sm text-red-600 bg-white rounded border border-red-300 hover:bg-red-50 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Selector for Subcategories Tab */}
      {activeTab === 'subcategories' && (
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">Selected Parent Category</label>
          <div className="flex items-center gap-4">
            <div className="w-full max-w-md p-3 border border-gray-300 rounded-lg bg-gray-50">
              <div className="flex items-center">
                {selectedCategory?.imageUrl && (
                  <img
                    src={selectedCategory.imageUrl}
                    alt={selectedCategory.name}
                    className="w-10 h-10 rounded-full object-cover mr-3"
                  />
                )}
                <div>
                  <div className="font-medium text-gray-900">{selectedCategory?.name}</div>
                  <div className="text-sm text-gray-500">
                    ID: {selectedCategory?.id} • {selectedCategory?.subCategories?.length || 0} subcategories
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setActiveTab('categories');
              }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Change Category
            </button>
          </div>
        </div>
      )}

      {/* Category Selection for Changing Parent */}
      {activeTab === 'subcategories' && !selectedCategory && (
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">Select Parent Category</label>
          <select
            value={selectedCategory?.id || ''}
            onChange={(e) => {
              const cat = categories.find(c => c.id === parseInt(e.target.value));
              if (cat) {
                setSelectedCategory(cat);
                setActiveTab('subcategories');
              }
            }}
            className="w-full max-w-md p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Choose a category...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.subCategories?.length || 0} subcategories)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Table Component */}
      <CategoryTable
        items={filteredAndSortedItems}
        loading={loading}
        error={error}
        isAdminOrManager={isAdminOrManager}
        sortConfig={sortConfig}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        onSort={handleSort}
        onEdit={startEdit}
        onDelete={handleDeleteCategory}
        onViewSubcategories={handleViewSubcategories}
        operationLoading={operationLoading}
        type={activeTab === 'categories' ? 'category' : 'subcategory'}
      />

      {/* Pagination Controls */}
      {activeTab === 'subcategories' && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1 || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {/* Create Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {showCreateModal ? `Create ${modalType === 'category' ? 'Category' : 'Subcategory'}` : `Edit ${modalType === 'category' ? 'Category' : 'Subcategory'}`}
                </h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <form onSubmit={showCreateModal ? (modalType === 'category' ? handleCreateCategory : handleCreateSubcategory) : handleUpdateCategory}>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      {modalType === 'category' ? 'Category' : 'Subcategory'} Name *
                    </label>
                    <input
                      type="text"
                      value={showCreateModal ? (modalType === 'category' ? newCategoryName : newSubcategoryName) : editCategoryName}
                      onChange={(e) => {
                        if (showCreateModal) {
                          if (modalType === 'category') setNewCategoryName(e.target.value);
                          else setNewSubcategoryName(e.target.value);
                        } else {
                          setEditCategoryName(e.target.value);
                        }
                      }}
                      placeholder={`Enter ${modalType} name`}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={operationLoading[showCreateModal ? `create-${modalType}` : `update-${editCategoryId}`]}
                    />
                  </div>

                  {modalType === 'subcategory' && showCreateModal && (
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Brand Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={newSubcategoryBrandName}
                        onChange={(e) => setNewSubcategoryBrandName(e.target.value)}
                        placeholder="Enter brand name"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={operationLoading['create-subcategory']}
                      />
                    </div>
                  )}

                  {showEditModal && (
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Brand Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={editCategoryBrandName}
                        onChange={(e) => setEditCategoryBrandName(e.target.value)}
                        placeholder="Enter brand name"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={operationLoading[`update-${editCategoryId}`]}
                      />
                    </div>
                  )}

                  {modalType === 'category' && (
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Category Image {showEditModal ? '(Optional - leave empty to keep current)' : '(Optional)'}
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handleImageSelect(e, !showCreateModal)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={operationLoading[showCreateModal ? 'create-category' : `update-${editCategoryId}`]}
                      />
                      {(showCreateModal ? newCategoryImagePreview : editCategoryImagePreview) && (
                        <div className="mt-2">
                          <img
                            src={showCreateModal ? newCategoryImagePreview : editCategoryImagePreview}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                      {showEditModal && editCategoryImagePreview && (
                        <button
                          type="button"
                          onClick={() => clearImage(true)}
                          className="mt-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove image
                        </button>
                      )}
                    </div>
                  )}

                  {modalType === 'subcategory' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        ℹ️ Subcategories cannot have images. Only main categories support image uploads.
                      </p>
                    </div>
                  )}

                  {nameError && (
                    <div className="flex items-center p-2 text-sm text-red-700 bg-red-100 rounded-lg">
                      <svg className="mr-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      {nameError}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModals}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                      disabled={operationLoading[showCreateModal ? `create-${modalType}` : `update-${editCategoryId}`]}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-red-600 disabled:bg-red-400 transition-colors"
                      disabled={
                        operationLoading[showCreateModal ? `create-${modalType}` : `update-${editCategoryId}`] ||
                        !(showCreateModal ? (modalType === 'category' ? isFormValid : isSubcategoryFormValid) : isEditFormValid)
                      }
                    >
                      {operationLoading[showCreateModal ? `create-${modalType}` : `update-${editCategoryId}`] ? 'Saving...' : (showCreateModal ? 'Create' : 'Update')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection Modal for Deletion */}
      <CategoryModals
        showCategorySelector={showCategorySelector}
        setShowCategorySelector={setShowCategorySelector}
        categoryToDelete={categoryToDelete}
        setCategoryToDelete={setCategoryToDelete}
        availableCategories={availableCategories}
        setAvailableCategories={setAvailableCategories}
        handleCategorySelection={handleCategorySelection}
      />
    </div>
  );
};

export default Category;