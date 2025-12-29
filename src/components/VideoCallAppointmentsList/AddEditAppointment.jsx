// AddEditAppointment.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import Modal from "../Common/Modal";
import appointmentApi from "./appointmentApi";

/* ---------------- LOADING SPINNER ---------------- */
const LoadingSpinner = ({ size = "default", className = "" }) => {
  const sizeClass = size === "small" ? "w-4 h-4" : "w-6 h-6";
  return <Loader2 className={`animate-spin ${sizeClass} ${className}`} />;
};

/* ---------------- FORM INPUT COMPONENT ---------------- */
const FormInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  hasError,
  required = false,
  ...props
}) => (
  <div>
    <label className="block mb-2 text-sm font-medium text-gray-700">
      {label} {required && <span className="text-[#ff4747]">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      className={`w-full px-3 py-2 rounded-lg border transition-shadow text-sm ${hasError
          ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          : "border-gray-300 focus:ring-2 focus:ring-[#ff4747]/40 focus:border-[#ff4747]"
        }`}
      {...props}
    />
    {hasError && <p className="mt-1 text-sm text-red-600">{hasError}</p>}
  </div>
);

/* ---------------- FORM SELECT COMPONENT ---------------- */
const FormSelect = ({
  label,
  name,
  options,
  value,
  onChange,
  hasError,
  required = false,
  ...props
}) => (
  <div>
    <label className="block mb-2 text-sm font-medium text-gray-700">
      {label} {required && <span className="text-[#ff4747]">*</span>}
    </label>
    <select
      name={name}
      value={value || ""}
      onChange={onChange}
      className={`w-full px-3 py-2 rounded-lg border transition-shadow text-sm ${hasError
          ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          : "border-gray-300 focus:ring-2 focus:ring-[#ff4747]/40 focus:border-[#ff4747]"
        }`}
      {...props}
    >
      <option value="">Select {label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>

    {hasError && <p className="mt-1 text-sm text-red-600">{hasError}</p>}
  </div>
);


const TimePicker = ({ label, name, value, onChange, hasError, required }) => {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);

  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  const apm = ["AM", "PM"];

  const [selectedHour, setSelectedHour] = useState("10");
  const [selectedMin, setSelectedMin] = useState("00");
  const [selectedAP, setSelectedAP] = useState("AM");

  const openPicker = () => {
    if (value) {
      const [hhmm, ap] = value.split(" ");
      if (hhmm) {
        const [h, m] = hhmm.split(":");
        setSelectedHour(h);
        setSelectedMin(m);
      }
      if (ap) setSelectedAP(ap);
    }
    setOpen(true);
  };

  // DO NOT CLOSE ON SELECTION ANYMORE
  const updateTime = (h, m, a) => {
    const formatted = `${h}:${m} ${a}`;
    onChange(name, formatted);
  };

  // Close ONLY when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Hide scrollbar class
  const scrollClass =
    "h-48 overflow-y-scroll pr-2 scrollbar-hide";

  return (
    <div className="relative" ref={pickerRef}>
      <label className="block mb-2 text-sm font-medium text-gray-700">
        {label} {required && <span className="text-[#ff4747]">*</span>}
      </label>

      {/* Input */}
      <div
        onClick={() => setOpen(!open)}
        className={`w-full px-3 py-2 rounded-lg border bg-white cursor-pointer text-sm ${hasError ? "border-red-300" : "border-gray-300"
          }`}
      >
        {value || "--:-- --"}
      </div>

      {hasError && <p className="mt-1 text-sm text-red-600">{hasError}</p>}

      {/* Popup */}
      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 bg-white shadow-lg border rounded-lg p-3 w-64">
          <div className="text-sm font-semibold mb-2 text-gray-800">
            Select Time
          </div>

          <div className="flex space-x-2">

            {/* HOURS */}
            <div className="w-1/3 border-r pr-2">
              <div className={scrollClass}>
                {hours.map((h) => (
                  <div
                    key={h}
                    onClick={() => {
                      setSelectedHour(h);
                      updateTime(h, selectedMin, selectedAP);
                    }}
                    className={`px-3 py-2 rounded cursor-pointer select-none text-sm ${selectedHour === h
                        ? "bg-[#ff4747] text-white font-medium shadow-sm"
                        : "text-gray-700 hover:bg-[#ff4747]/10"
                      }`}
                  >
                    {h}
                  </div>
                ))}
              </div>
            </div>

            {/* MINUTES */}
            <div className="w-1/3 border-r pr-2">
              <div className={scrollClass}>
                {minutes.map((m) => (
                  <div
                    key={m}
                    onClick={() => {
                      setSelectedMin(m);
                      updateTime(selectedHour, m, selectedAP);
                    }}
                    className={`px-3 py-2 rounded cursor-pointer select-none text-sm ${selectedMin === m
                        ? "bg-[#ff4747] text-white font-medium shadow-sm"
                        : "text-gray-700 hover:bg-[#ff4747]/10"
                      }`}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>

            {/* AM / PM */}
            <div className="w-1/3">
              <div className={scrollClass}>
                {apm.map((a) => (
                  <div
                    key={a}
                    onClick={() => {
                      setSelectedAP(a);
                      updateTime(selectedHour, selectedMin, a);
                    }}
                    className={`px-3 py-2 rounded cursor-pointer select-none text-sm ${selectedAP === a
                        ? "bg-[#ff4747] text-white font-medium shadow-sm"
                        : "text-gray-700 hover:bg-[#ff4747]/10"
                      }`}
                  >
                    {a}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};



/* =====================================================
    MAIN COMPONENT
===================================================== */
const AddEditAppointment = ({
  isOpen,
  onClose,
  onSave,
  onToast,
  currentUser,
  appointment = null,
  title = "Add New Video Call Appointment",
  sources = ["WhatsApp", "Phone", "VideoCall", "Website"],
  statuses = ["New", "Confirmed", "Completed", "Cancelled"],
}) => {
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNo: "",
    videoCallDate: "",
    videoCallTime: "",
    source: "VideoCall",
    notes: "",
    status: "New",
  });

  const [validationErrors, setValidationErrors] = useState({});
  const isEdit = appointment !== null;

  useEffect(() => {
    if (isOpen) {
      setFormData(
        appointment
          ? {
            name: appointment.name || "",
            email: appointment.email || "",
            phoneNo: appointment.phoneNo || "",
            videoCallDate: appointment.videoCallDate || "",
            videoCallTime: appointment.videoCallTime || "",
            source: appointment.source || "VideoCall",
            notes: appointment.notes || "",
            status: appointment.status || "New",
          }
          : {
            name: "",
            email: "",
            phoneNo: "",
            videoCallDate: "",
            videoCallTime: "",
            source: "VideoCall",
            notes: "",
            status: "New",
          }
      );
      setValidationErrors({});
    }
  }, [isOpen, appointment]);

  // VALIDATION HELPERS
  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim()?.toLowerCase() || "");

  const validatePhone = (phone) =>
    /^[0-9]{10,15}$/.test(phone?.replace(/[^\d]/g, "") || "");

  const formatPhoneNumber = (phone) =>
    phone?.replace(/[^\d]/g, "") || "";

  const validateForm = (data) => {
    const errors = {};
    const requiredFields = ["name", "email", "phoneNo", "videoCallDate", "videoCallTime"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    requiredFields.forEach((field) => {
      if (!data[field]?.toString()?.trim()) {
        errors[field] =
          `${field.charAt(0).toUpperCase() + field.slice(1).replace('No', ' Number')} is required`;
      }
    });

    if (data.email && !validateEmail(data.email))
      errors.email = "Please enter a valid email address";

    if (data.phoneNo && !validatePhone(data.phoneNo))
      errors.phoneNo = "Please enter a valid phone number (10–15 digits)";

    if (data.videoCallDate) {
      const selectedDate = new Date(data.videoCallDate);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate < today) errors.videoCallDate = "Video call date cannot be in the past";
    }

    // Basic videoCallTime format check (expects "hh:mm AM/PM")
    if (data.videoCallTime && !/^\d{2}:\d{2}\s?(AM|PM)$/.test(data.videoCallTime)) {
      errors.videoCallTime = "Please select a valid time (e.g. 10:30 AM)";
    }

    return errors;
  };

  const handleInputChange = useCallback(
    (name, value) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (validationErrors[name])
        setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    },
    [validationErrors]
  );

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phoneNo: "",
      videoCallDate: "",
      videoCallTime: "",
      source: "VideoCall",
      notes: "",
      status: "New",
    });
    setValidationErrors({});
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setValidationErrors({});

      const errors = validateForm(formData);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        onToast && onToast("Please fix the validation errors", "error");
        setSubmitting(false);
        return;
      }

      const formattedAppointment = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNo: formatPhoneNumber(formData.phoneNo),
        videoCallDate: formData.videoCallDate,
        videoCallTime: formData.videoCallTime,
        source: formData.source,
        notes: formData.notes?.trim() || "",
        status: formData.status,
        userId: currentUser?.id || null,
      };

      let response;
      if (isEdit) {
        response = await appointmentApi.updateAppointment(
          appointment.id,
          formattedAppointment,
          currentUser
        );
      } else {
        response = await appointmentApi.createAppointment(formattedAppointment, currentUser);
      }

      onSave && onSave(response.data);
      resetForm();
      onClose && onClose();
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} appointment:`, err);
      onToast &&
        onToast(
          err?.message ||
          `Failed to ${isEdit ? 'update' : 'create'} appointment. Please try again.`,
          "error"
        );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose && onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="xl" aria-label={title}>
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-4">
        {/* CUSTOMER INFO */}
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Customer Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Name"
              name="name"
              required
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              hasError={validationErrors.name}
            />

            <FormInput
              label="Email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              hasError={validationErrors.email}
            />

            <FormInput
              label="Phone"
              name="phoneNo"
              type="tel"
              required
              value={formData.phoneNo}
              onChange={(e) => handleInputChange("phoneNo", e.target.value)}
              hasError={validationErrors.phoneNo}
              placeholder="Enter 10–15 digits"
            />
          </div>
        </div>

        {/* SCHEDULE */}
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Schedule Information</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Video Call Date <span className="text-[#ff4747]">*</span>
              </label>
              <input
                type="date"
                name="videoCallDate"
                value={formData.videoCallDate}
                onChange={(e) => handleInputChange("videoCallDate", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4747]/40 focus:border-[#ff4747] transition"
                required
              />
              {validationErrors.videoCallDate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.videoCallDate}</p>
              )}
            </div>

            {/* TIME PICKER: custom inline component */}
            <div>
              <TimePicker
                label="Video Call Time"
                name="videoCallTime"
                required
                value={formData.videoCallTime}
                onChange={(n, v) => handleInputChange(n, v)}
                hasError={validationErrors.videoCallTime}
              />
            </div>
          </div>
        </div>

        {/* DETAILS */}
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Appointment Details</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect
              label="Source"
              name="source"
              options={sources.map((s) => ({ value: s, label: s }))}
              value={formData.source}
              onChange={(e) => handleInputChange("source", e.target.value)}
              hasError={validationErrors.source}
            />

            <FormSelect
              label="Status"
              name="status"
              options={statuses.map((s) => ({ value: s, label: s }))}
              value={formData.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              hasError={validationErrors.status}
            />
          </div>

          <div className="mt-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#ff4747]/40 focus:border-[#ff4747] transition"
              placeholder="Additional notes or requirements..."
            />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex pt-4 space-x-3 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center px-6 py-2 space-x-2 text-white rounded-lg bg-[#ff4747] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting && <LoadingSpinner size="small" className="text-white" />}
            <span>{submitting ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Save Changes" : "Add Appointment")}</span>
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

export default AddEditAppointment;
