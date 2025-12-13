import React, { useState } from 'react';
import adminOrderApi from './adminOrderApi';

const OrderEdit = ({ order, userRole, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    status: order.status,
    paymentStatus: order.paymentStatus,
    notes: order.notes || '',
    expectedDeliveryDate: order.expectedDeliveryDate
      ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0]
      : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!['Admin', 'Manager'].includes(userRole)) {
      setError('Unauthorized: Only Admin or Manager can update orders');
      return;
    }
    if (!formData.status || !formData.paymentStatus) {
      setError('Status and Payment Status are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adminOrderApi.updateOrder(order.id, formData);
      await onUpdate(order.id, formData);
      setError(null); // reset error on success
    } catch (err) {
      setError(err.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      status: order.status,
      paymentStatus: order.paymentStatus,
      notes: order.notes || '',
      expectedDeliveryDate: order.expectedDeliveryDate
        ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0]
        : '',
    });
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      {/* Status */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Order Status <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={loading}
          required
        >
          <option value="">Select Status</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Payment Status */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Payment Status <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.paymentStatus}
          onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={loading}
          required
        >
          <option value="">Select Payment Status</option>
          <option value="Awaiting">Awaiting</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Expected Delivery Date */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Expected Delivery Date</label>
        <input
          type="date"
          value={formData.expectedDeliveryDate}
          onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={loading}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows="4"
          placeholder="Add notes about this order..."
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={loading}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <div className="flex space-x-3">
          <button type="button" onClick={handleReset} disabled={loading} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
            Reset
          </button>
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
            Cancel
          </button>
        </div>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default OrderEdit;
