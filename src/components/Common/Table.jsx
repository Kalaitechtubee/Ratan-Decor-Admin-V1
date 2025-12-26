import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

function Table({
  data,
  columns,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  pagination,
  loading = false
}) {
  const [clickedRowId, setClickedRowId] = useState(null);
  const [clickTimeout, setClickTimeout] = useState(null);

  const { currentPage = 1, totalPages = 1, totalItems = 0, onPageChange, itemsPerPage = 10 } = pagination || {};

  const handleSort = (key) => {
    if (onSort) {
      onSort(key);
    }
  };

  const handleRowClick = (item, e) => {
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }

    if (clickedRowId === item.id) return;

    setClickedRowId(item.id);

    if (onRowClick) {
      onRowClick(item);
    }

    if (clickTimeout) clearTimeout(clickTimeout);
    const timeout = setTimeout(() => {
      setClickedRowId(null);
    }, 500);
    setClickTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 3;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 1);
      let endPage = startPage + maxVisible - 1;

      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisible + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden font-roboto">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 border-t border-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden font-roboto">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp
                          size={12}
                          className={`${sortBy === column.key && sortOrder === 'asc'
                              ? 'text-primary'
                              : 'text-gray-400'
                            }`}
                        />
                        <ChevronDown
                          size={12}
                          className={`${sortBy === column.key && sortOrder === 'desc'
                              ? 'text-primary'
                              : 'text-gray-400'
                            }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr
                key={item.id}
                className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                  } ${clickedRowId === item.id ? 'opacity-50' : ''}`}
                onClick={(e) => onRowClick && handleRowClick(item, e)}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render
                      ? column.render(item[column.key], item)
                      : String(item[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Pagination Design */}
      {totalPages > 0 && (
        <div className="bg-white px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            {/* Left side - Showing text */}
            <div className="text-sm text-gray-700">
              Showing {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
            </div>

            {/* Right side - Pagination controls */}
            <div className="flex items-center space-x-2">
              {/* Previous button */}
              <button
                onClick={() => onPageChange && onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page numbers */}
              {generatePageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-3 py-2 text-gray-500"
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={page}
                    onClick={() => onPageChange && onPageChange(page)}
                    className={`min-w-[40px] px-3 py-2 rounded border text-sm font-medium transition-colors ${currentPage === page
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}

              {/* Next button */}
              <button
                onClick={() => onPageChange && onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;