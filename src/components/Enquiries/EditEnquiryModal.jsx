import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, MapPin, CheckCircle } from 'lucide-react';
import Modal from '../Common/Modal';
import { updateEnquiry, getEnquiryById } from './EnquiryApi';

const LoadingSpinner = ({ size = 'default', className = '' }) => {
  const sizeClass = size === 'small' ? 'w-4 h-4' : 'w-6 h-6';
  return <Loader2 className={`animate-spin ${sizeClass} ${className}`} />;
};

const LocationSelector = ({
  pincode,
  state,
  city,
  onPincodeChange,
  onLocationChange,
  errors = {},
  required = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);

  const fetchLocationData = useCallback(async (pincodeValue) => {
    if (!pincodeValue || pincodeValue.length !== 6 || !/^\d{6}$/.test(pincodeValue)) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincodeValue}`);
      const data = await response.json();

      if (data[0]?.Status === 'Success') {
        const postOffices = data[0].PostOffice || [];
        const uniqueLocations = new Map();
        postOffices.forEach((office) => {
          const key = `${office.State}-${office.District}`;
          if (!uniqueLocations.has(key)) {
            uniqueLocations.set(key, {
              state: office.State,
              city: office.District,
              area: office.Name,
            });
          }
        });

        const locationOptions = Array.from(uniqueLocations.values());
        setSuggestions(locationOptions);
        if (locationOptions.length === 1 && !manualOverride) {
          const location = locationOptions[0];
          onLocationChange({
            state: location.state,
            city: location.city,
          });
          setShowSuggestions(false);
        } else if (locationOptions.length > 1) {
          setShowSuggestions(true);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, [onLocationChange, manualOverride]);

  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    onPincodeChange(value);
    if (value.length === 6) {
      fetchLocationData(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectLocation = (location) => {
    onLocationChange({
      state: location.state,
      city: location.city,
    });
    setShowSuggestions(false);
    setManualOverride(false);
  };

  const enableManualEntry = () => {
    setManualOverride(true);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          <MapPin size={16} className="inline mr-1" />
          Pincode {required && <span className="text-primary">*</span>}
        </label>
        <div className="relative">
          <input
            type="text"
            value={pincode}
            onChange={handlePincodeChange}
            placeholder="Enter 6-digit pincode"
            className={`w-full px-3 py-2 pr-10 rounded-lg border transition-all ${errors.pincode
                ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                : 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent'
              }`}
            maxLength={6}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <LoadingSpinner size="small" className="text-primary" />
            </div>
          )}
        </div>
        {errors.pincode && <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            <div className="p-2 text-xs text-gray-500 bg-gray-50 border-b">Select your location:</div>
            {suggestions.map((location, index) => (
              <button
                key={index}
                onClick={() => selectLocation(location)}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b last:border-b-0 transition-colors"
              >
                <div className="font-medium text-gray-900">
                  {location.city}, {location.state}
                </div>
                <div className="text-xs text-gray-500">{location.area}</div>
              </button>
            ))}
            <button
              onClick={enableManualEntry}
              className="w-full px-3 py-2 text-left text-primary hover:bg-blue-50 border-t text-sm font-medium"
            >
              Enter location manually
            </button>
          </div>
        )}
        {pincode.length === 6 && state && city && !showSuggestions && !loading && (
          <div className="mt-1 text-xs text-green-600 flex items-center">
            <CheckCircle size={12} className="mr-1" />
            Location auto-filled for pincode {pincode}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            State {required && <span className="text-primary">*</span>}
          </label>
          <input
            type="text"
            value={state}
            onChange={(e) => onLocationChange({ state: e.target.value, city })}
            className={`w-full px-3 py-2 rounded-lg border transition-all ${errors.state
                ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                : 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent'
              } ${!manualOverride && pincode.length === 6 ? 'bg-blue-50' : ''}`}
            placeholder="Enter state"
            readOnly={!manualOverride && suggestions.length > 0}
          />
          {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            City/District {required && <span className="text-primary">*</span>}
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => onLocationChange({ state, city: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg border transition-all ${errors.city
                ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                : 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent'
              } ${!manualOverride && pincode.length === 6 ? 'bg-blue-50' : ''}`}
            placeholder="Enter city or district"
            readOnly={!manualOverride && suggestions.length > 0}
          />
          {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
        </div>
      </div>
      {!manualOverride && state && city && (
        <button
          type="button"
          onClick={enableManualEntry}
          className="text-sm text-primary hover:text-opacity-80 transition-colors"
        >
          Edit location manually
        </button>
      )}
    </div>
  );
};

const EditEnquiryModal = ({
  isOpen,
  onClose,
  enquiryId,
  onEnquiryUpdated,
  userTypes = [],
  roles = [],
  sources = [],
  statuses = [],
  showToast,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNo: '',
    companyName: '',
    userType: '',
    state: '',
    city: '',
    pincode: '',
    productDesignNumber: '',
    source: 'Email',
    notes: '',
    role: 'Customer',
    status: 'New',
  });

  useEffect(() => {
    const fetchEnquiry = async () => {
      if (enquiryId) {
        setLoading(true);
        try {
          const response = await getEnquiryById(enquiryId);
          const enquiry = response.data;

          setFormData({
            name: enquiry.name || '',
            email: enquiry.email || '',
            phoneNo: enquiry.phone || enquiry.phoneNo || '',
            companyName: enquiry.companyName || '',
            userType: enquiry.userType || (userTypes.length > 0 ? userTypes[0].id : ''),
            state: enquiry.user?.state || enquiry.state || '',
            city: enquiry.user?.city || enquiry.city || '',
            pincode: enquiry.pincode || enquiry.user?.pincode || '',
            productDesignNumber: enquiry.productDesignNumber || '',
            source: enquiry.source || 'Email',
            notes: enquiry.notes || '',
            role: enquiry.user?.role || enquiry.role || 'Customer',
            status: enquiry.status || 'New',
          });
        } catch (err) {
          console.error('Error fetching enquiry:', err);
          showToast('Failed to load enquiry for editing', 'error');
        } finally {
          setLoading(false);
        }
      }
    };

    if (isOpen && enquiryId) {
      fetchEnquiry();
    }
  }, [isOpen, enquiryId, userTypes, showToast]);

  const handleLocationChange = useCallback(
    ({ state, city }) => {
      setFormData((prev) => ({
        ...prev,
        state: state || prev.state,
        city: city || prev.city,
      }));
      setValidationErrors((prev) => ({
        ...prev,
        state: state ? undefined : prev.state,
        city: city ? undefined : prev.city,
      }));
    },
    [setValidationErrors]
  );

  const FormInput = ({ label, name, type = 'text', required = false, ...props }) => {
    const hasError = validationErrors[name];
    return (
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {label} {required && <span className="text-primary">*</span>}
        </label>
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={(e) => {
            const val = e.target.value;
            if (name === 'productDesignNumber' && val !== '' && !/^\d+$/.test(val)) {
              return;
            }
            setFormData({ ...formData, [name]: val });
            if (hasError) setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
          }}
          className={`w-full px-3 py-2 rounded-lg border transition-shadow ${hasError
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
              : 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent'
            }`}
          {...props}
        />
        {hasError && <p className="mt-1 text-sm text-red-600">{hasError}</p>}
      </div>
    );
  };

  const FormSelect = ({ label, name, options, required = false, ...props }) => {
    const hasError = validationErrors[name];
    return (
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {label} {required && <span className="text-primary">*</span>}
        </label>
        <select
          name={name}
          value={formData[name]}
          onChange={(e) => {
            setFormData({ ...formData, [name]: e.target.value });
            if (hasError) setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
          }}
          className={`w-full px-3 py-2 rounded-lg border transition-shadow ${hasError
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
              : 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent'
            }`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hasError && <p className="mt-1 text-sm text-red-600">{hasError}</p>}
      </div>
    );
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[0-9]{10,15}$/.test(phone.replace(/[^\d]/g, ''));
  const formatPhoneNumber = (phone) => phone.replace(/[^\d]/g, '');
  const validatePincode = (pincode) => (pincode ? /^\d{6}$/.test(pincode) : true);

  const validateForm = (data) => {
    const errors = {};
    const requiredFields = ['name', 'email', 'phoneNo', 'state', 'city'];
    requiredFields.forEach((field) => {
      if (!data[field]?.trim()) errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    });
    if (data.email && !validateEmail(data.email)) errors.email = 'Please enter a valid email address';
    if (data.phoneNo && !validatePhone(data.phoneNo)) errors.phoneNo = 'Please enter a valid phone number (10-15 digits)';
    if (data.pincode && !validatePincode(data.pincode)) errors.pincode = 'Please enter a valid 6-digit pincode';
    if (userTypes.length > 0 && !data.userType) errors.userType = 'Please select a user type';
    return errors;
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setValidationErrors({});

      const errors = validateForm(formData);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        showToast('Please fix the validation errors', 'error');
        return;
      }

      const formattedEnquiry = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNo: formatPhoneNumber(formData.phoneNo),
        state: formData.state.trim(),
        city: formData.city.trim(),
        companyName: formData.companyName?.trim() || null,
        productDesignNumber: formData.productDesignNumber?.trim() || null,
        notes: formData.notes?.trim() || null,
        userType: formData.userType || null,
        source: formData.source,
        role: formData.role,
        status: formData.status,
        pincode: formData.pincode || null,
      };

      const response = await updateEnquiry(enquiryId, formattedEnquiry);
      onEnquiryUpdated(response.data);
      handleClose();
      showToast('Enquiry updated successfully!');
    } catch (err) {
      console.error('Error updating enquiry:', err);
      showToast(err.message || 'Failed to update enquiry. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        name: '',
        email: '',
        phoneNo: '',
        companyName: '',
        userType: '',
        state: '',
        city: '',
        pincode: '',
        productDesignNumber: '',
        source: 'Email',
        notes: '',
        role: 'Customer',
        status: 'New',
      });
      setValidationErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Edit Enquiry" size="xl">
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner className="text-primary" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Edit Enquiry - ${enquiryId}`} size="xl">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Customer Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput label="Name" name="name" required />
            <FormInput label="Email" name="email" type="email" required />
            <FormInput label="Phone" name="phoneNo" type="tel" required />
            <FormInput label="Company" name="companyName" />
            <FormSelect
              label="User Type"
              name="userType"
              options={[
                { value: '', label: 'Select User Type' },
                ...userTypes.map((type) => ({ value: type.id, label: type.name })),
              ]}
              required={userTypes.length > 0}
              disabled={userTypes.length === 0}
            />
            <FormSelect
              label="Role"
              name="role"
              options={roles.map((role) => ({ value: role, label: role }))}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Location Information</h3>
          <LocationSelector
            pincode={formData.pincode}
            state={formData.state}
            city={formData.city}
            onPincodeChange={(pincode) => {
              setFormData((prev) => ({ ...prev, pincode }));
              if (validationErrors.pincode) setValidationErrors((prev) => ({ ...prev, pincode: undefined }));
            }}
            onLocationChange={handleLocationChange}
            errors={validationErrors}
            required
          />
        </div>

        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Product Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput label="Design Number" name="productDesignNumber" />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Enquiry Details</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect
              label="Source"
              name="source"
              options={sources.map((source) => ({ value: source, label: source }))}
            />
            <FormSelect
              label="Status"
              name="status"
              options={[
                { value: 'New', label: 'New' },
                { value: 'InProgress', label: 'In Progress' },
                { value: 'Confirmed', label: 'Confirmed' },
                { value: 'Delivered', label: 'Delivered' },
                { value: 'Rejected', label: 'Rejected' },
              ]}
            />
          </div>
          <div className="mt-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
              placeholder="Additional notes or requirements..."
            />
          </div>
        </div>

        <div className="flex pt-4 space-x-3 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={submitting}
            className="flex items-center px-6 py-2 space-x-2 text-white rounded-lg bg-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting && <LoadingSpinner size="small" className="text-white" />}
            <span>{submitting ? 'Updating...' : 'Save Changes'}</span>
          </button>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditEnquiryModal;