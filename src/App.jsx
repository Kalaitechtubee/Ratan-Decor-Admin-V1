// src/App.jsx - Updated with correct requiredAccess for Video Call route
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ToastContainer, toast } from 'react-toastify';
import Layout from './components/Layout/Layout';
import Login from './components/Login/Login';
import VideoCallAppointmentsList from './components/VideoCallAppointmentsList/VideoCallAppointmentsList';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { protectedRoutes, defaultRoute, getCurrentPageFromPath, getNotFoundComponent } from './routes';
import { login, logout, isAuthenticated, getCurrentUser, clearAuth, setAuthData } from './services/Api';
import { getAccessToken, clearAuthData } from './utils/tokenHandler';
import 'react-toastify/dist/ReactToastify.css';

const validateUserData = (user) => {
  return user && user.id && user.email && user.role;
};

// Enhanced AppContent with Video Call routes
const AppContent = ({ isAuthenticated, currentUser, onLogout }) => {
  const location = useLocation();
  const currentPage = getCurrentPageFromPath(location.pathname);

  // Global toast notification handler
  const showToast = (message, type = 'success') => {
    if (type === 'error') {
      toast.error(message);
    } else if (type === 'warning') {
      toast.warning(message);
    } else if (type === 'info') {
      toast.info(message);
    } else {
      toast.success(message);
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      userRole={currentUser?.role || 'admin'}
      onLogout={onLogout}
      currentUser={currentUser}
      className="font-roboto text-primary"
    >
      <Routes>
        {/* Existing protected routes */}
        {protectedRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute
                route={route}
                isLoading={false}
              >
                <route.element currentUser={currentUser} onToast={showToast} />
              </ProtectedRoute>
            }
          />
        ))}

        {/* Video Call Enquiry Routes */}
        <Route
          path="/video-call-appointments"
          element={
            <ProtectedRoute 
              route={{
                path: '/video-call-appointments',
                isPublic: false,
                requiredAccess: 'requireEnquiriesAccess'
              }}
              isLoading={false}
            >
              <VideoCallAppointmentsList currentUser={currentUser} />
            </ProtectedRoute>
          }
        />

        {/* Default and 404 routes */}
        <Route path="/" element={<Navigate to={defaultRoute} replace />} />
        <Route path="*" element={getNotFoundComponent()} />
      </Routes>
    </Layout>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Tokens are now in secure httpOnly cookies - check for user data instead
        const { getUser } = await import('./utils/tokenHandler');
        let userData = getUser();
        
        // If no user in localStorage, try to get from API (cookies will be sent automatically)
        if (!userData) {
          try {
            const userResult = await getCurrentUser();
            if (userResult.success && userResult.user) {
              userData = userResult.user;
              // Store it for future use
              if (userData) {
                const { setUser } = await import('./utils/tokenHandler');
                setUser(userData);
              }
            }
          } catch (apiError) {
            // If it's a network error, keep state and allow retry
            const msg = apiError?.message || '';
            if (!msg.toLowerCase().includes('network')) {
              console.log('API call failed, user not authenticated');
            } else {
              console.warn('Network issue while checking auth, leaving state unchanged');
            }
          }
        }

        // Validate user data
        if (userData && validateUserData(userData)) {
          setIsAuthenticated(true);
          setCurrentUser(userData);
        } else {
          console.warn('Invalid user data, clearing auth');
          clearAuthData();
          clearAuth();
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        clearAuthData();
        clearAuth();
        setIsAuthenticated(false);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = async (user) => {
    try {
      console.log('handleLogin called with user:', user);
      // Set authentication state based on passed user data
      if (user && user.id && user.email) {
        // Ensure user is stored in tokenHandler
        const { setUser: storeUser } = await import('./utils/tokenHandler');
        storeUser(user);
        setAuthData(user);
        setIsAuthenticated(true);
        setCurrentUser(user);
        console.log('Login state updated successfully');
        return true;
      } else {
        throw new Error('Invalid user data received');
      }
    } catch (error) {
      console.error('Error during login state update:', error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookies on backend
      await logout();
      // Clear local state
      clearAuth();
      setIsAuthenticated(false);
      setCurrentUser(null);
      // Force navigation to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API fails, clear local state and redirect
      clearAuth();
      setIsAuthenticated(false);
      setCurrentUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <HelmetProvider>
      <Router>
        <div className="App">
          {/* Enhanced Toast Container */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to={defaultRoute} replace />
                ) : (
                  <Login 
                    onLogin={handleLogin}
                    isLoading={isLoading}
                  />
                )
              }
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute 
                  route={{ isPublic: false }}
                  isLoading={isLoading}
                >
                  <AppContent
                    isAuthenticated={isAuthenticated}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                  />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;