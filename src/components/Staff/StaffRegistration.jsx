import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { createStaffUser } from '../../services/Api'; // Assuming API service has createStaffUser

const StaffRegistration = ({ currentUser, onToast }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Sales'
  });



  const [formErrors, setFormErrors] = useState({});

  // Updated staff roles to match backend: no Manager
  const staffRoles = [
    { value: 'Sales', label: 'Sales', description: 'Handles sales inquiries and orders' },
    { value: 'Support', label: 'Support', description: 'Provides customer support' },
    // Admin only if currentUser is SuperAdmin
    ...(currentUser?.role === 'SuperAdmin' ? [{ value: 'Admin', label: 'Admin', description: 'Full administrative access' }] : [])
  ];




  const validateForm = (form, isStaff = true) => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = 'Name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Invalid email format';
    }

    if (!form.password.trim()) {
      errors.password = 'Password is required';
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(form.password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(form.password)) {
      errors.password = 'Password must contain at least one lowercase letter';
    } else if (!/\d/.test(form.password)) {
      errors.password = 'Password must contain at least one number';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
      errors.password = 'Password must contain at least one special character';
    }

    if (isStaff && !form.role) {
      errors.role = 'Role is required';
    }

    if (!isStaff && !form.secretKey.trim()) {
      errors.secretKey = 'Secret key is required';
    }

    return errors;
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm(staffForm, true);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    setFormErrors({});

    try {
      const response = await createStaffUser({
        name: staffForm.name,
        email: staffForm.email,
        password: staffForm.password,
        role: staffForm.role
      });

      if (response.success) {
        setStaffForm({ name: '', email: '', password: '', role: 'Sales' });
        if (onToast) {
          onToast('Staff user created successfully', 'success');
        }
      } else {
        if (onToast) {
          onToast(response.message || 'Failed to create staff user', 'error');
        }
      }
    } catch (error) {
      console.error('Error creating staff user:', error);
      if (onToast) {
        onToast(error.message || 'Failed to create staff user', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };



  const handleStaffInputChange = (e) => {
    const { name, value } = e.target;
    setStaffForm(prev => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-[#ff4747] to-[#ff4747] text-white px-8 py-6">
            <div className="flex items-center">
              <UserPlus className="mr-3" size={32} />
              <div>
                <h1 className="text-2xl font-bold">Staff Management</h1>
                <p className="mt-1 text-red-100">Create and manage staff users</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">


              <div className="p-8">
                <form onSubmit={handleStaffSubmit} className="space-y-6">
                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="text-blue-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
                      <div>
                        <h3 className="text-sm font-semibold text-blue-800 mb-1">Staff User Creation</h3>
                        <p className="text-sm text-blue-700">
                          Staff users will be created with immediate access. Choose the appropriate role based on their responsibilities.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          name="name"
                          value={staffForm.name}
                          onChange={handleStaffInputChange}
                          className={`w-full pl-11 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#ff4747] focus:border-transparent transition-all ${formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          placeholder="Enter full name"
                          disabled={isLoading}
                        />
                      </div>
                      {formErrors.name && (
                        <p className="mt-1.5 text-xs text-red-600 flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="email"
                          name="email"
                          value={staffForm.email}
                          onChange={handleStaffInputChange}
                          className={`w-full pl-11 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#ff4747] focus:border-transparent transition-all ${formErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          placeholder="Enter email address"
                          disabled={isLoading}
                        />
                      </div>
                      {formErrors.email && (
                        <p className="mt-1.5 text-xs text-red-600 flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={staffForm.password}
                        onChange={handleStaffInputChange}
                        className={`w-full pl-11 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#ff4747] focus:border-transparent transition-all ${formErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="Enter password (min. 8 characters)"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center">
                        <AlertCircle size={12} className="mr-1" />
                        {formErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Select Role <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {staffRoles.map((role) => (
                        <label
                          key={role.value}
                          className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm ${staffForm.role === role.value
                            ? 'border-[#ff4747] bg-red-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={role.value}
                            checked={staffForm.role === role.value}
                            onChange={handleStaffInputChange}
                            className="mt-1 text-[#ff4747] focus:ring-[#ff4747]"
                            disabled={isLoading}
                          />
                          <div className="ml-3 flex-1">
                            <div className="font-semibold text-gray-900">{role.label}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{role.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    {formErrors.role && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center">
                        <AlertCircle size={12} className="mr-1" />
                        {formErrors.role}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || staffRoles.length === 0}
                    className="w-full bg-[#ff4747] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#dc2626] focus:ring-4 focus:ring-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating Staff User...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2" size={20} />
                        Create Staff User
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Information Sidebar - Updated roles */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4 pb-3 border-b border-gray-200">
                <div className="bg-[#ffe5e5] p-2 rounded-lg mr-3">
                  <Shield className="text-[#ff4747]" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Staff Roles</h3>
              </div>
              <div className="space-y-4">
                {staffRoles.map((role) => (
                  <div key={role.value} className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={18} />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{role.label}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{role.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4 pb-3 border-b border-gray-200">
                <div className="bg-[#ffe5e5] p-2 rounded-lg mr-3">
                  <Shield className="text-[#ff4747]" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Access Levels</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-semibold text-gray-900 text-sm mb-1">Staff Users</div>
                  <div className="text-xs text-gray-600">Role-based access to specific modules</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-semibold text-gray-900 text-sm mb-1">Admins</div>
                  <div className="text-xs text-gray-600">Full system access except user creation</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-semibold text-gray-900 text-sm mb-1">Super Admins</div>
                  <div className="text-xs text-gray-600">Complete system control and user management</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffRegistration;