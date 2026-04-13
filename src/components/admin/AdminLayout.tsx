import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Admin navigation layout component
import {
  LayoutDashboard,
  Music,
  ShoppingCart,
  CalendarDays,
  Handshake,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  UserPlus,
  Home,
  Zap,
  Palette,
  Image,
  Ticket,
  Package,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Art', href: '/admin/art', icon: Palette },
    { name: 'Beats', href: '/admin/beats', icon: Music },
    { name: 'Tracks', href: '/admin/tracks', icon: Music },
    { name: 'Playlists', href: '/admin/playlists', icon: Music },
    { name: 'Remixes', href: '/admin/remixes', icon: Music },
    { name: 'Services', href: '/admin/services', icon: Zap },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Social Media', href: '/admin/content', icon: CalendarDays },
    { name: 'Collaborations', href: '/admin/collaborations', icon: Handshake },
    { name: 'Collab Requests', href: '/admin/collab-requests', icon: Clock },
    { name: 'Artist Requests', href: '/admin/artist-role-requests', icon: UserPlus },
    { name: 'Discount Codes', href: '/admin/discount-codes', icon: Ticket },
    { name: 'Merchandise', href: '/admin/merchandise', icon: Package },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-56 sm:w-64 bg-neutral-950/95 backdrop-blur-xl border-r border-white/[0.08] transform transition-transform duration-300 overflow-hidden flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white truncate">Jonna Rincon</h1>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">Admin Panel</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/40 hover:text-white flex-shrink-0 ml-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user?.displayName?.[0] || user?.email?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.displayName || 'Admin'}
              </p>
              <p className="text-xs text-white/25 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-2xl transition-all duration-200 text-sm ${
                  isActive(item.href)
                    ? 'bg-white/[0.08] text-white font-semibold'
                    : 'text-white/40 hover:bg-white/[0.04] hover:text-white/80'
                }`}
              >
                <Icon size={17} className="flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="px-3 py-3 border-t border-white/[0.06] flex-shrink-0">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 w-full px-3 py-2.5 text-white/30 hover:bg-white/[0.04] hover:text-white/60 rounded-2xl transition-all duration-200 text-sm"
          >
            <LogOut size={17} className="flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'pl-0'}`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white/40 hover:text-white lg:hidden"
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-white/30">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                })}
              </p>
            </div>
            <Link
              to="/"
              className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] px-4 py-2 rounded-2xl text-white/70 hover:text-white font-medium transition-all flex items-center gap-2 text-sm"
            >
              <Home size={16} />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </div>

        {/* Page Content */}
        <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
