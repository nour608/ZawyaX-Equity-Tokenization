import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useActiveAccount } from "thirdweb/react";
import { Sidebar, MobileSidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS, ROUTES } from "@/lib/constants";

export function AppLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useLocalStorage(STORAGE_KEYS.THEME, false);

  // Apply theme to document
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMobileNavigate = () => {
    setIsMobileSidebarOpen(false);
  };

  const account = useActiveAccount();

  // Redirect to landing page if not connected
  if (!account) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return (
    <div className="h-screen flex bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        <MobileSidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          onNavigate={handleMobileNavigate}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header
            onSidebarToggle={handleSidebarToggle}
            onThemeToggle={handleThemeToggle}
            isDarkMode={isDarkMode}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    );
}

/**
 * Simple dashboard layout for non-sidebar pages
 */
export function DashboardLayout() {
  const [isDarkMode, setIsDarkMode] = useLocalStorage(STORAGE_KEYS.THEME, false);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header
          onSidebarToggle={() => {}} // No sidebar in this layout
          onThemeToggle={() => setIsDarkMode(!isDarkMode)}
          isDarkMode={isDarkMode}
        />
        
        <main className="container mx-auto px-4 py-6">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}