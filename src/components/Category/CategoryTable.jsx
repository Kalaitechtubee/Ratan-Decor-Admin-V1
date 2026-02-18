import React from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit2,
  Trash2,
  ImageIcon,
  Package,
  Layers,
  Layout,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const CategoryTable = ({
  items,
  loading,
  error,
  isAdminOrManager,
  sortConfig,
  selectedItems,
  setSelectedItems,
  onSort,
  onEdit,
  onDelete,
  onViewSubcategories,
  operationLoading,
  type
}) => {

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="text-gray-400" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />;
  };

  const calculateTotalProductCount = (item) => {
    let total = item.productCount || 0;
    if (type === 'category' && item.subCategories) {
      total += item.subCategories.reduce((sum, sub) => sum + (sub.productCount || 0), 0);
    }
    return total;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-500 font-medium">Loading {type}s...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-100 p-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-200" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Error loading {type}s</h3>
        <p className="mt-2 text-gray-500">{error}</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="mx-auto h-16 w-16 text-gray-200 flex items-center justify-center bg-gray-50 rounded-full mb-4">
          {type === 'category' ? <Layout size={32} /> : <Layers size={32} />}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">No {type}s found</h3>
        <p className="mt-2 text-gray-500 max-w-xs mx-auto">
          {type === 'category' ? 'Get started by creating your first category to organize your products.' : 'Select a parent category to view and manage its subcategories.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th
                className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center space-x-2">
                  <span>{type} Name</span>
                  {getSortIcon('name')}
                </div>
              </th>

              {type === 'category' && (
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Structure
                </th>
              )}

              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Inventory
              </th>

              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id} className="group hover:bg-red-50/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                      {item.imageUrl ? (
                        <img
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                          src={item.imageUrl}
                          alt={item.name}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-300 bg-gray-50">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-400">ID: {item.id}</div>
                    </div>
                  </div>
                </td>

                {type === 'category' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <Layers size={14} className="mr-1.5 text-gray-400" />
                      <span className="font-bold text-gray-500">{item.subCategories?.length || 0}</span>
                      <span className="ml-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Subcategories</span>
                    </div>
                  </td>
                )}

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-600">
                    <Package size={14} className="mr-1.5 text-gray-400" />
                    <span className="font-bold text-gray-500">{calculateTotalProductCount(item)}</span>
                    <span className="ml-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Products</span>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end items-center gap-1 opacity-100">
                    {type === 'category' && (
                      <button
                        onClick={() => onViewSubcategories(item)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View Subcategories"
                      >
                        <Eye size={18} />
                      </button>
                    )}

                    {isAdminOrManager && (
                      <>
                        <button
                          onClick={() => onEdit(item)}
                          disabled={operationLoading[`update-${item.id}`]}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => onDelete(item.id, item.name)}
                          disabled={operationLoading[`delete-${item.id}`]}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          {operationLoading[`delete-${item.id}`] ? (
                            <RefreshCw size={18} className="animate-spin text-red-600" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing <span className="font-bold text-gray-700">{items.length}</span> {type}{items.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center">
            <Package size={12} className="mr-1" />
            Total inventory: <span className="ml-1 font-bold text-gray-700">
              {items.reduce((sum, item) => sum + calculateTotalProductCount(item), 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryTable;