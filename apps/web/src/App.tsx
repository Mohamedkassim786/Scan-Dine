import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// Public & Landing
import { LandingPage } from './pages/LandingPage';

// Customer Pages
import { WelcomePage } from './pages/customer/WelcomePage';
import { MenuPage } from './pages/customer/MenuPage';
import { SearchPage } from './pages/customer/SearchPage';
import { CartPage } from './pages/customer/CartPage';
import { OrderSuccessPage } from './pages/customer/OrderSuccessPage';
import { OrderTrackingPage } from './pages/customer/OrderTrackingPage';
import { CustomerOrdersPage } from './pages/customer/CustomerOrdersPage';
import { DineAIPage } from './pages/customer/DineAIPage';

// Chef Pages
import { ChefLoginPage } from './pages/chef/ChefLoginPage';
import { ChefDashboardPage } from './pages/chef/ChefDashboardPage';

// Admin Pages (All 18 Modules)
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminMenuPage } from './pages/admin/AdminMenuPage';
import { AdminAddonsPage } from './pages/admin/AdminAddonsPage';
import { AdminTablesPage } from './pages/admin/AdminTablesPage';
import { AdminQRCodesPage } from './pages/admin/AdminQRCodesPage';
import { AdminChefsPage } from './pages/admin/AdminChefsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminAIInsightsPage } from './pages/admin/AdminAIInsightsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminRestaurantPage } from './pages/admin/AdminRestaurantPage';
import { AdminStaffPage } from './pages/admin/AdminStaffPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

// Route Guards
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

const ProtectedChefRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/chef/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  const { loadStoredAuth } = useAuthStore();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Customer Experience (QR Code Routes - NO AUTH REQUIRED) */}
        <Route path="/r/:slug/t/:token" element={<WelcomePage />} />
        <Route path="/r/:slug/t/:token/menu" element={<MenuPage />} />
        <Route path="/r/:slug/t/:token/search" element={<SearchPage />} />
        <Route path="/r/:slug/t/:token/cart" element={<CartPage />} />
        <Route path="/r/:slug/t/:token/order-success/:orderId" element={<OrderSuccessPage />} />
        <Route path="/r/:slug/t/:token/track/:orderId" element={<OrderTrackingPage />} />
        <Route path="/r/:slug/t/:token/orders" element={<CustomerOrdersPage />} />
        <Route path="/r/:slug/t/:token/assistant" element={<DineAIPage />} />

        {/* Chef Experience */}
        <Route path="/chef/login" element={<ChefLoginPage />} />
        <Route
          path="/chef/kitchen"
          element={
            <ProtectedChefRoute>
              <ChefDashboardPage />
            </ProtectedChefRoute>
          }
        />

        {/* Admin Portal (All 18 Modules) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboardPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedAdminRoute>
              <AdminOrdersPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <ProtectedAdminRoute>
              <AdminPaymentsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedAdminRoute>
              <AdminCategoriesPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <ProtectedAdminRoute>
              <AdminMenuPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/addons"
          element={
            <ProtectedAdminRoute>
              <AdminAddonsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/tables"
          element={
            <ProtectedAdminRoute>
              <AdminTablesPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/qr-codes"
          element={
            <ProtectedAdminRoute>
              <AdminQRCodesPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/chefs"
          element={
            <ProtectedAdminRoute>
              <AdminChefsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedAdminRoute>
              <AdminAnalyticsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/ai-insights"
          element={
            <ProtectedAdminRoute>
              <AdminAIInsightsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedAdminRoute>
              <AdminReportsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/restaurant"
          element={
            <ProtectedAdminRoute>
              <AdminRestaurantPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <ProtectedAdminRoute>
              <AdminStaffPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedAdminRoute>
              <AdminNotificationsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedAdminRoute>
              <AdminSettingsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedAdminRoute>
              <AdminProfilePage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedAdminRoute>
              <AdminAuditLogsPage />
            </ProtectedAdminRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
