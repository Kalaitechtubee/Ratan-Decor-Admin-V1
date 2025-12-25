import React, { useState } from 'react';
import {
  Package,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import StatusBadge from '../Common/StatusBadge';
import { getProductImageUrl } from '../../utils/imageUtils';

let adminOrderApi;
(async () => {
  try {
    const module = await import('./adminOrderApi');
    adminOrderApi = module.default;
  } catch (e) {
    console.error('Failed to import adminOrderApi:', e);
    adminOrderApi = { cancelOrder: () => Promise.reject(new Error('API not available')) };
  }
})();

const OrderDetails = ({ order, onUpdate, onClose }) => {
  const [loading, setLoading] = useState({ cancel: false });
  const [error, setError] = useState(null);

  const handleCancelOrder = async (orderId, reason) => {
    setLoading(prev => ({ ...prev, cancel: true }));
    setError(null);
    try {
      await adminOrderApi.cancelOrder(orderId, { reason });
      await onUpdate(orderId);
    } catch (err) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setLoading(prev => ({ ...prev, cancel: false }));
    }
  };

  const handleCancelClick = () => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (reason) {
      handleCancelOrder(order.id, reason);
    }
  };

  // Image URL processing
  const getImageUrl = (product) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const fallbackImage = `${API_BASE_URL}/uploads/defaults/no-image.png`;

    if (!product) return fallbackImage;

    const imageUrl = getProductImageUrl(product, API_BASE_URL);
    return imageUrl || fallbackImage;
  };

  const handleImageError = (e) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const fallbackImage = `${API_BASE_URL}/Uploads/defaults/no-image.png`;
    if (e.target.src !== fallbackImage) {
      e.target.src = fallbackImage;
    }
  };

  // Extract user information (for billing address)
  const getUserInfo = () => {
    // Get user info from the order.user object if available
    if (order.user) {
      return {
        name: order.user.name || 'N/A',
        phone: order.user.mobile || 'N/A',
        email: order.user.email || 'N/A',
        address: order.user.address || 'N/A',
        city: order.user.city || 'N/A',
        state: order.user.state || 'N/A',
        country: order.user.country || 'N/A',
        pincode: order.user.pincode || 'N/A',
        role: order.user.role || 'Customer',
        userId: order.user.id || order.userId
      };
    }

    // Fallback to delivery address if user info not available
    return {
      name: order.deliveryAddress?.data?.name || 'N/A',
      phone: order.deliveryAddress?.data?.phone || 'N/A',
      email: 'N/A',
      address: order.deliveryAddress?.data?.address || 'N/A',
      city: order.deliveryAddress?.data?.city || 'N/A',
      state: order.deliveryAddress?.data?.state || 'N/A',
      country: order.deliveryAddress?.data?.country || 'N/A',
      pincode: order.deliveryAddress?.data?.pincode || 'N/A',
      role: 'Customer',
      userId: order.userId
    };
  };

  // Extract delivery address information
  const getDeliveryInfo = () => {
    if (order.deliveryAddress?.data) {
      return {
        name: order.deliveryAddress.data.name || 'N/A',
        phone: order.deliveryAddress.data.phone || 'N/A',
        address: order.deliveryAddress.data.address || 'N/A',
        city: order.deliveryAddress.data.city || 'N/A',
        state: order.deliveryAddress.data.state || 'N/A',
        country: order.deliveryAddress.data.country || 'N/A',
        pincode: order.deliveryAddress.data.pincode || 'N/A',
        type: order.deliveryAddress.type || 'N/A',
        source: order.deliveryAddress.data.source || 'N/A'
      };
    }

    return {
      name: 'N/A',
      phone: 'N/A',
      address: 'N/A',
      city: 'N/A',
      state: 'N/A',
      country: 'N/A',
      pincode: 'N/A',
      type: 'N/A',
      source: 'N/A'
    };
  };

  const userInfo = getUserInfo();
  const deliveryInfo = getDeliveryInfo();

  const getTrackingSteps = (status) => {
    const steps = [
      { id: 1, name: 'Order Placed', icon: ShoppingBag },
      { id: 2, name: 'Pending', icon: Clock },
      { id: 3, name: 'Processing', icon: Package },
      { id: 4, name: 'Shipped', icon: Truck },
      { id: 5, name: 'Completed', icon: CheckCircle },
    ];
    const s = (status || '').toLowerCase();
    const statusMap = { pending: 2, processing: 3, shipped: 4, completed: 5 };
    const currentStep = statusMap[s] || 1;

    return steps.map((step) => {
      let stepStatus = 'pending';
      if (s === 'completed') {
        stepStatus = 'completed';
      } else if (step.id < currentStep) {
        stepStatus = 'completed';
      } else if (step.id === currentStep) {
        stepStatus = 'current';
      }
      return { ...step, status: stepStatus };
    });
  };

  const trackingSteps = getTrackingSteps(order.status);

  return (
    <div className="space-y-6 font-sans bg-gray-50 p-6 rounded-xl shadow-lg max-w-4xl mx-auto">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Order Tracking Timeline */}
      <div className='bg-white p-6 rounded-lg shadow-sm overflow-x-auto'>
        <h4 className='text-lg font-semibold text-gray-800 mb-6'>Order Progress</h4>
        <div className='flex items-center justify-between min-w-[600px]'>
          {trackingSteps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className='flex flex-col items-center relative flex-1'>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step.status === 'completed'
                    ? 'bg-green-500 border-green-500 text-white'
                    : step.status === 'current'
                      ? 'bg-blue-100 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-200 text-gray-400'
                    }`}
                >
                  <step.icon size={20} className={step.status === 'current' ? 'animate-pulse' : ''} />
                </div>
                <div className='mt-2 text-center'>
                  <p
                    className={`text-xs font-semibold ${step.status === 'completed'
                      ? 'text-green-600'
                      : step.status === 'current'
                        ? 'text-blue-600'
                        : 'text-gray-500'
                      }`}
                  >
                    {step.name}
                  </p>
                </div>
              </div>
              {index < trackingSteps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* User Information */}
      <div className="bg-white p-5 rounded-lg shadow-sm">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">User Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
          <div><span className="font-medium">Name:</span> {userInfo.name}</div>
          <div><span className="font-medium">ID:</span> CUST-{userInfo.userId?.toString().padStart(3, '0') || 'N/A'}</div>
          <div><span className="font-medium">Email:</span> {userInfo.email}</div>
          <div><span className="font-medium">Phone:</span> {userInfo.phone}</div>
          <div><span className="font-medium">Role:</span> {userInfo.role}</div>
        </div>
      </div>

      {/* Order Information */}
      <div className="bg-white p-5 rounded-lg shadow-sm">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Order Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
          <div><span className="font-medium">Order ID:</span> ORD-{order.id.toString().padStart(3, '0')}</div>
          <div><span className="font-medium">Date:</span> {new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div><span className="font-medium">Status:</span> <StatusBadge status={order.status} type="order" /></div>
          <div><span className="font-medium">Payment:</span> <StatusBadge status={order.paymentStatus} type="payment" /></div>
          <div><span className="font-medium">Payment Method:</span> {order.paymentMethod || 'N/A'}</div>
          <div><span className="font-medium">Expected Delivery:</span> {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN') : 'N/A'}</div>
        </div>
      </div>

      {/* Addresses - Now showing different information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing Address - From User Profile */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            Billing Address
            <span className="text-xs text-blue-600 font-normal ml-2">(User Profile)</span>
          </h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div><span className="font-medium">Name:</span> {userInfo.name}</div>
            <div><span className="font-medium">Address:</span> {userInfo.address}</div>
            <div><span className="font-medium">City:</span> {userInfo.city}</div>
            <div><span className="font-medium">State:</span> {userInfo.state}</div>
            <div><span className="font-medium">Country:</span> {userInfo.country}</div>
            <div><span className="font-medium">Pincode:</span> {userInfo.pincode}</div>
            <div><span className="font-medium">Phone:</span> {userInfo.phone}</div>
            <div><span className="font-medium">Email:</span> {userInfo.email}</div>
          </div>
        </div>

        {/* Delivery Address - From Order Delivery Address */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            Delivery Address
            <span className="text-xs text-green-600 font-normal ml-2">
              ({deliveryInfo.type === 'default' ? 'Default' :
                deliveryInfo.type === 'shipping' ? 'Shipping Address' :
                  deliveryInfo.type === 'new' ? 'New Address' : 'Custom'})
            </span>
          </h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div><span className="font-medium">Name:</span> {deliveryInfo.name}</div>
            <div><span className="font-medium">Address:</span> {deliveryInfo.address}</div>
            <div><span className="font-medium">City:</span> {deliveryInfo.city}</div>
            <div><span className="font-medium">State:</span> {deliveryInfo.state}</div>
            <div><span className="font-medium">Country:</span> {deliveryInfo.country}</div>
            <div><span className="font-medium">Pincode:</span> {deliveryInfo.pincode}</div>
            <div><span className="font-medium">Phone:</span> {deliveryInfo.phone}</div>
            {deliveryInfo.source && deliveryInfo.source !== 'N/A' && (
              <div><span className="font-medium">Source:</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded ml-1">{deliveryInfo.source}</span>
              </div>
            )}
          </div>

          {/* Show if addresses are the same */}
          {(userInfo.address === deliveryInfo.address &&
            userInfo.city === deliveryInfo.city &&
            userInfo.pincode === deliveryInfo.pincode) && (
              <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-xs rounded">
                Same as billing address
              </div>
            )}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white p-5 rounded-lg shadow-sm">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Order Items</h4>
        <div className="space-y-4">
          {order.orderItems?.map((item, index) => {
            const imageUrl = getImageUrl(item.product);
            return (
              <div key={`${item.productId}-${index}`} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {item.product && imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.product.name || 'Product'}
                        className="w-14 h-14 object-cover rounded-md border border-gray-200"
                        onError={handleImageError}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-200 rounded-md border border-gray-200 flex items-center justify-center">
                        <Package size={24} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{item.product?.name || 'Unknown Product'}</div>
                    <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                    {item.product?.category && (
                      <div className="text-xs text-gray-400">Category: {item.product.category.name}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-800">₹{Number(item.price).toLocaleString('en-IN')}</div>
                  <div className="text-xs text-gray-500">Total: ₹{Number(item.subtotal).toLocaleString('en-IN')}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Totals */}
      <div className="bg-white p-5 rounded-lg shadow-sm">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-gray-600">
            <span className="font-medium">Subtotal:</span>
            <span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span className="font-medium">Items Count:</span>
            <span>{order.orderItems?.length || 0} items</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between items-center text-lg font-bold text-blue-600">
            <span>Total:</span>
            <span>₹{Number(order.total).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Notes</h4>
          <p className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">{order.notes}</p>
        </div>
      )}

      {/* Actions */}
      {['Pending', 'Processing'].includes(order.status) && (
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
          <button
            onClick={handleCancelClick}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
            disabled={loading.cancel}
          >
            {loading.cancel ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"></path>
                </svg>
                Cancelling...
              </span>
            ) : (
              'Cancel Order'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;