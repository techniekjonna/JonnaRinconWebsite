import React, { useState, useEffect } from 'react';
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
  Ticket,
  Package,
  ChevronDown,
  Disc3,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavTab {
  category: string;
  subtitle: string;
  items: { name: string; href: string; icon: any }[];
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedTabs, setExpandedTabs] = useState<Record<string, boolean>>({
    'SHOP MNGMT': true,
    'CATALOGUE MNGMT': false,
    'ARTIST BOARD': false,
    'SOCIAL MEDIA': false,
    'ANALYTICS & ORDERS': false,
  });
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navigationTabs: NavTab[] = [
    {
      category: 'SHOP MNGMT',
      subtitle: 'Manage shop items',
      items: [
        { name: 'Art', href: '/admin/art', icon: Palette },
        { name: 'Beats', href: '/admin/beats', icon: Music },
        { name: 'Services', href: '/admin/services', icon: Zap },
        { name: 'Merchandise', href: '/admin/merchandise', icon: Package },
      ],
    },
    {
      category: 'CATALOGUE MNGMT',
      subtitle: 'Manage content',
      items: [
        { name: 'Tracks', href: '/admin/tracks', icon: Music },
        { name: 'Remixes', href: '/admin/remixes', icon: Disc3 },
        { name: 'Playlists', href: '/admin/playlists', icon: Music },
      ],
    },
    {
      category: 'ARTIST BOARD',
      subtitle: 'Manage requests',
      items: [
        { name: 'Artist Requests', href: '/admin/artist-role-requests', icon: UserPlus },
        { name: 'Collab Requests', href: '/admin/collab-requests', icon: Clock },
      ],
    },
    {
      category: 'SOCIAL MEDIA',
      subtitle: 'Content & chat',
      items: [
        { name: 'Social Media', href: '/admin/content', icon: CalendarDays },
        { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
      ],
    },
    {
      category: 'ANALYTICS & ORDERS',
      subtitle: 'Business data',
      items: [
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
        { name: 'Discount Codes', href: '/admin/discount-codes', icon: Ticket },
      ],
    },
  ];

  const toggleTab = (tabName: string) => {
    setExpandedTabs(prev => ({
      ...prev,
      [tabName]: !prev[tabName],
    }));
  };

  // Auto-expand tab based on current route
  useEffect(() => {
    navigationTabs.forEach(tab => {
      const isInTab = tab.items.some(item => location.pathname === item.href);
      if (isInTab) {
        setExpandedTabs(prev => ({
          ...prev,
          [tab.category]: true,
        }));
      }
    });
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar - RIGHT SIDE */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-56 sm:w-64 bg-neutral-950/95 backdrop-blur-xl border-l border-white/[0.08] transform transition-transform duration-300 overflow-hidden flex flex-col ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
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

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navigationTabs.map((tab) => (
            <div key={tab.category}>
              {/* Tab Header */}
              <button
                onClick={() => toggleTab(tab.category)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all duration-200 text-sm hover:bg-white/[0.04] group"
              >
                <div className="text-left">
                  <p className="font-semibold text-white uppercase tracking-tight text-xs">{tab.category}</p>
                  <p className="text-[10px] text-white/30">{tab.subtitle}</p>
                </div>
                <ChevronDown
                  size={16}
                  className={`flex-shrink-0 text-white/40 transition-transform duration-300 ${
                    expandedTabs[tab.category] ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Tab Items */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  expandedTabs[tab.category] ? 'max-h-[500px]' : 'max-h-0'
                }`}
              >
                <div className="space-y-0.5 pt-1 pb-2">
                  {tab.items.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => {
                          if (window.innerWidth < 1024) setSidebarOpen(false);
                        }}
                        style={{
                          animation: expandedTabs[tab.category]
                            ? `fadeInUp 0.3s ease-out ${index * 0.05}s both`
                            : 'none',
                        }}
                        className={`flex items-center space-x-3 px-3 py-2 ml-2 rounded-xl transition-all duration-200 text-sm ${
                          isActive(item.href)
                            ? 'bg-white/[0.08] text-white font-semibold'
                            : 'text-white/40 hover:bg-white/[0.04] hover:text-white/80'
                        }`}
                      >
                        <Icon size={16} className="flex-shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Icons */}
        <div className="px-3 py-3 border-t border-white/[0.06] space-y-3 flex-shrink-0">
          {/* Icon Row */}
          <div className="flex items-center justify-center gap-3">
            {/* Dashboard Icon */}
            <Link
              to="/admin/dashboard"
              onClick={() => {
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                isActive('/admin/dashboard')
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/40 hover:bg-white/[0.04] hover:text-white/80'
              }`}
              title="Dashboard"
            >
              <LayoutDashboard size={18} />
            </Link>

            {/* Settings Icon */}
            <Link
              to="/admin/settings"
              onClick={() => {
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                isActive('/admin/settings')
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/40 hover:bg-white/[0.04] hover:text-white/80'
              }`}
              title="Settings"
            >
              <Settings size={18} />
            </Link>

            {/* Cart Icon */}
            <button className="p-2.5 rounded-xl text-white/40 hover:bg-white/[0.04] hover:text-white/80 transition-all duration-200" title="Cart">
              <ShoppingCart size={18} />
            </button>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-white/30 hover:bg-white/[0.04] hover:text-white/60 rounded-2xl transition-all duration-200 text-sm"
          >
            <LogOut size={16} className="flex-shrink-0" />
            <span className="text-xs">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pr-64' : 'pr-0'}`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <Link
              to="/"
              className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] px-4 py-2 rounded-2xl text-white/70 hover:text-white font-medium transition-all flex items-center gap-2 text-sm"
            >
              <Home size={16} />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <div className="hidden sm:block">
              <p className="text-xs text-white/30">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white/40 hover:text-white lg:hidden"
            >
              <Menu size={22} />
            </button>
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

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
