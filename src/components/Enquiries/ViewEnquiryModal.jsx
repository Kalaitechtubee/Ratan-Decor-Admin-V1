import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit, MessageSquare, Mail, Phone, User, Briefcase, MapPin, Package, FileText, Calendar, Clock, X } from 'lucide-react';
import Modal from '../Common/Modal';
import StatusBadge from '../Common/StatusBadge';
import { getEnquiryById, getInternalNotes } from './EnquiryApi';
import { getProductById } from '../../services/Api';
import { getCurrentUser } from '../../utils/auth';

const LoadingSpinner = ({ size = 'default', className = '' }) => {
  const sizeClass = size === 'small' ? 'w-4 h-4' : 'w-6 h-6';
  return <Loader2 className={`animate-spin ${sizeClass} ${className}`} />;
};

const ViewEnquiryModal = ({
  isOpen,
  onClose,
  enquiryId,
  onEnquiryUpdated,
  userTypes = [],
  showToast,
  onEditClick,
}) => {
  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productDetails, setProductDetails] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const [internalNotes, setInternalNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const user = useMemo(() => getCurrentUser(), []);

  useEffect(() => {
    const fetchEnquiry = async () => {
      if (enquiryId) {
        setLoading(true);
        try {
          const response = await getEnquiryById(enquiryId);
          setEnquiry(response.data);

          if (response.data.productId && !response.data.product) {
            setProductLoading(true);
            try {
              const productRes = await getProductById(response.data.productId, user?.role);
              if (productRes.success) {
                setProductDetails(productRes.product);
              }
            } catch (err) {
              console.error('Error fetching product:', err);
            } finally {
              setProductLoading(false);
            }
          }

          setLoadingNotes(true);
          try {
            const notesResponse = await getInternalNotes(enquiryId, { page: 1, limit: 5 });
            setInternalNotes(notesResponse.data || []);
          } catch (err) {
            console.error('Error fetching internal notes:', err);
          } finally {
            setLoadingNotes(false);
          }
        } catch (err) {
          console.error('Error fetching enquiry:', err);
          showToast('Failed to load enquiry details', 'error');
        } finally {
          setLoading(false);
        }
      }
    };

    if (isOpen && enquiryId) {
      fetchEnquiry();
    }
  }, [isOpen, enquiryId, user?.role, showToast]);

  const getUserTypeName = (userTypeId, userTypes) => {
    if (!userTypeId) return 'N/A';
    if (typeof userTypeId === 'string') {
      const userType = userTypes.find((type) => type.name === userTypeId);
      return userType ? userType.name : userTypeId;
    }
    const userType = userTypes.find((type) => type.id === userTypeId);
    return userType ? userType.name : 'N/A';
  };

  const handleClose = () => {
    setEnquiry(null);
    setProductDetails(null);
    setInternalNotes([]);
    onClose();
  };

  const handleEditClick = () => {
    if (enquiry && onEditClick) {
      onEditClick(enquiry);
      handleClose();
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Loading..." size="xl">
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner className="text-primary" />
        </div>
      </Modal>
    );
  }

  if (!enquiry) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Enquiry Details" size="xl">
        <div className="text-center py-8">
          <p className="text-gray-500">Enquiry not found</p>
        </div>
      </Modal>
    );
  }

  const renderProductDetails = () => {
    const product = productDetails || enquiry.product || {};

    const details = [
      { label: 'Product Name', value: product.name || '-' },
      product.description && { label: 'Description', value: product.description },
      product.brandName && { label: 'Brand', value: product.brandName },
      (product.id || enquiry.productId) && { label: 'Product ID', value: product.id || enquiry.productId },
      {
        label: 'Design Number',
        value: (enquiry.productDesignNumber && enquiry.productDesignNumber !== 'null' && enquiry.productDesignNumber !== 'undefined' && enquiry.productDesignNumber !== '-')
          ? enquiry.productDesignNumber
          : (product.designNumber || '-')
      },
      product.size && { label: 'Size', value: product.size },
      product.thickness && { label: 'Thickness', value: product.thickness },
      product.colors && { label: 'Colors', value: Array.isArray(product.colors) ? product.colors.join(', ') : null },
      (user?.role === 'Architect' && product.architectPrice) ? { label: 'Architect Price', value: `₹${product.architectPrice}` } : null,
      (user?.role === 'Dealer' && product.dealerPrice) ? { label: 'Dealer Price', value: `₹${product.dealerPrice}` } : null,
      ((!user?.role || user?.role === 'General' || (!product.architectPrice && !product.dealerPrice)) && product.generalPrice) ? { label: 'General Price', value: `₹${product.generalPrice}` } : null,
    ].filter(Boolean);

    if (details.length === 0) {
      return <p className="text-sm text-gray-500 italic">No product details available.</p>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {details.map((detail, index) => (
          <div key={index} className="flex flex-col">
            <span className="text-xs text-gray-500">{detail.label}</span>
            <span className="text-sm font-medium text-gray-900">{detail.value || '-'}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Enquiry Details - #${enquiry.id}`} size="xl">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
        {/* Header Status Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-4 rounded-xl border border-gray-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm text-primary">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Enquiry Request</h3>
              <p className="text-sm text-gray-500">Created on {new Date(enquiry.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status:</span>
              <StatusBadge status={enquiry.status} type="enquiry" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Source:</span>
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200 capitalize">
                {enquiry.source || 'Website'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Customer Information</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{enquiry.name}</p>
                  <p className="text-xs text-gray-500">Customer Name</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 text-break-all">{enquiry.email}</p>
                  <p className="text-xs text-gray-500">Email Address</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{enquiry.phone || enquiry.phoneNo || '-'}</p>
                  <p className="text-xs text-gray-500">Phone Number</p>
                </div>
              </div>
              {enquiry.companyName && (
                <div className="flex items-start gap-3">
                  <Briefcase size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{enquiry.companyName}</p>
                    <p className="text-xs text-gray-500">Company Name</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <User size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {enquiry.userTypeData?.name || getUserTypeName(enquiry.userType, userTypes)}
                  </p>
                  <p className="text-xs text-gray-500">User Type</p>
                </div>
              </div>
              {enquiry.role && (
                <div className="flex items-start gap-3">
                  <User size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{enquiry.role}</p>
                    <p className="text-xs text-gray-500">Role</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location & Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Location Information</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {[enquiry.city, enquiry.state].filter(Boolean).join(', ') || '-'}
                  </p>
                  <p className="text-xs text-gray-500">City & State</p>
                </div>
              </div>
              {enquiry.pincode && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{enquiry.pincode}</p>
                    <p className="text-xs text-gray-500">Pincode</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{new Date(enquiry.updatedAt).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">Last Updated</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Information */}
        {(enquiry.productId || enquiry.product || enquiry.productDesignNumber) && (
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Package size={16} />
              Product Information
            </h4>
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              {productLoading ? (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <LoadingSpinner size="small" /> Loading product details...
                </div>
              ) : (
                renderProductDetails()
              )}
            </div>
          </div>
        )}

        {/* Customer Notes */}
        {enquiry.notes && (
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} />
              Customer Notes
            </h4>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{enquiry.notes}</p>
            </div>
          </div>
        )}



        {/* Footer Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-100 gap-3">
          <button
            onClick={handleEditClick}
            className="flex items-center px-4 py-2 space-x-2 text-primary rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
          >
            <Edit size={16} />
            <span className="text-sm font-medium">Edit Enquiry</span>
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewEnquiryModal;