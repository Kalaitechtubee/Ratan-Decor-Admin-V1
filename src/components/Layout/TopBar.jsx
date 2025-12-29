// src/components/Layout/TopBar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Menu, LogOut } from 'lucide-react';

const TopBar = ({ userRole, onMobileMenuToggle, currentUser, onLogout }) => {
  const navigate = useNavigate();

  const getRoleDisplay = (role) =>
    role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Admin';

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const userInitial = currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : 'A';

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 font-roboto shadow-sm">
      <div className="flex items-center justify-between max-w-full lg:pr-6 xl:pr-5">


        {/* Left: Mobile Menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            aria-label="Open Menu"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Right: User Info */}
        <div className="flex items-center gap-4">

          {/* User Details */}
          <div className="hidden sm:flex flex-col text-right leading-tight">
            <span className="text-sm font-semibold text-gray-800">
              {currentUser?.name || 'Admin User'}
            </span>
            <span className="text-xs text-gray-500">
              {getRoleDisplay(userRole)}
            </span>
          </div>

          {/* Avatar */}
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full bg-primary text-white font-semibold flex items-center justify-center hover:bg-red-600 transition shadow-sm"
            title="View Profile"
          >
            {userInitial}
          </button>

          {/* Divider */}
          <span className="h-6 w-px bg-gray-300" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10 transition"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
