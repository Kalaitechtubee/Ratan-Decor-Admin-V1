import { normalizeImageUrl } from '../../utils/imageUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ============ COOKIE BASE AUTH FIX ============
// apiFetchWithAuth is removed — replaced by cookie-based fetch
const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include", // <-- IMPORTANT (send cookies)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("API Error:", data);
    throw new Error(data.message || "API request failed");
  }

  return data;
};

// ============ IMAGE PROCESSOR UTILS ============
const processImageUrl = (imageUrl) => {
  return normalizeImageUrl(imageUrl, BASE_URL);
};

const processProductImages = (product) => {
  if (!product) return { id: null, name: "Unknown Product", imageUrl: null, imageUrls: [] };

  const processedProduct = { ...product };

  if (product.imageUrl) {
    processedProduct.imageUrl = processImageUrl(product.imageUrl);
  }

  if (Array.isArray(product.imageUrls)) {
    processedProduct.imageUrls = product.imageUrls
      .filter((url) => url)
      .map((url) => processImageUrl(url));
  } else {
    processedProduct.imageUrls = [];
  }

  if (!processedProduct.imageUrl && product.image) {
    processedProduct.imageUrl = processImageUrl(product.image);
  }

  return processedProduct;
};

// ============ HANDLE ORDER RESPONSE ============
const handleResponse = (data) => {
  if (data.orders) {
    data.orders = data.orders.map((order) => ({
      ...order,
      orderItems: (order.orderItems || []).map((item) => ({
        ...item,
        product: processProductImages(item.product),
      })),
    }));
  }

  if (data.order) {
    data.order.orderItems = (data.order.orderItems || []).map((item) => ({
      ...item,
      product: processProductImages(item.product),
    }));
  }

  return data;
};

// ============ API METHODS ============
const adminOrderApi = {
  getOrders: async (params = {}) => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      sortBy: params.sortBy || "orderDate",
      sortOrder: params.sortOrder || "DESC",
      ...(params.status && { status: params.status }),
      ...(params.paymentStatus && { paymentStatus: params.paymentStatus }),
      ...(params.customer && { customer: params.customer }),
      ...(params.orderId && { orderId: params.orderId }),
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
    };

    const queryString = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryString.append(key, value);
      }
    });

    const data = await apiRequest(`${API_BASE_URL}/orders?${queryString.toString()}`, {
      method: "GET",
    });

    return handleResponse(data);
  },

  getOrderById: async (orderId) => {
    const data = await apiRequest(`${API_BASE_URL}/orders/${orderId}`, {
      method: "GET",
    });

    return handleResponse(data);
  },

  getOrderStats: async () => {
    return await apiRequest(`${API_BASE_URL}/orders/stats`, {
      method: "GET",
    });
  },

  updateOrder: async (orderId, updateData) => {
    return await apiRequest(`${API_BASE_URL}/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
  },

  cancelOrder: async (orderId, cancelData) => {
    return await apiRequest(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cancelData),
    });
  },

  deleteOrder: async (orderId) => {
    return await apiRequest(`${API_BASE_URL}/orders/${orderId}`, {
      method: "DELETE",
    });
  },

  getAvailableAddresses: async () => {
    return await apiRequest(`${API_BASE_URL}/orders/addresses`, {
      method: "GET",
    });
  },

  debugToken: async () => {
    return await apiRequest(`${API_BASE_URL}/orders/debug-token`, {
      method: "POST",
    });
  },
};

export default adminOrderApi;
