import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Handshake,
  Music,
  ShoppingCart,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface ArtistLayoutProps {
  children: React.ReactNode;
}

const ArtistLayout: React.FC<ArtistLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/artist/dashboard', icon: LayoutDashboard },
    { name: 'Collaborations', href: '/artist/collaborations', icon: Handshake },
    { name: 'Shop Beats', href: '/artist/beats', icon: Music },
    { name: 'My Purchases', href: '/artist/orders', icon: ShoppingCart },
    { name: 'Profile', href: '/artist/profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-56 sm:w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 overflow-hidden flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 border-b border-gray-700 flex-shrink-0">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white truncate">Jonna Rincon</h1>
            <p className="text-xs text-gray-400">Artist</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white flex-shrink-0 ml-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="px-3 py-3 sm:px-4 sm:py-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user?.displayName?.[0] || user?.email?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-white truncate">
                {user?.displayName || 'Artist'}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 sm:px-4 sm:py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={(e) => {
                  // Only close sidebar on mobile (below lg breakpoint)
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="px-2 py-2 sm:px-4 sm:py-4 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 sm:space-x-3 w-full px-3 sm:px-4 py-2 sm:py-3 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-colors text-sm sm:text-base"
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : 'pl-0'
        }`}
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white lg:hidden"
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 lg:flex-none">
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-medium text-white truncate">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="px-3 py-4 sm:px-6 sm:py-6 lg:px-6 lg:py-6">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ArtistLayout;
