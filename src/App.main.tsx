import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import HomePage from './App';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Shop pages (public)
import BeatsShop from './pages/shop/BeatsPage';

// Customer pages (protected - user role)
import CustomerDashboard from './pages/customer/DashboardPage';
import CustomerOrders from './pages/customer/OrdersPage';
import CustomerDownloads from './pages/customer/DownloadsPage';
import CustomerProfile from './pages/customer/ProfilePage';
import CustomerSettings from './pages/customer/SettingsPage';
import CustomerCollaborations from './pages/customer/CollaborationsPage';
import CustomerRequestArtistRole from './pages/customer/RequestArtistRolePage';
import CustomerShop from './pages/customer/ShopPage';
import CustomerChat from './pages/customer/ChatPage';

// Artist pages (protected - artist role)
import ArtistDashboard from './pages/artist/DashboardPage';
import ArtistCollaborations from './pages/artist/CollaborationsPage';
import ArtistRequestCollab from './pages/artist/RequestCollabPage';
import ArtistShop from './pages/artist/ShopPage';
import ArtistOrders from './pages/artist/OrdersPage';
import ArtistProfile from './pages/artist/ProfilePage';
import ArtistSettings from './pages/artist/SettingsPage';

// Admin pages (protected - admin role)
import AdminDashboard from './pages/admin/DashboardPage';
import AdminBeats from './pages/admin/BeatsPage';
import AdminOrders from './pages/admin/OrdersPage';
import AdminContent from './pages/admin/ContentPage';
import AdminAnalytics from './pages/admin/AnalyticsPage';
import AdminCollaborations from './pages/admin/CollaborationsPage';
import AdminCollabRequests from './pages/admin/CollabRequestsPage';
import AdminArtistRoleRequests from './pages/admin/ArtistRoleRequestsPage';
import AdminSettings from './pages/admin/SettingsPage';
import AdminChat from './pages/admin/ChatPage';

// Manager pages (protected - manager role)
import ManagerDashboard from './pages/manager/DashboardPage';
import ManagerBeats from './pages/manager/BeatsPage';
import ManagerCollaborations from './pages/manager/CollaborationsPage';
import ManagerChat from './pages/manager/ChatPage';

const MainApp: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Shop Routes (public) */}
          <Route path="/shop/beats" element={<BeatsShop />} />

          {/* Customer Routes (protected - user role only) */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/shop"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <CustomerShop />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/orders"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <CustomerOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/downloads"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <CustomerDownloads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <CustomerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/collaborations"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <CustomerCollaborations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/chat"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <CustomerChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/settings"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <CustomerSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/request-artist-role"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <CustomerRequestArtistRole />
              </ProtectedRoute>
            }
          />

          {/* Artist Routes (protected - artist role only) */}
          <Route
            path="/artist/dashboard"
            element={
              <ProtectedRoute allowedRoles={['artist']}>
                <ArtistDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist/collaborations"
            element={
              <ProtectedRoute allowedRoles={['artist']}>
                <ArtistCollaborations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist/request-collab"
            element={
              <ProtectedRoute allowedRoles={['artist']}>
                <ArtistRequestCollab />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist/beats"
            element={
              <ProtectedRoute allowedRoles={['artist']}>
                <ArtistShop />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist/orders"
            element={
              <ProtectedRoute allowedRoles={['artist']}>
                <ArtistOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist/profile"
            element={
              <ProtectedRoute allowedRoles={['artist']}>
                <ArtistProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist/settings"
            element={
              <ProtectedRoute allowedRoles={['artist']}>
                <ArtistSettings />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes (protected - admin role only) */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/beats"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminBeats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/collaborations"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCollaborations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/collab-requests"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCollabRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/artist-role-requests"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminArtistRoleRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/chat"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminChat />
              </ProtectedRoute>
            }
          />

          {/* Redirect /admin to dashboard */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Manager Routes (protected - manager role only) */}
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/beats"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerBeats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/collaborations"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerCollaborations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/chat"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerChat />
              </ProtectedRoute>
            }
          />

          {/* Redirect /manager to dashboard */}
          <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default MainApp;
