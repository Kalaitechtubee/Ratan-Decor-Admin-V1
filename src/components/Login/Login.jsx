import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../../services/Api'; // Import the login and register functions from api.js
import { setAuthData } from '../../utils/auth';
import { setAccessToken, setUser, clearAuthData } from '../../utils/tokenHandler';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import OTPVerificationForm from './OTPVerificationForm';
import ResetPasswordForm from './ResetPasswordForm';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentView, setCurrentView] = useState('login'); // login, register, forgot, otp, reset
  const [verifyingEmail, setVerifyingEmail] = useState('');

  const handleLogin = async (formData) => {
    setIsLoading(true);
    setErrors({});

    // Clear any old authentication data before logging in
    clearAuthData();

    try {
      const response = await login({ email: formData.email, password: formData.password });

      console.log('Login response:', response);

      // Store user data and authentication status using auth utilities
      // Note: Tokens are now in httpOnly cookies, so we only need to check for user data
      if (response && response.success && response.user) {
        // Store user data (tokens are automatically handled via httpOnly cookies)
        setUser(response.user);
        localStorage.setItem('isAuthenticated', 'true');

        console.log('User stored, calling onLogin callback');

        // Call the onLogin callback to update parent state
        if (onLogin && typeof onLogin === 'function') {
          onLogin(response.user);
        }

        // Use React Router navigate instead of window.location to avoid full page reload
        // This preserves React state and allows smooth navigation
        console.log('Login successful, navigating to dashboard');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      } else {
        console.error('Login response missing required fields:', response);
        throw new Error(response?.message || 'Login failed - invalid response');
      }
    } catch (error) {
      if (error.message.includes('Invalid credentials')) {
        setErrors({ general: 'Invalid email or password' });
      } else if (error.message.includes('pending approval')) {
        setErrors({ general: 'Your account is pending approval. You will be notified once approved.' });
      } else if (error.message.includes('rejected')) {
        setErrors({ general: 'Your account has been rejected. Please contact support.' });
      } else {
        setErrors({ general: error.message || 'An error occurred during login' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (registerData) => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await register(registerData);
      if (response.success) {
        // Auto login after successful registration
        const loginResponse = await login({
          email: registerData.email,
          password: registerData.password
        });
        if (loginResponse.success) {
          onLogin(loginResponse.user);
        } else {
          setErrors({ general: 'Registration successful but failed to login automatically' });
        }
      } else {
        setErrors({ general: response.message || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ general: error.message || 'Registration failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerification = async (email) => {
    setVerifyingEmail(email);
    setCurrentView('otp');

    // Simulate OTP generation
    setTimeout(() => {
      // In real app, this would send OTP to email
      alert(`OTP sent to ${email}. For demo, use: 123456`);
    }, 2000);
  };

  const handleOTPVerification = (otp) => {
    if (otp === '123456') {
      setCurrentView('reset');
      setErrors({});
    } else {
      setErrors({ otp: 'Invalid OTP' });
    }
  };

  const handleResetPassword = async (passwordData) => {
    setIsLoading(true);
    setErrors({});

    // Simulate API call
    setTimeout(() => {
      // Update mock data (in real app, this would be an API call)
      const userIndex = mockUsers.findIndex(u => u.email === verifyingEmail);
      if (userIndex !== -1) {
        mockUsers[userIndex].password = passwordData.newPassword;
        alert('Password updated successfully!');
        setCurrentView('login');
        setVerifyingEmail('');
      } else {
        setErrors({ general: 'Email not found' });
      }

      setIsLoading(false);
    }, 1000);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginForm
            onLogin={handleLogin}
            onShowRegister={() => setCurrentView('register')}
            onShowForgotPassword={() => setCurrentView('forgot')}
            isLoading={isLoading}
            errors={errors}
            setErrors={setErrors}
          />
        );

      case 'register':
        return (
          <RegisterForm
            onRegister={handleRegister}
            onBackToLogin={() => setCurrentView('login')}
            isLoading={isLoading}
            errors={errors}
            setErrors={setErrors}
          />
        );

      case 'forgot':
        return (
          <ForgotPasswordForm
            onEmailVerification={handleEmailVerification}
            onBackToLogin={() => setCurrentView('login')}
            isLoading={isLoading}
            errors={errors}
            setErrors={setErrors}
          />
        );

      case 'otp':
        return (
          <OTPVerificationForm
            email={verifyingEmail}
            onOTPVerification={handleOTPVerification}
            onBack={() => setCurrentView('forgot')}
            isLoading={isLoading}
            errors={errors}
            setErrors={setErrors}
          />
        );

      case 'reset':
        return (
          <ResetPasswordForm
            email={verifyingEmail}
            onResetPassword={handleResetPassword}
            onBack={() => setCurrentView('otp')}
            isLoading={isLoading}
            errors={errors}
            setErrors={setErrors}
          />
        );

      default:
        return (
          <LoginForm
            onLogin={handleLogin}
            onShowRegister={() => setCurrentView('register')}
            onShowForgotPassword={() => setCurrentView('forgot')}
            isLoading={isLoading}
            errors={errors}
            setErrors={setErrors}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4 font-roboto">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Ratan Decor</h1>
          <p className="text-gray-600 mt-2">Admin Panel</p>
        </div>

        {/* Current Form */}
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default Login;