// src/components/Layout/TopBar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, Menu, LogOut } from 'lucide-react';

const TopBar = ({ userRole, onMobileMenuToggle, currentUser, onLogout }) => {
  const navigate = useNavigate();

  const getRoleDisplay = (role) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 font-roboto animate-fade-in-left">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} className="text-primary" />
        </button>

        {/* Search Bar */}
        <div className="flex-1 mx-4 max-w-md">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-roboto text-sm"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-700">{currentUser?.name || 'Admin User'}</div>
              <div className="text-xs text-gray-500">{getRoleDisplay(userRole)}</div>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
              <User size={16} className="text-white" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut size={18} className="text-gray-600 hover:text-primary" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;