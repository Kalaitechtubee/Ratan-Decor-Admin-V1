import React, { useState } from 'react';
import { Layout, Move, AlertTriangle } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-yellow-100 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Relocate Products
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Category "<span className="font-semibold text-gray-700">{categoryToDelete.name}</span>" has <span className="font-bold text-primary">{categoryToDelete.activeProductsCount}</span> active products. Please select a target category to move them to before deletion.
            </p>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Target Category
          </label>
          <div className="relative">
            <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none text-gray-900"
            >
              <option value="">Choose a destination...</option>
              {availableCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.fullName} ({cat.productCount} items)
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Move className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-3.5 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-roboto"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSelect(selectedCategoryId)}
            disabled={!selectedCategoryId}
            className="flex-1 px-6 py-3.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 font-roboto"
          >
            Relocate & Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModals;
