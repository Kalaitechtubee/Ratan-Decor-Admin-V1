// ProductDetails.jsx (Enhanced Component for viewing product details)
import React from 'react';
import { Image, Package, Palette, Ruler } from 'lucide-react';
import StatusBadge from '../Common/StatusBadge';

const ProductDetails = ({ product, getImageUrl, formatRating }) => {
  if (!product) return null;

  const InfoCard = ({ icon: Icon, title, children }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-primary" />
        <h4 className="font-medium text-gray-900">{title}</h4>
      </div>
      <div className="space-y-2 text-sm text-gray-600">
        {children}
      </div>
    </div>
  );

  const PriceCard = ({ label, price, highlight = false }) => (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-semibold ${highlight ? 'text-primary' : 'text-gray-900'}`}>
        ₹{Number(price || 0).toLocaleString()}
      </p>
    </div>
  );

  // Filter unique image URLs to prevent duplicates
  const uniqueImageUrls = product.imageUrls ? [...new Set(product.imageUrls)] : [];

  return (
    <div className="space-y-8 font-roboto bg-gray-50 p-6 rounded-2xl">
      {/* Header Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
            <p className="text-gray-600 leading-relaxed">{product.description || 'No description available'}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={product.isActive ? 'active' : 'inactive'} type="product" />
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Image */}
          <div className="lg:col-span-2">
            {uniqueImageUrls?.length > 0 ? (
              <img
                src={getImageUrl(uniqueImageUrls[0])}
                alt={product.name}
                className="w-full h-80 object-cover rounded-xl shadow-sm"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22150%22%20height%3D%22150%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22150%22%20height%3D%22150%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22Arial%2C%20sans-serif%22%20fill%3D%22%23999%22%3EImage%20Not%20Found%3C%2Ftext%3E%3C%2Fsvg%3E';
                }}
              />
            ) : (
              <div className="flex justify-center items-center w-full h-80 bg-gray-100 rounded-xl">
                <Image size={64} className="text-gray-400" />
              </div>
            )}
          </div>

          {/* Additional Images */}
          {uniqueImageUrls?.length > 1 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">More Images</h4>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                {uniqueImageUrls.slice(1, 5).map((url, index) => (
                  <img
                    key={index}
                    src={getImageUrl(url)}
                    alt={`Additional ${index + 1}`}
                    className="w-full h-20 lg:h-24 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  />
                ))}
                {uniqueImageUrls.length > 5 && (
                  <div className="flex items-center justify-center h-20 lg:h-24 bg-gray-100 rounded-lg text-gray-500 text-sm">
                    +{uniqueImageUrls.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PriceCard label="MRP Price" price={product.mrpPrice} highlight />
          <PriceCard label="General Price" price={product.generalPrice} />
          <PriceCard label="Architect Price" price={product.architectPrice} />
          <PriceCard label="Dealer Price" price={product.dealerPrice} />
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>GST:</strong> {Number(product.gst || 0).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Product Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Basic Info */}
        <InfoCard icon={Package} title="Basic Information">
          <div className="space-y-2">
            <div><strong>Category:</strong> {product.category?.parent?.name || product.category?.name || 'No category'}</div>
            <div><strong>Subcategory:</strong> {product.category?.parent ? product.category?.name : 'No subcategory'}</div>
            <div><strong>User Type:</strong> {product.visibleTo?.join(', ') || 'All'}</div>
          </div>
        </InfoCard>

        {/* Design Details */}
        <InfoCard icon={Palette} title="Design & Brand">
          <div className="space-y-2">
            <div><strong>Brand Name:</strong> {product.brandName || 'None'}</div>
            <div><strong>Design Number:</strong> {product.designNumber || 'None'}</div>
            {product.colors?.length > 0 && (
              <div>
                <strong>Colors:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {product.colors.map((color, index) => (
                    <span key={index} className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </InfoCard>

        {/* Physical Specifications */}
        <InfoCard icon={Ruler} title="Specifications">
          <div className="space-y-2">
            <div><strong>Size:</strong> {product.size || 'Not specified'}</div>
            <div><strong>Thickness:</strong> {product.thickness || 'Not specified'}</div>
            <div><strong>Unit Type:</strong> {product.unitType || 'Not specified'}</div>
          </div>
        </InfoCard>
      </div>


    </div>
  );
};

export default ProductDetails;
