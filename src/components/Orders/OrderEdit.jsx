import React, { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
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
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.status || !formData.paymentStatus) {
      setError('Status and Payment Status are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await adminOrderApi.updateOrder(order.id, formData);
      setSuccess(true);
      
      // Wait a moment to show success message, then close
      setTimeout(async () => {
        await onUpdate(order.id, formData);
      }, 1000);
    } catch (err) {
      console.error('Update Error:', err);
      setError(err.message || 'Failed to update order. Please try again.');
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
    setSuccess(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="font-medium">Order updated successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Order Information */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Order Information</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Order ID:</span>
            <span className="ml-2 font-medium text-primary">ORD-{order.id.toString().padStart(3, '0')}</span>
          </div>
          <div>
            <span className="text-gray-500">Customer:</span>
            <span className="ml-2 font-medium">{order.user?.name || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-gray-500">Total Amount:</span>
            <span className="ml-2 font-medium">₹{Number(order.total).toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-gray-500">Order Date:</span>
            <span className="ml-2 font-medium">
              {new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Order Status <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="px-4 py-2.5 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={loading || success}
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
          className="px-4 py-2.5 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={loading || success}
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
          className="px-4 py-2.5 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={loading || success}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Order Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows="4"
          placeholder="Add internal notes about this order..."
          className="px-4 py-2.5 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          disabled={loading || success}
        />
        <p className="mt-1 text-xs text-gray-500">These notes are for internal use only and won't be visible to customers.</p>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading || success}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
        <button
          type="submit"
          disabled={loading || success}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {loading ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default OrderEdit;