import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import {
  getCategories,
  getSubCategories,
  createCategory,
  createSubCategory,
  updateCategory,
  deleteCategory,
  isAuthenticated,
  getCurrentUser,
  deleteCategoryWithProductMove,
  getCategoriesForSelection,
  prepareCategoryFormData,
  validateCategoryData,
} from '../../services/Api';

// CategoryModals Component
const CategoryModals = ({
  showCategorySelector,
  setShowCategorySelector,
  categoryToDelete,
  setCategoryToDelete,
  availableCategories,
  setAvailableCategories,
  handleCategorySelection,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const handleClose = () => {
    setSelectedCategoryId('');
    setShowCategorySelector(false);
    setCategoryToDelete(null);
    setAvailableCategories([]);
  };

  const handleSelect = (categoryId) => {
    handleCategorySelection(categoryId);
    setSelectedCategoryId('');
  };

  if (!showCategorySelector || !categoryToDelete) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl animate-slide-up">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Move {categoryToDelete.activeProductsCount} Products from "{categoryToDelete.name}"
          </h3>
          <p className="text-gray-600">
            Select a target category to move the products to before deletion:
          </p>
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Target Category
          </label>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-red-100 transition-colors duration-200"
          >
            <option value="">Select a category</option>
            {availableCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.fullName} ({cat.productCount} products)
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Products will be moved to the selected category before deletion
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSelect(selectedCategoryId)}
            disabled={!selectedCategoryId}
            className="px-6 py-2 text-white bg-primary rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            Move and Delete
          </button>
        </div>
      </div>
    </div>
  );
};


export default CategoryModals;