/**
 * Image URL Normalization Utility (Admin)
 * Handles localhost port issues and ensures correct image URLs
 */

/**
 * Normalize image URL to ensure correct port and base URL
 * @param {string} url - Image URL to normalize
 * @param {string} apiBaseUrl - Optional API base URL (defaults to VITE_API_BASE_URL)
 * @returns {string|null} Normalized image URL
 */
export const normalizeImageUrl = (url, apiBaseUrl = null) => {
  if (!url) return null;

  // Get API base URL
  let baseUrl = apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  
  // Ensure baseUrl has port if it's localhost
  try {
    const baseUrlObj = new URL(baseUrl);
    // If it's localhost without port, add default port 3000
    if ((baseUrlObj.hostname === 'localhost' || baseUrlObj.hostname === '127.0.0.1') && !baseUrlObj.port) {
      baseUrl = `${baseUrlObj.protocol}//${baseUrlObj.hostname}:3000`;
    }
  } catch (e) {
    // If parsing fails, use default
    baseUrl = 'http://localhost:3000';
  }

  // If it's already a full URL, check if it needs to be replaced
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      // If it's a localhost URL, always replace with API base URL to ensure correct port
      if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
        const baseUrlObj = new URL(baseUrl);
        // Use the pathname from the original URL but with correct base URL (including port)
        return `${baseUrlObj.protocol}//${baseUrlObj.host}${urlObj.pathname}`;
      }
      return url;
    } catch (e) {
      // If URL parsing fails, try to extract path manually
      const pathMatch = url.match(/\/uploads\/.*$/);
      if (pathMatch) {
        return `${baseUrl}${pathMatch[0]}`;
      }
      // Try to extract any path after localhost
      const localhostMatch = url.match(/http:\/\/localhost(\/.*)$/);
      if (localhostMatch) {
        return `${baseUrl}${localhostMatch[1]}`;
      }
      return url;
    }
  }

  // If it's a relative path, construct full URL
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }

  // If it's just a filename, construct full path
  return `${baseUrl}/uploads/products/${url}`;
};

/**
 * Get product image URL from product object
 * @param {Object} product - Product object
 * @param {string} apiBaseUrl - Optional API base URL
 * @returns {string|null} Normalized image URL
 */
export const getProductImageUrl = (product, apiBaseUrl = null) => {
  if (!product) return null;

  // Check for processed imageUrls array first (from backend processProductData)
  if (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
    const normalizedUrl = normalizeImageUrl(product.imageUrls[0], apiBaseUrl);
    if (normalizedUrl) return normalizedUrl;
  }

  // Check for single imageUrl
  if (product.imageUrl) {
    const normalizedUrl = normalizeImageUrl(product.imageUrl, apiBaseUrl);
    if (normalizedUrl) return normalizedUrl;
  }

  // Check for images array (raw filenames)
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const imagePath = product.images[0];
    if (imagePath) {
      const normalizedUrl = normalizeImageUrl(imagePath, apiBaseUrl);
      if (normalizedUrl) return normalizedUrl;
    }
  }

  // Check for single image (raw filename)
  if (product.image) {
    const normalizedUrl = normalizeImageUrl(product.image, apiBaseUrl);
    if (normalizedUrl) return normalizedUrl;
  }

  return null;
};

export default {
  normalizeImageUrl,
  getProductImageUrl
};

