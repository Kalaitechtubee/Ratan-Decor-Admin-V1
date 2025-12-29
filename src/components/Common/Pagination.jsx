import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPaginationPages } from './paginationLogic';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (!totalPages || totalPages <= 1) return null;

  const pages = getPaginationPages(currentPage, totalPages);
  const showEllipsisLeft = totalPages > 3 && currentPage > 2;
  const showEllipsisRight = totalPages > 3 && currentPage < totalPages - 1;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t">

      {/* Left info */}
      <p className="text-sm text-gray-500">
        Page <span className="font-semibold">{currentPage}</span> of{' '}
        <span className="font-semibold">{totalPages}</span>
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">

        {/* First */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-100"
        >
          First
        </button>

        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border rounded-lg disabled:opacity-40 hover:bg-gray-100"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Left dots */}
        {showEllipsisLeft && (
          <span className="px-2 text-gray-400">...</span>
        )}

        {/* Page Numbers (MAX 3) */}
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 text-sm rounded-lg border transition
              ${page === currentPage
                ? 'bg-primary text-white border-primary'
                : 'hover:bg-gray-100'
              }
            `}
          >
            {page}
          </button>
        ))}

        {/* Right dots */}
        {showEllipsisRight && (
          <span className="px-2 text-gray-400">...</span>
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 border rounded-lg disabled:opacity-40 hover:bg-gray-100"
        >
          <ChevronRight size={16} />
        </button>

        {/* Last */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-100"
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default Pagination;
