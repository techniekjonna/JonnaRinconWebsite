import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useScrollToTop } from './hooks/useScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';

// Scroll to top on route change
const ScrollToTopWrapper = ({ children }: { children: React.ReactNode }) => {
  useScrollToTop();
  return <>{children}</>;
};

// Admin Pages
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import ArtAdminPage from './pages/admin/ArtAdminPage';
import BeatsPage from './pages/admin/BeatsPage';
import TracksPage from './pages/admin/TracksPage';
import AlbumsPage from './pages/admin/AlbumsPage';
import RemixesPage from './pages/admin/RemixesPage';
import EditsPage from './pages/admin/EditsPage';
import ServicesPage from './pages/admin/ServicesPage';
import OrdersPage from './pages/admin/OrdersPage';
import CollaborationsPage from './pages/admin/CollaborationsPage';
import DiscountCodesPage from './pages/admin/DiscountCodesPage';
import PlaylistsPage from './pages/admin/PlaylistsPage';
import AgendaPage from './pages/admin/AgendaPage';
import BackgroundToolPage from './pages/admin/BackgroundToolPage';
import ProjectsAdminPage from './pages/admin/ProjectsAdminPage';

const AdminApp: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTopWrapper>
            <Routes>
          {/* Login Route */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireAdmin={true}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/art"
            element={
              <ProtectedRoute requireAdmin={true}>
                <ArtAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/beats"
            element={
              <ProtectedRoute requireAdmin={true}>
                <BeatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tracks"
            element={
              <ProtectedRoute requireAdmin={true}>
                <TracksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/albums"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AlbumsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/remixes"
            element={
              <ProtectedRoute requireAdmin={true}>
                <RemixesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/edits"
            element={
              <ProtectedRoute requireAdmin={true}>
                <EditsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute requireAdmin={true}>
                <ServicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute requireAdmin={true}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/collaborations"
            element={
              <ProtectedRoute requireAdmin={true}>
                <CollaborationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/background"
            element={
              <ProtectedRoute requireAdmin={true}>
                <BackgroundToolPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/discount-codes"
            element={
              <ProtectedRoute requireAdmin={true}>
                <DiscountCodesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/playlists"
            element={
              <ProtectedRoute requireAdmin={true}>
                <PlaylistsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/agenda"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AgendaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute requireAdmin={true}>
                <ProjectsAdminPage />
              </ProtectedRoute>
            }
          />

          {/* Redirect /admin to dashboard */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ScrollToTopWrapper>
        </BrowserRouter>
      </AuthProvider>
    );
  };

export default AdminApp;