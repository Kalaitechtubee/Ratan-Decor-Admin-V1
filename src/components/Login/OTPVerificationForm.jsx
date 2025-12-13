import React, { useState } from 'react';

const OTPVerificationForm = ({ email, onOTPVerification, onBack, isLoading, errors, setErrors }) => {
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!otp) {
      setErrors({ otp: 'OTP is required' });
      return;
    }
    
    onOTPVerification(otp);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-primary">Email Verification</h2>
        <p className="text-gray-600 text-sm">Enter the OTP sent to {email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OTP Code
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.otp ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
          />
          {errors.otp && (
            <p className="text-red-500 text-sm mt-1">{errors.otp}</p>
          )}
        </div>

        <div className="space-y-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
};

export default OTPVerificationForm;
