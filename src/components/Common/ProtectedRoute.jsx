import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { canAccessRoute } from '../../utils/roleAccess';
import { getCurrentUser } from '../../utils/auth';

/**
 * ProtectedRoute Component
 * Handles authentication and role-based access control
 */
const ProtectedRoute = ({ children, route, isLoading = false }) => {
  const location = useLocation();
  const user = getCurrentUser();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full border-b-2 animate-spin border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (route && !canAccessRoute(user, route)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          {route.requiredRole && (
            <p className="text-sm text-gray-500 mb-4">
              Required role: {Array.isArray(route.requiredRole) ? route.requiredRole.join(', ') : route.requiredRole}
            </p>
          )}
          {route.requiredAccess && (
            <p className="text-sm text-gray-500 mb-4">
              Required access: {route.requiredAccess}
            </p>
          )}
          <p className="text-sm text-gray-500 mb-6">
            Your role: <span className="font-semibold">{user.role || 'Unknown'}</span>
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

