import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { TrackDetailProvider } from './contexts/TrackDetailContext';
import { BeatDetailProvider } from './contexts/BeatDetailContext';
import { BackgroundProvider } from './contexts/BackgroundContext';
import { useScrollToTop } from './hooks/useScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import GlobalBeatDetailModal from './components/GlobalBeatDetailModal';
import BackgroundRenderer from './components/BackgroundRenderer';
import BackgroundOverlay from './components/BackgroundOverlay';
import ShoppingCart from './components/ShoppingCart';
import Header from './components/Header';
import { useCartContext } from './contexts/CartContext';
import Navigation from './components/Navigation';

// Public pages
import HomePage from './App';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Shop pages (public)
import ShopHub from './pages/shop/ShopPage';
import BeatsShop from './pages/shop/BeatsPage';
import ServicesShop from './pages/shop/ServicesPage';
import MerchandiseShop from './pages/shop/MerchandisePage';
import ArtShop from './pages/shop/ArtPage';

// Standalone pages (public)
import TracksPage from './pages/TracksPage';
import RemixesPage from './pages/RemixesPage';
import ReleasesPage from './pages/ReleasesPage';
import DownloadGatePage from './pages/DownloadGatePage';
import SocialsPage from './pages/SocialsPage';
import ContactPage from './pages/ContactPage';
import CataloguePage from './pages/CataloguePage';
import DJSetsPage from './pages/DJSetsPage';
import ProductionsPage from './pages/ProductionsPage';
import SpotifyPage from './pages/SpotifyPage';
import SupportPage from './pages/SupportPage';
import AboutMePage from './pages/AboutMePage';
import StudioSessionPage from './pages/StudioSessionPage';
import DJPage from './pages/DJPage';
import MixMasterPage from './pages/MixMasterPage';

// Customer pages (protected - user role)
import CustomerDashboard from './pages/customer/DashboardPage';
import CustomerOrders from './pages/customer/OrdersPage';
import CustomerDownloads from './pages/customer/DownloadsPage';
import CustomerFreeDownloads from './pages/customer/FreeDownloadsPage';
import CustomerProfile from './pages/customer/ProfilePage';
import CustomerSettings from './pages/customer/SettingsPage';
import CustomerCollaborations from './pages/customer/CollaborationsPage';
import CustomerRequestArtistRole from './pages/customer/RequestArtistRolePage';
import CustomerShop from './pages/customer/ShopPage';
import CustomerChat from './pages/customer/ChatPage';
import CustomerMyProducts from './pages/customer/MyProductsPage';

// Artist pages (protected - artist role)
import ArtistDashboard from './pages/artist/DashboardPage';
import ArtistAgenda from './pages/artist/AgendaPage';
import ArtistBoard from './pages/artist/ArtistBoardPage';
import ArtistShop from './pages/artist/ShopPage';
import ArtistOrders from './pages/artist/OrdersPage';
import ArtistFreeDownloads from './pages/artist/FreeDownloadsPage';
import ArtistProfile from './pages/artist/ProfilePage';
import ArtistSettings from './pages/artist/SettingsPage';

// Admin pages (protected - admin role)
import AdminDashboard from './pages/admin/DashboardPage';
import AdminBeats from './pages/admin/BeatsPage';
import AdminTracks from './pages/admin/TracksPage';
import AdminRemixes from './pages/admin/RemixesPage';
import AdminOrders from './pages/admin/OrdersPage';
import AdminProductManagement from './pages/admin/ProductManagementPage';
import AdminContent from './pages/admin/ContentPage';
import AdminAnalytics from './pages/admin/AnalyticsPage';
import AdminCollaborations from './pages/admin/CollaborationsPage';
import AdminCollabRequests from './pages/admin/CollabRequestsPage';
import AdminArtistRoleRequests from './pages/admin/ArtistRoleRequestsPage';
import AdminBoard from './pages/admin/AdminBoardPage';
import AdminSettings from './pages/admin/SettingsPage';
import AdminChat from './pages/admin/ChatPage';
import AdminDiscountCodes from './pages/admin/DiscountCodesPage';
import AdminArt from './pages/admin/ArtAdminPage';
import AdminServices from './pages/admin/ServicesPage';
import AdminMerchandise from './pages/admin/MerchandiseAdminPage';
import AdminPlaylists from './pages/admin/PlaylistsPage';
import AdminAgenda from './pages/admin/AgendaPage';
import AdminProjects from './pages/admin/ProjectsAdminPage';

// Manager pages (protected - manager role)
import ManagerDashboard from './pages/manager/DashboardPage';
import ManagerBeats from './pages/manager/BeatsPage';
import ManagerCollaborations from './pages/manager/CollaborationsPage';
import ManagerChat from './pages/manager/ChatPage';
import ManagerAgendaPage from './pages/manager/AgendaPage';
import { ManagerProjectsPage as ManagerProjects } from './pages/admin/ProjectsAdminPage';

// Checkout pages (public)
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';

// Global Shopping Cart component using CartContext
const GlobalShoppingCart = () => {
  const navigate = useNavigate();
  const { cartItems, isOpen, setIsOpen, removeFromCart, clearCart } = useCartContext();
  const { user } = useAuth();

  // Listen for cart open event from Header
  React.useEffect(() => {
    const handleOpenCart = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-cart', handleOpenCart);
    return () => window.removeEventListener('open-cart', handleOpenCart);
  }, [setIsOpen]);

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  const handleLoginRequired = () => {
    setIsOpen(false);
    navigate('/register');
  };

  return (
    <ShoppingCart
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      items={cartItems}
      onRemoveItem={(beatId) => removeFromCart(beatId)}
      onClearCart={clearCart}
      onCheckout={handleCheckout}
      isLoggedIn={!!user}
      onLoginRequired={handleLoginRequired}
    />
  );
};

// Scroll to top on route change
const ScrollToTopWrapper = ({ children }: { children: React.ReactNode }) => {
  useScrollToTop();
  return <>{children}</>;
};

// Alleen padding toepassen op publieke pagina's (niet op admin/artist/customer/manager)
const PublicPaddingWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isProtectedRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/manager') ||
    location.pathname.startsWith('/artist') ||
    location.pathname.startsWith('/customer');
  return <div className={isProtectedRoute ? '' : 'pt-28 sm:pt-32'}>{children}</div>;
};

const MainApp: React.FC = () => {
  return (
    <BackgroundProvider>
      <BackgroundRenderer />
      <AuthProvider>
        <CartProvider>
          <TrackDetailProvider>
            <BeatDetailProvider>
              <BrowserRouter>
                <Header />
                <Navigation />
                <ScrollToTopWrapper>
                  <BackgroundOverlay />
                  <GlobalAudioPlayer />
                  <GlobalBeatDetailModal />
                  <GlobalShoppingCart />
                  <PublicPaddingWrapper>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Shop Routes (public) */}
                  <Route path="/shop" element={<ShopHub />} />
                  <Route path="/shop/beats" element={<BeatsShop />} />
                  <Route path="/shop/services" element={<ServicesShop />} />
                  <Route path="/shop/merchandise" element={<MerchandiseShop />} />
                  <Route path="/shop/art" element={<ArtShop />} />

                  {/* Standalone Pages (public) */}
                  <Route path="/catalogue" element={<CataloguePage />} />
                  <Route path="/tracks" element={<TracksPage />} />
                  <Route path="/my-tracks" element={<TracksPage />} />
                  <Route path="/remixes" element={<RemixesPage />} />
                  <Route path="/dj-sets" element={<DJSetsPage />} />
                  <Route path="/productions" element={<ProductionsPage />} />
                  <Route path="/spotify" element={<SpotifyPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/about" element={<AboutMePage />} />
                  <Route path="/releases" element={<ReleasesPage />} />
                  <Route path="/download/:trackId" element={<DownloadGatePage />} />
                  <Route path="/socials" element={<SocialsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/studio-session" element={<StudioSessionPage />} />
                  <Route path="/dj" element={<DJPage />} />
                  <Route path="/mix-master" element={<MixMasterPage />} />

                  {/* Checkout (public) */}
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/checkout-success" element={<CheckoutSuccessPage />} />

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
          {/* Free Downloads removed - merged into My Products */}
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
          <Route
            path="/customer/my-products"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <CustomerMyProducts />
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
            path="/artist/agenda"
            element={
              <ProtectedRoute allowedRoles={['artist']}>
                <ArtistAgenda />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist/board"
            element={
              <ProtectedRoute allowedRoles={['artist']}>
                <ArtistBoard />
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
          {/* Free Downloads removed - merged into My Products */}
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
            path="/admin/art"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminArt />
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
            path="/admin/tracks"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTracks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/remixes"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminRemixes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/playlists"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPlaylists />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/agenda"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAgenda />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminServices />
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
            path="/admin/product-management"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProductManagement />
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
            path="/admin/board"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminBoard />
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
          <Route
            path="/admin/discount-codes"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDiscountCodes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/merchandise"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminMerchandise />
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
          <Route
            path="/manager/agenda"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerAgendaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/projects"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerProjects />
              </ProtectedRoute>
            }
          />

          {/* Redirect /manager to dashboard */}
          <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                  </PublicPaddingWrapper>
                </ScrollToTopWrapper>
              </BrowserRouter>
            </BeatDetailProvider>
          </TrackDetailProvider>
        </CartProvider>
      </AuthProvider>
    </BackgroundProvider>
    );
  };

export default MainApp;
