import React from 'react';

// CategoryList Component
const CategoryList = ({
  categories,
  subcategories,
  selectedCategory,
  setSelectedCategory,
  loading,
  error,
  isAdminOrManager,
  showCreateForm,
  setShowCreateForm,
  newCategoryName,
  setNewCategoryName,
  newCategoryImage,
  newCategoryImagePreview,
  newSubcategoryName,
  setNewSubcategoryName,
  editCategoryId,
  editCategoryName,
  setEditCategoryName,
  editCategoryImage,
  editCategoryImagePreview,
  editCategoryIsSubcategory,
  nameError,
  isFormValid,
  isSubcategoryFormValid,
  isEditFormValid,
  operationLoading,
  pagination,
  handleImageSelect,
  handleImageDrop,
  clearImage,
  handleCreateCategory,
  handleCreateSubcategory,
  handleUpdateCategory,
  handleDeleteCategory,
  startEdit,
  cancelEdit,
  fetchCategories,
  fetchSubcategories,
}) => {
  const LoadingSpinner = ({ text = "Loading..." }) => (
    <div className="flex justify-center items-center py-12">
      <div className="relative">
        <div className="w-8 h-8 border-4 border-neutral-200 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
      <span className="ml-3 text-sm font-medium text-neutral-600">{text}</span>
    </div>
  );

  const ErrorMessage = ({ message, onRetry }) => (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-sm font-medium text-red-800">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 px-4 py-1.5 text-sm font-medium text-primary bg-white border border-primary rounded-lg hover:bg-primary/5 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const ImageUploadSection = ({ 
    image, 
    preview, 
    onSelect, 
    onDrop, 
    onClear, 
    isEdit = false,
    disabled = false,
    label = "Category Image"
  }) => {
    const handleDragOver = (e) => {
      e.preventDefault();
      if (!disabled) e.currentTarget.classList.add('border-primary', 'bg-primary/5');
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) onDrop(file, isEdit);
    };

    return (
      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-2">{label}</label>
        {preview ? (
          <div className="relative w-full h-64 border-2 border-neutral-200 rounded-lg overflow-hidden">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-md"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
          >
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => onSelect(e, isEdit)}
              disabled={disabled}
              className="hidden"
              id={isEdit ? "edit-category-image" : "new-category-image"}
            />
            <label htmlFor={isEdit ? "edit-category-image" : "new-category-image"} className="cursor-pointer">
              <svg className="mx-auto w-12 h-12 text-neutral-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-neutral-700">Click or drag and drop to upload</p>
              <p className="text-xs text-neutral-500 mt-1">JPEG, PNG, WebP (max 5MB)</p>
            </label>
          </div>
        )}
        <p className="mt-2 text-xs text-neutral-500">
          {isEdit && !preview ? 'Leave empty to keep existing image' : 'Optional'}
        </p>
      </div>
    );
  };

  const CategoryItem = ({ category, onSelect, onEdit, onDelete, isSelected = false, showActions = true }) => (
    <div className={`group p-5 rounded-xl border-2 transition-all duration-300 ${
      isSelected 
        ? 'border-primary bg-primary/5 shadow-md' 
        : 'border-neutral-200 bg-white hover:border-primary hover:shadow-sm'
    }`}>
      <div className="flex items-start justify-between">
        <button onClick={() => onSelect(category)} className="flex-grow text-left">
          <div className="flex items-center gap-4">
            {category.imageUrl ? (
              <img src={category.imageUrl} alt={category.name} className="w-14 h-14 rounded-lg object-cover border border-neutral-200" />
            ) : (
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div>
              <h3 className={`text-lg font-semibold ${isSelected ? 'text-primary' : 'text-neutral-900'} transition-colors`}>
                {category.name}
              </h3>
              {category.isSubcategory && (
                <span className="inline-block mt-1 px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
                  Subcategory
                </span>
              )}
            </div>
          </div>

          {/* STRUCTURE (Subcategories) - Primary Color */}
          {/* INVENTORY (Products) - Green Color */}
          <div className="mt-4 flex gap-8 text-sm">
            <div className="flex items-center gap-2 text-primary font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <span>{category.subcategoryCount ?? 0} Subcategories</span>
            </div>

            <div className="flex items-center gap-2 text-green-600 font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              <span>{category.productCount ?? 0} Products</span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {!category.isSubcategory && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(category); }}
              className="p-2 text-neutral-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="View subcategories"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {showActions && isAdminOrManager && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(category); }}
                disabled={operationLoading[`update-${category.id}`]}
                className="p-2 text-neutral-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                {operationLoading[`update-${category.id}`] ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(category.id, category.name); }}
                disabled={operationLoading[`delete-${category.id}`]}
                className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                {operationLoading[`delete-${category.id}`] ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2v1a3 3 0 003 3h2a3 3 0 003-3V3a2 2 0 012 2v6.993A1 1 0 0117 13H3a1 1 0 01-1-.007V5zM3 13a2 2 0 002 2h10a2 2 0 002-2H3z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const EditForm = ({ category, onSave, onCancel }) => (
    <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        Edit {category.isSubcategory ? 'Subcategory' : 'Category'}
      </h3>
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-2">Name</label>
          <input
            type="text"
            value={editCategoryName}
            onChange={(e) => setEditCategoryName(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium text-neutral-900 transition-all"
            disabled={operationLoading[`update-${editCategoryId}`]}
          />
        </div>

        {!editCategoryIsSubcategory && (
          <ImageUploadSection
            image={editCategoryImage}
            preview={editCategoryImagePreview}
            onSelect={handleImageSelect}
            onDrop={handleImageDrop}
            onClear={() => clearImage(true)}
            isEdit={true}
            disabled={operationLoading[`update-${editCategoryId}`]}
          />
        )}

        {editCategoryIsSubcategory && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">ℹ️ Subcategories do not support images.</p>
          </div>
        )}

        {nameError && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {nameError}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={operationLoading[`update-${editCategoryId}`]}
            className="flex-1 py-3 bg-neutral-100 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={operationLoading[`update-${editCategoryId}`] || !isEditFormValid}
            className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60"
          >
            {operationLoading[`update-${editCategoryId}`] ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Category Management</h1>
        <p className="mt-2 text-neutral-600">Organize and manage your product categories efficiently</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchCategories} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Categories Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-primary to-primary/90 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Main Categories</h2>
                <p className="mt-1 text-white/90">Manage your primary categories</p>
              </div>
              {isAdminOrManager && (
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="px-5 py-2.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors font-medium"
                >
                  {showCreateForm ? 'Cancel' : 'Add Category'}
                </button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-5 max-h-[700px] overflow-y-auto">
            {isAdminOrManager && showCreateForm && (
              <div className="p-5 bg-primary/5 border-2 border-primary/20 rounded-xl">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Create New Category</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-2">Category Name</label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium text-neutral-900 transition-all"
                      disabled={operationLoading['create-category']}
                    />
                  </div>

                  <ImageUploadSection
                    image={newCategoryImage}
                    preview={newCategoryImagePreview}
                    onSelect={handleImageSelect}
                    onDrop={handleImageDrop}
                    onClear={() => clearImage(false)}
                    disabled={operationLoading['create-category']}
                  />

                  {nameError && (
                    <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      {nameError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewCategoryName('');
                        clearImage(false);
                      }}
                      disabled={operationLoading['create-category']}
                      className="flex-1 py-3 bg-neutral-100 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateCategory}
                      disabled={operationLoading['create-category'] || !isFormValid}
                      className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60"
                    >
                      {operationLoading['create-category'] ? 'Creating...' : 'Create Category'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading && !categories.length ? (
              <LoadingSpinner text="Loading categories..." />
            ) : categories.length ? (
              categories.map(category => (
                <div key={category.id}>
                  {editCategoryId === category.id ? (
                    <EditForm category={category} onSave={handleUpdateCategory} onCancel={cancelEdit} />
                  ) : (
                    <CategoryItem
                      category={category}
                      onSelect={setSelectedCategory}
                      onEdit={startEdit}
                      onDelete={handleDeleteCategory}
                      isSelected={selectedCategory?.id === category.id}
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <svg className="mx-auto w-20 h-20 text-neutral-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xl font-semibold text-neutral-700 mb-2">No Categories Yet</h3>
                <p className="text-neutral-500 mb-6">Start by creating your first category</p>
                {isAdminOrManager && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Create Category
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Subcategories Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <h2 className="text-2xl font-bold">Subcategories</h2>
            <p className="mt-1 text-white/90">
              {selectedCategory ? `Under "${selectedCategory.name}"` : 'Select a category to view subcategories'}
            </p>
          </div>

          <div className="p-6 space-y-5 max-h-[700px] overflow-y-auto">
            {selectedCategory ? (
              <>
                {isAdminOrManager && (
                  <div className="p-5 bg-green-50 border-2 border-green-200 rounded-xl">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">Create New Subcategory</h3>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-5">
                      <p className="text-sm text-blue-800">ℹ️ Subcategories do not support images.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-2">Subcategory Name</label>
                      <input
                        type="text"
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        placeholder="Enter subcategory name"
                        className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-medium text-neutral-900 transition-all"
                        disabled={operationLoading['create-subcategory']}
                      />
                    </div>

                    {nameError && (
                      <div className="mt-4 flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {nameError}
                      </div>
                    )}

                    <div className="flex gap-3 mt-5">
                      <button
                        type="button"
                        onClick={() => setNewSubcategoryName('')}
                        disabled={operationLoading['create-subcategory']}
                        className="flex-1 py-3 bg-neutral-100 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-200 transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleCreateSubcategory}
                        disabled={operationLoading['create-subcategory'] || !isSubcategoryFormValid}
                        className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60"
                      >
                        {operationLoading['create-subcategory'] ? 'Creating...' : 'Create Subcategory'}
                      </button>
                    </div>
                  </div>
                )}

                {loading && !subcategories.length ? (
                  <LoadingSpinner text="Loading subcategories..." />
                ) : subcategories.length ? (
                  <>
                    {subcategories.map(subcategory => (
                      <div key={subcategory.id}>
                        {editCategoryId === subcategory.id ? (
                          <EditForm category={subcategory} onSave={handleUpdateCategory} onCancel={cancelEdit} />
                        ) : (
                          <CategoryItem category={subcategory} onEdit={startEdit} onDelete={handleDeleteCategory} />
                        )}
                      </div>
                    ))}

                    {pagination.totalPages > 1 && (
                      <div className="flex justify-center gap-3 pt-6 border-t border-neutral-200">
                        <button
                          onClick={() => fetchSubcategories(selectedCategory.id, pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1 || loading}
                          className="px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                        >
                          Previous
                        </button>
                        <span className="flex items-center px-4 py-2.5 text-sm font-medium text-neutral-700">
                          Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        <button
                          onClick={() => fetchSubcategories(selectedCategory.id, pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.totalPages || loading}
                          className="px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16">
                    <svg className="mx-auto w-20 h-20 text-neutral-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-neutral-700 mb-2">No Subcategories</h3>
                    <p className="text-neutral-500">This category doesn't have any subcategories yet</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <svg className="mx-auto w-20 h-20 text-neutral-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xl font-semibold text-neutral-700 mb-2">Select a Category</h3>
                <p className="text-neutral-500">Choose a main category from the left to view its subcategories</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryList;