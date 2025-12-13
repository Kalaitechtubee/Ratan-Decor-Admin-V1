import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Edit } from 'lucide-react';
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
  onEditClick, // New prop to handle edit button click
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
          
          // Fetch product details if needed
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
          
          // Fetch internal notes
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
      handleClose(); // Close the view modal
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

  // Helper function to render product details
  const renderProductDetails = () => {
    const product = productDetails || enquiry.product;
    
    if (!product) {
      return <p><span className="font-medium">Product ID:</span> {enquiry.productId}</p>;
    }
    
    return (
      <>
        <p><span className="font-medium">Product Name:</span> {product.name || '-'}</p>
        {product.description && <p><span className="font-medium">Description:</span> {product.description}</p>}
        {product.brandName && <p><span className="font-medium">Brand:</span> {product.brandName}</p>}
        <p><span className="font-medium">Product ID:</span> {product.id || '-'}</p>
        <p><span className="font-medium">Design Number:</span> {
          (enquiry.productDesignNumber && enquiry.productDesignNumber !== 'null' && enquiry.productDesignNumber !== 'undefined' && enquiry.productDesignNumber !== '-')
            ? enquiry.productDesignNumber
            : (product && product.designNumber ? product.designNumber : '-')
        }</p>
        {product.size && <p><span className="font-medium">Size:</span> {product.size}</p>}
        {product.thickness && <p><span className="font-medium">Thickness:</span> {product.thickness}</p>}
        {product.colors?.length > 0 && (
          <p><span className="font-medium">Colors:</span> {product.colors.join(', ')}</p>
        )}
        {user?.role === 'Architect' && product.architectPrice && (
          <p><span className="font-medium">Architect Price:</span> ₹{product.architectPrice}</p>
        )}
        {user?.role === 'Dealer' && product.dealerPrice && (
          <p><span className="font-medium">Dealer Price:</span> ₹{product.dealerPrice}</p>
        )}
        {(!user?.role || user?.role === 'General' || (!product.architectPrice && !product.dealerPrice)) && product.generalPrice && (
          <p><span className="font-medium">General Price:</span> ₹{product.generalPrice}</p>
        )}
      </>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Enquiry Details - ${enquiry.id}`} size="xl">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="mb-3 text-lg font-medium text-gray-900">Customer Information</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Name:</span> {enquiry.name}
              </p>
              <p>
                <span className="font-medium">Email:</span> {enquiry.email}
              </p>
              <p>
                <span className="font-medium">Phone:</span> {enquiry.phone || enquiry.phoneNo || '-'}
              </p>
              {enquiry.companyName && (
                <p>
                  <span className="font-medium">Company:</span> {enquiry.companyName}
                </p>
              )}
              <p>
                <span className="font-medium">User Type:</span> {enquiry.userTypeData?.name || getUserTypeName(enquiry.userType, userTypes)}
              </p>
              <p>
                <span className="font-medium">Role:</span> {enquiry.role || '-'}
              </p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="mb-3 text-lg font-medium text-gray-900">Location & Details</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">City:</span> {enquiry.city || '-'}
              </p>
              <p>
                <span className="font-medium">State:</span> {enquiry.state || '-'}
              </p>
              {enquiry.pincode && (
                <p>
                  <span className="font-medium">Pincode:</span> {enquiry.pincode}
                </p>
              )}
              <p>
                <span className="font-medium">Source:</span> {enquiry.source}
              </p>
              <p>
                <span className="font-medium">Status:</span>
                <span className="ml-2">
                  <StatusBadge status={enquiry.status} type="enquiry" />
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        {(enquiry.productId || enquiry.product) && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="mb-3 text-lg font-medium text-gray-900">Product Information</h3>
            <div className="space-y-2 text-sm">
              {productLoading ? (
                <p>Loading product details...</p>
              ) : (
                renderProductDetails()
              )}
            </div>
          </div>
        )}

        {enquiry.notes && (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="mb-3 text-lg font-medium text-gray-900">Notes</h3>
            <p className="text-sm text-gray-700">{enquiry.notes}</p>
          </div>
        )}

        <div className="p-4 bg-indigo-50 rounded-lg">
          <h3 className="mb-3 text-lg font-medium text-gray-900">Timeline</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Created:</span> {new Date(enquiry.createdAt).toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Last Updated:</span> {new Date(enquiry.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="mb-3 text-lg font-medium text-gray-900">Internal Notes</h3>
          {loadingNotes ? (
            <div className="flex justify-center">
              <LoadingSpinner className="text-primary" />
            </div>
          ) : internalNotes.length > 0 ? (
            <div className="space-y-2">
              {internalNotes.map((note) => (
                <div key={note.id} className="p-2 bg-white border rounded-lg">
                  <p className="text-sm text-gray-700">{note.note}</p>
                  <p className="text-xs text-gray-500">
                    {note.noteType} by {note.staffUser?.name || 'Unknown'} on{' '}
                    {new Date(note.createdAt).toLocaleString()}
                    {note.isImportant && <span className="ml-2 text-red-500">★ Important</span>}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No internal notes available.</p>
          )}
        </div>

        {/* Edit Button at the bottom */}
        <div className="flex pt-4 space-x-3 border-t border-gray-200 mt-6">
          <button
            onClick={handleEditClick}
            className="flex items-center px-4 py-2 space-x-2 text-primary rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
          >
            <Edit size={16} />
            <span>Edit Enquiry</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewEnquiryModal;