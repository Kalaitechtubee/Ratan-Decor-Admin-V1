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
  // UI Components
  const LoadingSpinner = ({ text = "Loading..." }) => (
    <div className="flex justify-center items-center p-6 animate-fade-in-left">
      <div className="relative">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
      <span className="ml-3 text-gray-600 font-medium font-roboto">{text}</span>
    </div>
  );

  const ErrorMessage = ({ message, onRetry }) => (
    <div className="p-4 bg-red-50 rounded-lg border-l-4 border-primary animate-fade-in-left">
      <div className="flex items-start">
        <svg className="mr-3 mt-0.5 w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div className="flex-grow">
          <span className="text-red-800 font-medium font-roboto">{message}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="block mt-2 px-3 py-1 text-sm text-primary bg-white rounded border border-primary hover:bg-red-50 transition-colors duration-200 font-roboto"
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
      if (!disabled) {
        e.currentTarget.classList.add('border-primary', 'bg-red-50');
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove('border-primary', 'bg-red-50');
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove('border-primary', 'bg-red-50');
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        onDrop(file, isEdit);
      }
    };

    return (
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
        {preview ? (
          <div className="relative w-full h-48 border-2 border-gray-300 rounded-lg overflow-hidden">
            <img 
              src={preview} 
              alt="Category preview" 
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
              title="Remove image"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => onSelect(e, isEdit)}
              disabled={disabled}
              className="hidden"
              id={isEdit ? "edit-category-image" : "new-category-image"}
            />
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <label
                htmlFor={isEdit ? "edit-category-image" : "new-category-image"}
                className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
              >
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-gray-500">Click or drag and drop to upload image</p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP (max 5MB)</p>
              </label>
            </div>
          </div>
        )}
        <p className="mt-2 text-xs text-gray-500">
          {isEdit && !preview ? 'Leave empty to keep existing image' : 'Optional: Add a category image'}
        </p>
      </div>
    );
  };

  const CategoryItem = ({ category, onSelect, onEdit, onDelete, isSelected = false, showActions = true }) => (
    <div className={`group p-4 border-2 rounded-lg transition-all duration-200 animate-fade-in-left ${
      isSelected 
        ? 'bg-red-50 border-primary shadow-md' 
        : 'border-gray-200 hover:border-primary hover:shadow-sm bg-white'
    }`}>
      <div className="flex justify-between items-start">
        <button
          onClick={() => onSelect(category)}
          className="flex-grow text-left"
        >
          <div className="flex items-center space-x-3">
            {category.imageUrl ? (
              <img 
                src={category.imageUrl} 
                alt={category.name}
                className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200"
              />
            ) : (
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-red-100 group-hover:text-primary'} transition-colors duration-200`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div>
              <h3 className={`font-semibold text-lg ${isSelected ? 'text-primary' : 'text-gray-800 group-hover:text-primary'} transition-colors duration-200 font-roboto`}>
                {category.name}
              </h3>
              {category.isSubcategory && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary bg-red-100 rounded-full font-roboto mt-1">
                  Subcategory
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center mt-3 space-x-6 text-sm text-gray-600 font-roboto">
            {typeof category.productCount !== 'undefined' && (
              <div className="flex items-center">
                <svg className="mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                <span className="font-medium">{category.productCount}</span> products
              </div>
            )}
            {typeof category.subcategoryCount !== 'undefined' && (
              <div className="flex items-center">
                <svg className="mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                <span className="font-medium">{category.subcategoryCount}</span> subcategories
              </div>
            )}
          </div>
        </button>
        <div className="flex ml-4 space-x-1">
          {/* Eye icon - Always visible for main categories */}
          {!category.isSubcategory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(category);
              }}
              className="p-2 text-gray-500 rounded-lg hover:text-primary hover:bg-red-50 transition-colors duration-200"
              title="View subcategories"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          {/* Edit and Delete icons - Show on hover if user has permissions */}
          {showActions && isAdminOrManager && (
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => onEdit(category)}
                disabled={operationLoading[`update-${category.id}`]}
                className="p-2 text-gray-500 rounded-lg hover:text-primary hover:bg-red-50 transition-colors duration-200 disabled:opacity-50"
                title="Edit category"
              >
                {operationLoading[`update-${category.id}`] ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => onDelete(category.id, category.name)}
                disabled={operationLoading[`delete-${category.id}`]}
                className="p-2 text-gray-500 rounded-lg hover:text-primary hover:bg-red-50 transition-colors duration-200 disabled:opacity-50"
                title="Delete category"
              >
                {operationLoading[`delete-${category.id}`] ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
    <form onSubmit={onSave} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400 animate-fade-in-left">
      <div className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 font-roboto">
            Edit {category.parentId ? 'Subcategory' : 'Category'} Name
          </label>
          <input
            type="text"
            value={editCategoryName}
            onChange={(e) => setEditCategoryName(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-red-100 transition-colors duration-200 font-roboto"
            placeholder="Category name"
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
            label="Category Image"
          />
        )}
        {editCategoryIsSubcategory && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ Subcategories cannot have images. Only main categories support image uploads.
            </p>
          </div>
        )}
        {nameError && (
          <div className="flex items-center p-2 text-sm text-red-700 bg-red-100 rounded-lg font-roboto">
            <svg className="mr-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {nameError}
          </div>
        )}
        <div className="flex space-x-3">
          <button
            type="submit"
            className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium font-roboto"
            disabled={operationLoading[`update-${editCategoryId}`] || !isEditFormValid}
          >
            {operationLoading[`update-${editCategoryId}`] ? (
              <div className="flex items-center">
                <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 transition-colors duration-200 font-medium font-roboto"
            disabled={operationLoading[`update-${editCategoryId}`]}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <>
      <div className="mb-8 animate-fade-in-left">
        <h1 className="mb-3 text-4xl font-bold text-gray-800">Category Management</h1>
        <p className="text-lg text-gray-600">Organize and manage your product categories efficiently</p>
      </div>

      {error && (
        <div className="mb-6 animate-fade-in-left">
          <ErrorMessage 
            message={error} 
            onRetry={() => fetchCategories()}
          />
        </div>
      )}

      <div className="flex flex-row gap-6">
        {/* Main Categories Panel */}
        <div className="flex-1 bg-white rounded-xl shadow-lg border animate-fade-in-left">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary to-red-600 text-white rounded-t-xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Main Categories</h2>
                <p className="mt-1 opacity-90">Manage your primary categories</p>
              </div>
              {isAdminOrManager && (
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="px-4 py-2 text-white bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200 font-medium"
                >
                  {showCreateForm ? 'Cancel' : 'Add Category'}
                </button>
              )}
            </div>
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {isAdminOrManager && showCreateForm && (
              <form onSubmit={handleCreateCategory} className="p-4 mb-6 bg-red-50 rounded-lg border-2 border-red-200 animate-fade-in-left">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Create New Category</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Category Name</label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-red-100 transition-colors duration-200"
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
                    <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 rounded-lg">
                      <svg className="mr-2 w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      {nameError}
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="px-6 py-2 text-white bg-primary rounded-lg hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                      disabled={operationLoading['create-category'] || !isFormValid}
                    >
                      {operationLoading['create-category'] ? (
                        <div className="flex items-center">
                          <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating...
                        </div>
                      ) : (
                        'Create Category'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewCategoryName('');
                        clearImage(false);
                      }}
                      className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                      disabled={operationLoading['create-category']}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
            <div className="space-y-4">
              {loading && !categories.length ? (
                <LoadingSpinner text="Loading categories..." />
              ) : categories.length ? (
                categories.map(category => (
                  <div key={category.id}>
                    {editCategoryId === category.id ? (
                      <EditForm
                        category={category}
                        onSave={handleUpdateCategory}
                        onCancel={cancelEdit}
                      />
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
                <div className="py-12 text-center">
                  <svg className="mx-auto mb-4 w-20 h-20 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Categories Found</h3>
                  <p className="text-gray-500 mb-4">Start by creating your first category</p>
                  {isAdminOrManager && (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="px-6 py-2 text-white bg-primary rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
                    >
                      Create Category
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subcategories Panel */}
        <div className="flex-1 bg-white rounded-xl shadow-lg border animate-fade-in-left">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-xl">
            <div>
              <h2 className="text-2xl font-bold">
                {selectedCategory ? `Subcategories` : 'Subcategories'}
              </h2>
              <p className="mt-1 opacity-90">
                {selectedCategory ? `Under "${selectedCategory.name}"` : 'Select a category to view subcategories'}
              </p>
            </div>
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {selectedCategory ? (
              <>
                {isAdminOrManager && (
                  <form onSubmit={handleCreateSubcategory} className="p-4 mb-6 bg-green-50 rounded-lg border-2 border-green-200 animate-fade-in-left">
                    <h3 className="mb-4 text-lg font-semibold text-gray-800">Create New Subcategory</h3>
                    <div className="p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        ℹ️ Subcategories cannot have images. Only main categories support image uploads.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                          Subcategory Name (under "{selectedCategory.name}")
                        </label>
                        <input
                          type="text"
                          value={newSubcategoryName}
                          onChange={(e) => setNewSubcategoryName(e.target.value)}
                          placeholder="Enter subcategory name"
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-colors duration-200"
                          disabled={operationLoading['create-subcategory']}
                        />
                      </div>

                      {nameError && (
                        <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 rounded-lg">
                          <svg className="mr-2 w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          {nameError}
                        </div>
                      )}
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                          disabled={operationLoading['create-subcategory'] || !isSubcategoryFormValid}
                        >
                          {operationLoading['create-subcategory'] ? (
                            <div className="flex items-center">
                              <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Creating...
                            </div>
                          ) : (
                            'Create Subcategory'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewSubcategoryName('');
                          }}
                          className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                          disabled={operationLoading['create-subcategory']}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </form>
                )}
                <div className="space-y-4">
                  {loading && !subcategories.length ? (
                    <LoadingSpinner text="Loading subcategories..." />
                  ) : subcategories.length ? (
                    <>
                      {subcategories.map(subcategory => (
                        <div key={subcategory.id}>
                          {editCategoryId === subcategory.id ? (
                            <EditForm
                              category={subcategory}
                              onSave={handleUpdateCategory}
                              onCancel={cancelEdit}
                            />
                          ) : (
                            <CategoryItem
                              category={subcategory}
                              onSelect={setSelectedCategory}
                              onEdit={startEdit}
                              onDelete={handleDeleteCategory}
                            />
                          )}
                        </div>
                      ))}
                      {pagination.totalPages > 1 && (
                        <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
                          <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                            <span className="font-medium">Page {pagination.currentPage} of {pagination.totalPages}</span>
                            <span className="mx-2">•</span>
                            <span>{pagination.totalItems} total items</span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => fetchSubcategories(selectedCategory.id, pagination.currentPage - 1)}
                              disabled={pagination.currentPage === 1 || loading}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50 transition-colors duration-200"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => fetchSubcategories(selectedCategory.id, pagination.currentPage + 1)}
                              disabled={pagination.currentPage === pagination.totalPages || loading}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50 transition-colors duration-200"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-12 text-center">
                      <svg className="mx-auto mb-4 w-20 h-20 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No Subcategories</h3>
                      <p className="text-gray-500 mb-4">This category doesn't have any subcategories yet</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <svg className="mx-auto mb-4 w-20 h-20 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Category</h3>
                <p className="text-gray-500">Choose a category from the left panel to view its subcategories</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryList;