// ProductForm.jsx - Add close functionality after success
import React, { useState, useEffect } from 'react';
import { X, Upload, ChevronDown, Check } from 'lucide-react';
import { getSubCategories, createProduct, updateProduct } from '../../services/Api';

const ProductForm = ({ isEdit, product: initialProduct, categories, initialSubcategories = [], activeUserTypes, onSuccess, handleApiError, getImageUrl, onCancel, onClose }) => {
  // Add onClose prop to the destructuring
  const defaultProduct = {
    visibleTo: [],
    categoryId: '',
    subcategoryId: '',
    name: '',
    description: '',
    brandName: '',
    designNumber: '',
    size: '',
    thickness: '',
    colors: [],
    gst: '',
    mrpPrice: '',
    generalPrice: '',
    architectPrice: '',
    dealerPrice: '',
    isActive: true,
    warranty: '',
    unitType: 'Per Sheet',
  };

  const [formProduct, setFormProduct] = useState(defaultProduct);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [subcategories, setSubcategories] = useState(initialSubcategories);
  const [submitting, setSubmitting] = useState(false);
  const [showUserTypeDropdown, setShowUserTypeDropdown] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User type options including "All"
  const userTypeOptions = [
    { value: 'all', label: 'All Business Types' },
    ...activeUserTypes.map(type => ({ value: type.toLowerCase(), label: type }))
  ];

  useEffect(() => {
    console.log('ProductForm: initialProduct changed', initialProduct);

    if (initialProduct) {
      // Determine category and subcategory IDs based on the nested category object
      let categoryId = '';
      let subcategoryId = '';

      if (initialProduct.category) {
        console.log('ProductForm: has category object', initialProduct.category);
        if (initialProduct.category.parentId) {
          // If it has a parent, the parent is the main Category, and this is the Subcategory
          categoryId = initialProduct.category.parentId;
          subcategoryId = initialProduct.categoryId || initialProduct.category.id;
          console.log('ProductForm: determined Subcategory relationship', { categoryId, subcategoryId });
        } else {
          // If no parent, it's a main Category
          categoryId = initialProduct.categoryId;
          console.log('ProductForm: determined Main Category', { categoryId });
        }
      } else {
        // Fallback if category object is missing (shouldn't happen with correct API)
        categoryId = initialProduct.categoryId || '';
        subcategoryId = initialProduct.subcategoryId || '';
        console.log('ProductForm: fallback logic', { categoryId, subcategoryId });
      }

      const newState = {
        ...defaultProduct,
        ...initialProduct,
        categoryId: categoryId, // Ensure these overwrite initialProduct values
        subcategoryId: subcategoryId,
        visibleTo: initialProduct.visibleTo || [],
        colors: initialProduct.colors || [],
        gst: initialProduct.gst || '',
        mrpPrice: initialProduct.mrpPrice || '',
        generalPrice: initialProduct.generalPrice || '',
        architectPrice: initialProduct.architectPrice || '',
        dealerPrice: initialProduct.dealerPrice || '',
        designNumber: initialProduct.designNumber || '',
        size: initialProduct.size || '',
        thickness: initialProduct.thickness || '',
        brandName: initialProduct.brandName || '',
        warranty: initialProduct.warranty || '',
        isActive: initialProduct.isActive !== false,
        unitType: initialProduct.unitType || 'Per Sheet',
      };

      console.log('ProductForm: setting new state', newState);
      setFormProduct(newState);

      // Deduplicate existing images by filename (last part of URL)
      const uniqueFilenames = new Set();
      const uniqueImages = [];
      const sourceImages = initialProduct.imageUrls && initialProduct.imageUrls.length > 0
        ? initialProduct.imageUrls
        : (initialProduct.images || []);

      sourceImages.forEach(url => {
        if (!url) return;
        const filename = url.split('/').pop();
        if (filename && !uniqueFilenames.has(filename)) {
          uniqueFilenames.add(filename);
          uniqueImages.push(url);
        }
      });
      setExistingImages(uniqueImages);
    } else {
      setFormProduct(defaultProduct);
      setExistingImages([]);
    }
    setSelectedFiles([]);
  }, [initialProduct]);

  useEffect(() => {
    if (formProduct.categoryId) {
      loadSubcategories(formProduct.categoryId);
    } else {
      setSubcategories([]);
      setFormProduct((prev) => ({ ...prev, subcategoryId: '' }));
    }
  }, [formProduct.categoryId]);

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

  const handleChange = (key, value) => {
    setFormProduct((prev) => ({ ...prev, [key]: value }));
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setFormProduct((prev) => ({ ...prev, categoryId: value, subcategoryId: '' }));
  };

  const handleColorsChange = (e) => {
    const value = e.target.value.split(',').map((c) => c.trim()).filter((c) => c);
    setFormProduct((prev) => ({ ...prev, colors: value }));
  };

  const handleIsActiveChange = (e) => {
    setFormProduct((prev) => ({ ...prev, isActive: e.target.value === 'active' }));
  };

  const toggleUserTypeSelection = (userType) => {
    setFormProduct(prev => {
      let newVisibleTo;

      if (userType === 'all') {
        newVisibleTo = prev.visibleTo.includes('all') ? [] : ['all'];
      } else if (prev.visibleTo.includes('all')) {
        newVisibleTo = [userType];
      } else {
        if (prev.visibleTo.includes(userType)) {
          newVisibleTo = prev.visibleTo.filter(item => item !== userType);
        } else {
          newVisibleTo = [...prev.visibleTo, userType];
        }
      }

      return { ...prev, visibleTo: newVisibleTo };
    });
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const existingNames = selectedFiles.map(file => file.name);

    if (isEdit) {
      existingImages.forEach(url => {
        const filename = url.split('/').pop();
        if (filename) existingNames.push(filename);
      });
    }

    const validFiles = files.filter((file) => {
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024;
      const isDuplicate = existingNames.includes(file.name);

      if (!isValidType) {
        handleApiError(new Error(`Invalid file type for ${file.name}`), 'Invalid file');
        return false;
      }
      if (!isValidSize) {
        handleApiError(new Error(`File ${file.name} is too large`), 'Invalid file');
        return false;
      }
      if (isDuplicate) {
        handleApiError(new Error(`File ${file.name} is already selected`), 'Duplicate file');
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }

    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    const existingNames = selectedFiles.map(file => file.name);

    if (isEdit) {
      existingImages.forEach(url => {
        const filename = url.split('/').pop();
        if (filename) existingNames.push(filename);
      });
    }

    const validFiles = files.filter((file) => {
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024;
      const isDuplicate = existingNames.includes(file.name);

      if (!isValidType) {
        handleApiError(new Error(`Invalid file type for ${file.name}`), 'Invalid file');
        return false;
      }
      if (!isValidSize) {
        handleApiError(new Error(`File ${file.name} is too large`), 'Invalid file');
        return false;
      }
      if (isDuplicate) {
        handleApiError(new Error(`File ${file.name} is already selected`), 'Duplicate file');
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const getSelectedUserTypesLabel = () => {
    if (formProduct.visibleTo.length === 0) return "Select Business Types";
    if (formProduct.visibleTo.includes('all')) return "All Business Types";
    return formProduct.visibleTo
      .map(type => userTypeOptions.find(opt => opt.value === type)?.label)
      .join(', ');
  };

  // Updated handleSubmit function with auto-close on success
  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitting(true);

    try {
      console.log('=== Starting Product Form Submission ===');

      // Validation
      const errors = [];

      if (!formProduct.name.trim()) {
        errors.push('Product name is required');
      }

      if (!formProduct.generalPrice) {
        errors.push('General Price is required');
      }

      if (!formProduct.architectPrice) {
        errors.push('Architect Price is required');
      }

      if (!formProduct.dealerPrice) {
        errors.push('Dealer Price is required');
      }

      if (formProduct.visibleTo.length === 0) {
        errors.push('At least one user type must be selected');
      }

      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      const dealerPrice = Number(formProduct.dealerPrice);
      const architectPrice = Number(formProduct.architectPrice);
      const generalPrice = Number(formProduct.generalPrice);
      const gst = Number(formProduct.gst || 0);
      const mrpPrice = Number(formProduct.mrpPrice || 0);

      if (isNaN(dealerPrice) || isNaN(architectPrice) || isNaN(generalPrice) || isNaN(mrpPrice)) {
        throw new Error('Prices must be valid numbers');
      }

      if (gst < 0 || gst > 100) {
        throw new Error('GST must be a number between 0 and 100');
      }

      const formData = new FormData();

      // Add all fields with proper formatting
      formData.append('visibleTo', JSON.stringify(formProduct.visibleTo));

      if (formProduct.categoryId) {
        formData.append('categoryId', formProduct.categoryId);
      }

      formData.append('subcategoryId', formProduct.subcategoryId || '');
      formData.append('name', formProduct.name.trim());
      formData.append('description', formProduct.description?.trim() || '');
      formData.append('brandName', formProduct.brandName?.trim() || '');
      formData.append('designNumber', formProduct.designNumber?.trim() || '');
      formData.append('size', formProduct.size?.trim() || '');
      formData.append('thickness', formProduct.thickness?.trim() || '');
      formData.append('colors', JSON.stringify(formProduct.colors || []));
      formData.append('gst', gst.toString());
      formData.append('mrpPrice', mrpPrice.toString());
      formData.append('generalPrice', generalPrice.toString());
      formData.append('architectPrice', architectPrice.toString());
      formData.append('dealerPrice', dealerPrice.toString());
      formData.append('isActive', formProduct.isActive.toString());
      formData.append('warranty', formProduct.warranty?.trim() || '');
      formData.append('unitType', formProduct.unitType || 'Per Sheet');

      if (isEdit) {
        const keptImages = existingImages.map((url) => url.split('/').pop());
        formData.append('keptImages', JSON.stringify(keptImages));
      }

      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      console.log('FormData to be sent:');
      for (let [key, value] of formData.entries()) {
        if (key === 'images' && value instanceof File) {
          console.log(`  ${key}: File - ${value.name}`);
        } else if (key === 'visibleTo' || key === 'colors' || key === 'keptImages') {
          try {
            console.log(`  ${key}:`, JSON.parse(value));
          } catch (e) {
            console.log(`  ${key}:`, value);
          }
        } else {
          console.log(`  ${key}:`, value);
        }
      }

      console.log('Calling API...');

      let response;
      if (isEdit) {
        response = await updateProduct(initialProduct.id, formData);
      } else {
        response = await createProduct(formData);
      }

      // In handleSubmit function, when API call succeeds:
      console.log('API Response:', response);

      if (!response.success) {
        throw new Error(response.message || 'Failed to save product');
      }

      // Get the full product data from response
      const productData = response.product || {
        ...formProduct,
        id: isEdit ? initialProduct.id : response.productId,
        imageUrls: response.imageUrls || existingImages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Ensure we have category name if available
        category: response.category || formProduct.category,
      };

      console.log('Product data to return:', productData);

      // Call onSuccess with updated product data
      onSuccess(isEdit, productData);

      // Auto-close the form after successful submission
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 500); // Small delay to show success message
      }

    } catch (error) {
      console.error('Form submission error:', error);
      handleApiError(error, isEdit ? 'Failed to update product' : 'Failed to create product');
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-roboto">
      {/* Enhanced User Type Dropdown */}
      <div className="relative">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Visible To Business Types <span className="text-red-500">*</span>
        </label>
        <div
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto flex justify-between items-center cursor-pointer"
          onClick={() => setShowUserTypeDropdown(!showUserTypeDropdown)}
        >
          <span className={formProduct.visibleTo.length === 0 ? "text-gray-400" : ""}>
            {getSelectedUserTypesLabel()}
          </span>
          <ChevronDown size={16} className={`transform transition-transform ${showUserTypeDropdown ? 'rotate-180' : ''}`} />
        </div>

        {showUserTypeDropdown && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
            {userTypeOptions.map((option) => (
              <div
                key={option.value}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => toggleUserTypeSelection(option.value)}
              >
                <div className={`w-5 h-5 border rounded mr-2 flex items-center justify-center ${formProduct.visibleTo.includes(option.value) ? 'bg-primary border-primary' : 'border-gray-300'
                  }`}>
                  {formProduct.visibleTo.includes(option.value) && (
                    <Check size={14} className="text-white" />
                  )}
                </div>
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Category</label>
          <select
            value={formProduct.categoryId}
            onChange={handleCategoryChange}
            className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Subcategory</label>
          <select
            value={formProduct.subcategoryId}
            onChange={(e) => handleChange('subcategoryId', e.target.value)}
            className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
            disabled={!formProduct.categoryId}
          >
            <option value="">
              {isEdit && !formProduct.subcategoryId && formProduct.categoryId
                ? "Select Subcategory (current subcategory not available)"
                : "Select Subcategory"}
            </option>
            {subcategories.map((subcat) => (
              <option key={subcat.id} value={subcat.id}>{subcat.name}</option>
            ))}
          </select>
          {isEdit && !formProduct.subcategoryId && formProduct.categoryId && (
            <p className="mt-1 text-xs text-amber-600">
              Note: Current subcategory information is not available. Please re-select if needed.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formProduct.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
          required
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={formProduct.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Brand Name</label>
        <select
          value={formProduct.brandName}
          onChange={(e) => handleChange('brandName', e.target.value)}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
        >
          <option value="">Select Brand Name</option>
          <option value="Ratan Decor">Ratan Decor</option>
          <option value="Elite Designs">Elite Designs</option>
          <option value="Premium Tiles">Premium Tiles</option>
          <option value="Classic Marble">Classic Marble</option>
          <option value="Modern Stone">Modern Stone</option>
        </select>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Design Number</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={formProduct.designNumber}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '' || /^\d+$/.test(value)) {
              handleChange('designNumber', value);
            }
          }}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Size</label>
        <input
          type="text"
          value={formProduct.size}
          onChange={(e) => handleChange('size', e.target.value)}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Thickness</label>
        <input
          type="text"
          value={formProduct.thickness}
          onChange={(e) => handleChange('thickness', e.target.value)}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Colors</label>
        <input
          type="text"
          placeholder="Enter colors (comma-separated)"
          value={formProduct.colors.join(', ')}
          onChange={handleColorsChange}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">GST (%)</label>
        <input
          type="number"
          step="0.01"
          value={formProduct.gst}
          onChange={(e) => handleChange('gst', e.target.value)}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">MRP Price (₹)</label>
          <input
            type="number"
            step="0.01"
            value={formProduct.mrpPrice}
            onChange={(e) => handleChange('mrpPrice', e.target.value)}
            className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            General Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={formProduct.generalPrice}
            onChange={(e) => handleChange('generalPrice', e.target.value)}
            className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
            required
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Architect Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={formProduct.architectPrice}
            onChange={(e) => handleChange('architectPrice', e.target.value)}
            className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
            required
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Dealer Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={formProduct.dealerPrice}
            onChange={(e) => handleChange('dealerPrice', e.target.value)}
            className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
            required
          />
        </div>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Unit Type</label>
        <select
          value={formProduct.unitType}
          onChange={(e) => handleChange('unitType', e.target.value)}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
        >
          <option value="Per Sheet">Per Sheet</option>
          <option value="Per Square Feet">Per Square Feet</option>
        </select>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Product Images</label>
        <div
          className={`p-6 rounded-lg border-2 border-dashed ${isDragOver ? 'border-primary bg-primary/10' : 'border-gray-300'}`}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setIsDragOver(true)}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className="mx-auto w-12 h-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor={isEdit ? 'edit-file-upload' : 'file-upload'} className="cursor-pointer">
                <span className="block mt-2 text-sm font-medium text-gray-900">
                  Click to upload or drag and drop {isEdit ? 'new ' : ''}images
                </span>
                <input
                  id={isEdit ? 'edit-file-upload' : 'file-upload'}
                  name={isEdit ? 'edit-file-upload' : 'file-upload'}
                  type="file"
                  className="sr-only"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
            </div>
          </div>
        </div>

        {isEdit && existingImages.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium text-gray-900">Existing Images:</h4>
            <div className="flex flex-wrap gap-2">
              {existingImages.map((url, index) => (
                <div key={index} className="relative">
                  <img src={getImageUrl(url)} alt={`Product ${index}`} className="w-24 h-24 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium text-gray-900">Newly Selected Files:</h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Status</label>
        <select
          value={formProduct.isActive ? 'active' : 'inactive'}
          onChange={handleIsActiveChange}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent font-roboto"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex pt-4 space-x-3 border-t border-gray-200">
        <button
          type="submit"
          disabled={submitting || isSubmitting}
          className="px-6 py-2 text-white rounded-lg bg-primary hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting || isSubmitting ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Product' : 'Add Product')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProductForm;