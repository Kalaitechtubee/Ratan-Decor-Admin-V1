import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  const getMiddlePages = () => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Near start
    if (currentPage <= 2) {
      return [1, 2, 3];
    }

    // Near end
    if (currentPage >= totalPages - 1) {
      return [totalPages - 2, totalPages - 1, totalPages];
    }

    // Middle
    return [currentPage - 1, currentPage, currentPage + 1];
  };

  const pages = getMiddlePages();

  return (
    <div className="flex items-center justify-center gap-2 mt-6 select-none">

      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-md border transition
          ${currentPage === 1
            ? 'text-gray-400 border-gray-200 cursor-not-allowed'
            : 'text-primary border-primary/30 hover:bg-primary/10'
          }`}
      >
        <FaChevronLeft />
      </button>

      {/* First page */}
      {pages[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-1 rounded-md border border-primary/30 text-primary hover:bg-primary/10"
          >
            1
          </button>
          <span className="text-gray-400">…</span>
        </>
      )}

      {/* Middle (ONLY 3 NUMBERS) */}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-1 rounded-md border transition
            ${page === currentPage
              ? 'bg-primary text-white border-primary'
              : 'border-primary/30 text-primary hover:bg-primary/10'
            }`}
        >
          {page}
        </button>
      ))}

      {/* Last page */}
      {pages[pages.length - 1] < totalPages && (
        <>
          <span className="text-gray-400">…</span>
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-1 rounded-md border border-primary/30 text-primary hover:bg-primary/10"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-md border transition
          ${currentPage === totalPages
            ? 'text-gray-400 border-gray-200 cursor-not-allowed'
            : 'text-primary border-primary/30 hover:bg-primary/10'
          }`}
      >
        <FaChevronRight />
      </button>
    </div>
  );
};

export default Pagination;
