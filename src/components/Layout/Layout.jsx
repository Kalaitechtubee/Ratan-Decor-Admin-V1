// src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout = ({ children, currentPage, userRole, onLogout, currentUser }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 font-roboto overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          currentPage={currentPage}
          userRole={userRole}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={onLogout}
          currentUser={currentUser}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64">
            <Sidebar
              currentPage={currentPage}
              userRole={userRole}
              isCollapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
              onLogout={onLogout}
              currentUser={currentUser}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          userRole={userRole}
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          currentUser={currentUser}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;