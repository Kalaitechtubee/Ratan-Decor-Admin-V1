// src/components/Layout/Sidebar.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Folder,
  UserPlus,
  Search,
  Video,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Mail,
  FileText,
  Image,
} from 'lucide-react';
import { navigationItems, protectedRoutes } from '../../routes';
import { canAccessRoute } from '../../utils/roleAccess';

const iconMap = {
  dashboard: <LayoutDashboard size={20} />,
  enquiries: <MessageSquare size={20} />,
  orders: <ShoppingCart size={20} />,
  products: <Package size={20} />,
  customers: <Users size={20} />,
  category: <Folder size={20} />,
  'business-types': <Briefcase size={20} />,
  seo: <Search size={20} />,
  'video-call-appointments': <Video size={20} />,
  'order-enquiries': <MessageSquare size={20} />,
  'staff-registration': <UserPlus size={20} />,
  'staff-management': <Users size={20} />,
  'staff-list': <Users size={20} />,
  contacts: <Mail size={20} />,
  sliders: <Image size={20} />,
  'catalog-settings': <FileText size={20} />,
};

const Sidebar = ({ currentPage, userRole, isCollapsed, onToggleCollapse, onLogout, currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    // Auto-collapse on mobile/tablet (below desktop breakpoint)
    if (window.innerWidth < 1024) {
      onToggleCollapse();
    }
  };

  const toggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const isActivePage = (path) => {
    return location.pathname === path || (path === '/dashboard' && location.pathname === '/') ||
      (path === '/contacts' && location.pathname.startsWith('/contacts/'));
  };

  const isSubItemActive = (subItems) => {
    return subItems?.some((item) => location.pathname === item.path);
  };

  // Role-based navigation filtering using moduleAccess via canAccessRoute
  // Fixed logic for parents with subItems
  const getFilteredNavigationItems = () => {
    return navigationItems.filter(item => {
      if (item.subItems) {
        // For parents with subItems, filter subs and show parent if any sub accessible
        item.subItems = item.subItems.filter(subItem => {
          const subRoute = protectedRoutes.find(r => r.path === subItem.path);
          return subRoute ? canAccessRoute(currentUser, subRoute) : true;
        });
        return item.subItems.length > 0;
      } else {
        // For standalone items, check direct route access
        const route = protectedRoutes.find(r => r.path === item.path);
        if (route) {
          return canAccessRoute(currentUser, route);
        }
        return true;
      }
    }).map(item => ({
      ...item,
      subItems: item.subItems || []
    }));
  };

  const filteredNavigationItems = getFilteredNavigationItems();

  return (
    <div
      className={`bg-white shadow-lg transition-all duration-300 flex flex-col h-screen ${isCollapsed ? 'w-16' : 'w-64'
        } font-roboto`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex justify-between items-center">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-primary">Ratan Decor</h1>
              <p className="text-sm text-gray-500">Admin Panel</p>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg transition-colors hover:bg-gray-100"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <Menu size={20} className="text-primary" /> : <ChevronLeft size={20} className="text-primary" />}
          </button>
        </div>
      </div>
      {/* User Info */}
      {!isCollapsed && currentUser && (
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex justify-center items-center w-10 h-10 rounded-full bg-primary">
              <span className="text-sm font-semibold text-white">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{currentUser.name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser.role || 'admin'}</p>
            </div>
          </div>
        </div>
      )}
      {/* Navigation - Scrollable section */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-1">
          {filteredNavigationItems.map((item) => (
            <li key={item.id}>
              {item.subItems && item.subItems.length > 0 ? (
                <>
                  <button
                    onClick={() => toggleDropdown(item.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isSubItemActive(item.subItems)
                      ? 'bg-red-50 text-primary border-r-2 border-primary'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                      }`}
                    title={isCollapsed ? item.label : undefined}
                    aria-label={`Toggle ${item.label} dropdown`}
                  >
                    <span className={`flex-shrink-0 ${isSubItemActive(item.subItems) ? 'text-primary' : ''}`}>
                      {iconMap[item.icon] || <Folder size={20} />}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="ml-3 font-medium flex-1 text-left">{item.label}</span>
                        <span className="ml-2">{openDropdown === item.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</span>
                      </>
                    )}
                  </button>
                  {!isCollapsed && openDropdown === item.id && (
                    <ul className="ml-6 space-y-1 mt-1">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.id}>
                          <button
                            onClick={() => handleNavigation(subItem.path)}
                            className={`w-full flex items-center px-3 py-1 rounded-lg transition-all duration-200 ${isActivePage(subItem.path)
                              ? 'bg-red-50 text-primary'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                              }`}
                            title={subItem.label}
                            aria-label={`Navigate to ${subItem.label}`}
                          >
                            <span className={`flex-shrink-0 ${isActivePage(subItem.path) ? 'text-primary' : ''}`}>
                              {iconMap[subItem.icon] || <Folder size={18} />}
                            </span>
                            <span className="ml-3 font-medium text-sm">{subItem.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActivePage(item.path)
                    ? 'bg-red-50 text-primary border-r-2 border-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                    }`}
                  title={isCollapsed ? item.label : undefined}
                  aria-label={`Navigate to ${item.label}`}
                >
                  <span className={`flex-shrink-0 ${isActivePage(item.path) ? 'text-primary' : ''}`}>
                    {iconMap[item.icon] || <Folder size={20} />}
                  </span>
                  {!isCollapsed && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>
      {/* Footer - Fixed at bottom */}
      <div className="p-2 border-t border-gray-200 flex-shrink-0">
        <div className="space-y-1">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-primary hover:bg-red-50 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            aria-label="Logout"
          >
            <LogOut size={20} className="text-primary" />
            {!isCollapsed && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>
      {/* Custom Scrollbar Styling (optional, for better UX on desktop) */}
      <style>{`
        nav::-webkit-scrollbar {
          width: 6px;
        }
        nav::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        nav::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        nav::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;