import React from 'react';

function StatusBadge({ status, type = 'enquiry' }) {
  const getStatusStyle = (status, type) => {
    const styles = {
      enquiry: {
        new: 'bg-blue-100 text-blue-800 border-blue-200',
        in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        quoted: 'bg-purple-100 text-purple-800 border-purple-200',
        converted: 'bg-green-100 text-green-800 border-green-200',
        closed: 'bg-gray-100 text-gray-800 border-gray-200'
      },
      order: {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
        processing: 'bg-purple-100 text-purple-800 border-purple-200',
        shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        delivered: 'bg-green-100 text-green-800 border-green-200',
        cancelled: 'bg-red-100 text-red-800 border-red-200'
      },
      user: {
        active: 'bg-green-100 text-green-800 border-green-200',
        inactive: 'bg-gray-100 text-gray-800 border-gray-200',
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      product: {
        active: 'bg-green-100 text-green-800 border-green-200',
        inactive: 'bg-gray-100 text-gray-800 border-gray-200',
        draft: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      payment: {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        partial: 'bg-orange-100 text-orange-800 border-orange-200',
        paid: 'bg-green-100 text-green-800 border-green-200',
        overdue: 'bg-red-100 text-red-800 border-red-200'
      }
    };

    return styles[type]?.[status] || `bg-gray-100 text-primary border-gray-200`;
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border font-roboto ${getStatusStyle(
        status,
        type
      )}`}
    >
      {formatStatus(status)}
    </span>
  );
};

export default StatusBadge;