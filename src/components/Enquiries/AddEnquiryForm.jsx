import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, MapPin, CheckCircle, ChevronDown } from 'lucide-react';
import Modal from '../Common/Modal';
import { createEnquiry } from './EnquiryApi';
import { getUserTypes } from '../../services/Api'; // Adjust the import path as needed

// Loading spinner component
const LoadingSpinner = ({ size = 'default', className = '' }) => {
  const sizeClass = size === 'small' ? 'w-4 h-4' : 'w-6 h-6';
  return <Loader2 className={`animate-spin ${sizeClass} ${className}`} />;
};

// Input component
const FormInput = ({ label, name, type = 'text', value, onChange, hasError, required = false, ...props }) => (
  <div>
    <label className="block mb-2 text-sm font-medium text-gray-700">
      {label} {required && <span className="text-primary">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 rounded-lg border transition-shadow ${
        hasError
          ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
          : 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent'
      }`}
      {...props}
    />
    {hasError && <p className="mt-1 text-sm text-red-600">{hasError}</p>}
  </div>
);

// Select component
const FormSelect = ({ label, name, options, value, onChange, hasError, required = false, disabled = false, showPlaceholder = false, ...props }) => (
  <div>
    <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-700">
      {label} {required && <span className="text-primary">*</span>}
    </label>
    <div className="relative">
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-required={required}
        aria-invalid={!!hasError}
        aria-describedby={hasError ? `${name}-error` : undefined}
        className={`w-full px-3 py-2 rounded-lg border appearance-none bg-white transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed ${
          hasError
            ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
            : 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent'
        }`}
        {...props}
      >
        {showPlaceholder && (
          <option value="">-- Select {label} --</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
      />
    </div>
    {hasError && (
      <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
        {hasError}
      </p>
    )}
    {disabled && (
      <p className="mt-1 text-sm text-gray-500">
        No {label.toLowerCase()} options available. Please contact support.
      </p>
    )}
  </div>
);

// TimePicker component for videoCallTime
const TimePicker = ({ label, name, value, onChange, hasError, required }) => {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);

  // 24-hour format hours & minutes
  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  // Temporary selection state
  const [selectedHour, setSelectedHour] = useState("10");
  const [selectedMin, setSelectedMin] = useState("30");

  /* ---- Open picker & load existing time ---- */
  const handleOpen = () => {
    if (value) {
      const [h, m] = value.split(":");
      setSelectedHour(h);
      setSelectedMin(m);
    }
    setOpen(true);
  };

  const applyTime = () => {
    const formatted = `${selectedHour}:${selectedMin}`;
    onChange(name, formatted);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={pickerRef}>
      <label className="block mb-2 text-sm font-medium text-gray-700">
        {label} {required && <span className="text-primary">*</span>}
      </label>

      {/* Input box */}
      <div
        onClick={handleOpen}
        className={`w-full px-3 py-2 rounded-lg border bg-white cursor-pointer ${
          hasError ? "border-red-300" : "border-gray-300"
        }`}
      >
        {value || "--:--"}
      </div>

      {hasError && <p className="mt-1 text-sm text-red-600">{hasError}</p>}

      {/* Popup */}
      {open && (
        <div className="absolute left-0 mt-2 bg-white shadow-lg border rounded-lg p-4 z-50 w-72">

          {/* Title */}
          <div className="text-sm font-semibold mb-3 text-gray-800">
            Select Time
          </div>

          {/* Hour & Minute dropdowns */}
          <div className="grid grid-cols-2 gap-3 mb-4">

            {/* HOURS */}
            <select
              className="border rounded px-2 py-2 w-full"
              value={selectedHour}
              onChange={(e) => setSelectedHour(e.target.value)}
            >
              {hours.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>

            {/* MINUTES */}
            <select
              className="border rounded px-2 py-2 w-full"
              value={selectedMin}
              onChange={(e) => setSelectedMin(e.target.value)}
            >
              {minutes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* APPLY BUTTON */}
          <button
            onClick={applyTime}
            className="w-full py-2 text-white bg-primary rounded-lg hover:opacity-90"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

// LocationSelector component (unchanged)
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
            className={`w-full px-3 py-2 pr-10 rounded-lg border transition-all ${
              errors.pincode
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
            className={`w-full px-3 py-2 rounded-lg border transition-all ${
              errors.state
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
            className={`w-full px-3 py-2 rounded-lg border transition-all ${
              errors.city
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

const AddEnquiryForm = ({
  isOpen,
  onClose,
  onEnquiryAdded,
  roles = [],
  sources = [],
  showToast,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNo: '',
    companyName: '',
    userType: '', // Empty by default - requires manual selection
    state: '',
    city: '',
    pincode: '',
    productDesignNumber: '',
    source: 'Email',
    notes: '',
    role: 'Customer',
    videoCallDate: '',
    videoCallTime: '',
  });
  const [userTypes, setUserTypes] = useState([]);
  const [loadingUserTypes, setLoadingUserTypes] = useState(false);
  const [errorUserTypes, setErrorUserTypes] = useState(null);

  useEffect(() => {
    const fetchUserTypes = async () => {
      setLoadingUserTypes(true);
      setErrorUserTypes(null);
      try {
        const result = await getUserTypes();
        if (result.success) {
          setUserTypes(result.userTypes.map((type) => ({ value: type.id, label: type.name })));
        }
      } catch (err) {
        setErrorUserTypes('Failed to load user types. Please try again.');
        showToast('Failed to load user types. Please try again.', 'error');
      } finally {
        setLoadingUserTypes(false);
      }
    };

    if (isOpen) {
      fetchUserTypes();
    }
  }, [isOpen, showToast]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[0-9]{10,15}$/.test(phone.replace(/[^\d]/g, ''));
  const formatPhoneNumber = (phone) => phone.replace(/[^\d]/g, '');
  const validatePincode = (pincode) => (pincode ? /^\d{6}$/.test(pincode) : true);

  const validateForm = (data) => {
    const errors = {};
    const requiredFields = ['name', 'email', 'phoneNo', 'state', 'city', 'userType'];
    requiredFields.forEach((field) => {
      if (!data[field]?.toString().trim()) {
        if (field === 'userType') {
          errors[field] = 'Please select a user type';
        } else {
          errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        }
      }
    });
    if (data.email && !validateEmail(data.email)) errors.email = 'Please enter a valid email address';
    if (data.phoneNo && !validatePhone(data.phoneNo)) errors.phoneNo = 'Please enter a valid phone number (10-15 digits)';
    if (data.pincode && !validatePincode(data.pincode)) errors.pincode = 'Please enter a valid 6-digit pincode';
    return errors;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phoneNo: '',
      companyName: '',
      userType: '', // Reset to empty - requires manual selection
      state: '',
      city: '',
      pincode: '',
      productDesignNumber: '',
      source: 'Email',
      notes: '',
      role: 'Customer',
      videoCallDate: '',
      videoCallTime: '',
    });
    setValidationErrors({});
  };

  const handleInputChange = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
  }, [validationErrors]);

  const handleLocationChange = useCallback(({ state, city }) => {
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
  }, []);

  const handleSubmit = async () => {
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
        pincode: formData.pincode || null,
        videoCallDate: formData.videoCallDate || null,
        videoCallTime: formData.videoCallTime || null,
      };

      const response = await createEnquiry(formattedEnquiry);
      onEnquiryAdded(response.data);
      resetForm();
      onClose();
      showToast('Enquiry created successfully!');
    } catch (err) {
      console.error('Error adding enquiry:', err);
      showToast(err.message || 'Failed to create enquiry. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Enquiry" size="xl">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Customer Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Name"
              name="name"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              hasError={validationErrors.name}
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              hasError={validationErrors.email}
            />
            <FormInput
              label="Phone"
              name="phoneNo"
              type="tel"
              required
              value={formData.phoneNo}
              onChange={(e) => handleInputChange('phoneNo', e.target.value)}
              hasError={validationErrors.phoneNo}
            />
            <FormInput
              label="Company"
              name="companyName"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              hasError={validationErrors.companyName}
            />
            {loadingUserTypes ? (
              <div className="flex items-center justify-center h-12">
                <LoadingSpinner size="small" className="text-primary" />
              </div>
            ) : errorUserTypes ? (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  User Type <span className="text-primary">*</span>
                </label>
                <p className="text-sm text-red-600">{errorUserTypes}</p>
              </div>
            ) : userTypes.length > 0 ? (
              <FormSelect
                label="User Type"
                name="userType"
                options={userTypes}
                value={formData.userType}
                onChange={(e) => handleInputChange('userType', e.target.value)}
                hasError={validationErrors.userType}
                required
                showPlaceholder={true}
              />
            ) : (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  User Type <span className="text-primary">*</span>
                </label>
                <p className="text-sm text-gray-500">No user types available. Please contact support.</p>
              </div>
            )}
            <FormSelect
              label="Role"
              name="role"
              options={roles.map((role) => ({ value: role, label: role }))}
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              hasError={validationErrors.role}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Location Information</h3>
          <LocationSelector
            pincode={formData.pincode}
            state={formData.state}
            city={formData.city}
            onPincodeChange={(pincode) => handleInputChange('pincode', pincode)}
            onLocationChange={handleLocationChange}
            errors={validationErrors}
            required
          />
        </div>

        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Product Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Design Number"
              name="productDesignNumber"
              value={formData.productDesignNumber}
              onChange={(e) => handleInputChange('productDesignNumber', e.target.value)}
              hasError={validationErrors.productDesignNumber}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Video Call Scheduling</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Video Call Date"
              name="videoCallDate"
              type="date"
              value={formData.videoCallDate}
              onChange={(e) => handleInputChange('videoCallDate', e.target.value)}
              hasError={validationErrors.videoCallDate}
            />
            <TimePicker
              label="Video Call Time"
              name="videoCallTime"
              value={formData.videoCallTime}
              onChange={handleInputChange}
              hasError={validationErrors.videoCallTime}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Enquiry Details</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect
              label="Source"
              name="source"
              options={sources.map((source) => ({ value: source, label: source }))}
              value={formData.source}
              onChange={(e) => handleInputChange('source', e.target.value)}
              hasError={validationErrors.source}
            />
          </div>
          <div className="mt-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
              placeholder="Additional notes or requirements..."
            />
          </div>
        </div>

        <div className="flex pt-4 space-x-3 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={submitting || loadingUserTypes}
            className="flex items-center px-6 py-2 space-x-2 text-white rounded-lg bg-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting && <LoadingSpinner size="small" className="text-white" />}
            <span>{submitting ? 'Creating...' : 'Add Enquiry'}</span>
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

export default AddEnquiryForm;