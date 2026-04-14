import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Music,
  ShoppingCart,
  CalendarDays,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  UserPlus,
  Zap,
  Palette,
  Ticket,
  Package,
  ArrowUpRight,
  Disc3,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  label: string;
  subtitle: string;
  items: { name: string; href: string; icon: any }[];
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [expandedTabs, setExpandedTabs] = useState<Record<string, boolean>>({
    'SHOP MNGMT': false,
    'CATALOGUE MNGMT': false,
    'ARTIST BOARD': false,
    'SOCIAL MEDIA': false,
    'ANALYTICS & ORDERS': false,
  });
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);
  const scrollPositionRef = useRef(0);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navigationTabs: MenuItem[] = [
    {
      label: 'SHOP MNGMT',
      subtitle: 'Manage shop items',
      items: [
        { name: 'Art', href: '/admin/art', icon: Palette },
        { name: 'Beats', href: '/admin/beats', icon: Music },
        { name: 'Services', href: '/admin/services', icon: Zap },
        { name: 'Merchandise', href: '/admin/merchandise', icon: Package },
      ],
    },
    {
      label: 'CATALOGUE MNGMT',
      subtitle: 'Manage content',
      items: [
        { name: 'Tracks', href: '/admin/tracks', icon: Music },
        { name: 'Remixes', href: '/admin/remixes', icon: Disc3 },
        { name: 'Playlists', href: '/admin/playlists', icon: Music },
      ],
    },
    {
      label: 'ARTIST BOARD',
      subtitle: 'Manage requests',
      items: [
        { name: 'Artist Requests', href: '/admin/artist-role-requests', icon: UserPlus },
        { name: 'Collab Requests', href: '/admin/collab-requests', icon: Clock },
      ],
    },
    {
      label: 'SOCIAL MEDIA',
      subtitle: 'Content & chat',
      items: [
        { name: 'Social Media', href: '/admin/content', icon: CalendarDays },
        { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
      ],
    },
    {
      label: 'ANALYTICS & ORDERS',
      subtitle: 'Business data',
      items: [
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
        { name: 'Discount Codes', href: '/admin/discount-codes', icon: Ticket },
      ],
    },
  ];

  // Lock scroll when menu is open
  useEffect(() => {
    const updateBodyScroll = () => {
      if (isMenuOpen && !isMenuClosing) {
        scrollPositionRef.current = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = `-${scrollPositionRef.current}px`;
      } else {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        if (scrollPositionRef.current > 0) {
          window.scrollTo(0, scrollPositionRef.current);
        }
      }
    };

    updateBodyScroll();

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isMenuOpen, isMenuClosing]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  const closeMenu = () => {
    setIsMenuClosing(true);
    closeTimeout.current = setTimeout(() => {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
    }, 500);
  };

  const openMenu = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setIsMenuClosing(false);
    setIsMenuOpen(true);
  };

  const toggleTab = (tabName: string) => {
    setExpandedTabs(prev => ({
      ...prev,
      [tabName]: !prev[tabName],
    }));
  };

  const isActive = (path: string) => location.pathname === path;
  const menuVisible = isMenuOpen || isMenuClosing;

  return (
    <div className="min-h-screen bg-black">
      {/* Top Bar — Menu button right */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 md:px-10 py-4 md:py-5">
        <div className="flex-shrink-0">
          <h1 className="text-lg font-bold text-white">Jonna Rincon</h1>
        </div>

        {/* Menu button */}
        <button
          onClick={openMenu}
          className="text-lg md:text-xl font-black uppercase tracking-[0.3em] text-white transition-all duration-500 hover:opacity-60 cursor-pointer"
        >
          Menu
        </button>
      </div>

      {/* SIDE PANEL MENU */}
      {menuVisible && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-[100] transition-opacity duration-500 ${
              isMenuClosing ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            onClick={closeMenu}
          />

          {/* Side Panel */}
          <div
            className={`fixed top-0 right-0 bottom-0 z-[101] w-full md:w-[480px] lg:w-[520px] md:border-l md:border-white/[0.06] ${
              isMenuClosing ? 'animate-panel-slide-out' : 'animate-panel-slide-in'
            }`}
          >
            {/* Panel background */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" style={{ WebkitBackdropFilter: 'blur(40px)' }} />

            {/* Panel content */}
            <div className="relative z-10 h-full flex flex-col px-8 md:px-12">
              {/* Top bar — Logo left, X right */}
              <div className="flex items-center justify-between py-5 md:py-6 flex-shrink-0">
                <button
                  onClick={() => { closeMenu(); navigate('/admin/dashboard'); }}
                  className="block flex-shrink-0 cursor-pointer"
                >
                  <h2 className="text-xl font-bold text-white/50 hover:text-white transition-colors duration-300">Jonna Rincon</h2>
                </button>

                <button
                  onClick={closeMenu}
                  className="p-2 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300 cursor-pointer group"
                >
                  <X className="w-5 h-5 text-white/60 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
                </button>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-white/[0.06] mb-4" />

              {/* Menu items */}
              <div className="flex-1 flex flex-col overflow-y-auto pr-2 pb-12">
                {navigationTabs.map((item, i) => (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleTab(item.label)}
                      className="group w-full text-left py-4 md:py-5 cursor-pointer border-b border-white/[0.04]"
                      style={{
                        animation: isMenuClosing ? 'none' : `menu-item-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + i * 0.06}s both`,
                      }}
                    >
                      <div className={`flex items-center justify-between transition-transform duration-300 ${!expandedTabs[item.label] ? 'group-hover:translate-x-2' : ''}`}>
                        <div>
                          <span className="block text-3xl md:text-4xl font-semibold text-white/90 group-hover:text-white transition-colors duration-300 tracking-tight">
                            {item.label}
                          </span>
                          <span className="block text-xs text-white/25 mt-1 uppercase tracking-widest font-medium group-hover:text-red-400/60 transition-colors duration-300">
                            {item.subtitle}
                          </span>
                        </div>
                        <ArrowUpRight className={`w-5 h-5 text-white/10 group-hover:text-red-400/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${expandedTabs[item.label] ? 'rotate-90' : ''}`} />
                      </div>
                    </button>

                    {/* Submenu */}
                    <div className={`overflow-hidden transition-all duration-300 ease-out ${expandedTabs[item.label] ? 'max-h-[800px]' : 'max-h-0'}`}>
                      <div className="space-y-0">
                        {item.items.map((subitem, subIndex) => {
                          const Icon = subitem.icon;
                          return (
                            <button
                              key={subitem.href}
                              onClick={() => {
                                closeMenu();
                                navigate(subitem.href);
                              }}
                              className="group w-full text-left py-3 md:py-4 cursor-pointer border-b border-white/[0.04] hover:translate-x-1.5 transition-transform duration-300"
                              style={{
                                animation: expandedTabs[item.label] && !isMenuClosing ? `menu-item-reveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${0.05 + subIndex * 0.04}s both` : 'none',
                                paddingLeft: '2rem',
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Icon size={16} className="flex-shrink-0 text-white/40" />
                                <div>
                                  <span className="block text-lg md:text-lg font-semibold text-white/60 group-hover:text-white transition-colors duration-300 tracking-tight">
                                    {subitem.name}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Bottom section with icons and sign out */}
                <div className="mt-8 pt-6 border-t border-white/[0.04]">
                  {/* Icon Row */}
                  <div className="flex items-center justify-center gap-3 pb-6">
                    <Link
                      to="/admin/dashboard"
                      onClick={closeMenu}
                      className={`p-2.5 rounded-xl transition-all duration-200 ${
                        isActive('/admin/dashboard')
                          ? 'bg-white/[0.08] text-white'
                          : 'text-white/40 hover:bg-white/[0.04] hover:text-white/80'
                      }`}
                      title="Dashboard"
                    >
                      <LayoutDashboard size={18} />
                    </Link>

                    <Link
                      to="/admin/settings"
                      onClick={closeMenu}
                      className={`p-2.5 rounded-xl transition-all duration-200 ${
                        isActive('/admin/settings')
                          ? 'bg-white/[0.08] text-white'
                          : 'text-white/40 hover:bg-white/[0.04] hover:text-white/80'
                      }`}
                      title="Settings"
                    >
                      <Settings size={18} />
                    </Link>
                  </div>

                  {/* Sign Out Button */}
                  <button
                    onClick={() => { closeMenu(); handleSignOut(); }}
                    className="text-left cursor-pointer w-full"
                  >
                    <span className="text-sm uppercase tracking-widest text-white/20 hover:text-red-400 transition-colors duration-300 font-medium flex items-center gap-2">
                      <LogOut size={16} />
                      Sign Out
                    </span>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-white/[0.06]" />

              {/* Bottom — Admin info */}
              <div className="flex-shrink-0 py-6 md:py-8">
                <div className="flex items-center space-x-3 mb-4">
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
                <p className="text-[10px] text-white/15 uppercase tracking-[0.15em] font-medium">
                  &copy; 2025 Jonna Rincon
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex flex-col min-h-screen pt-20">
        {/* Page Content */}
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</main>
      </div>

      <style>{`
        @keyframes panel-slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-panel-slide-in {
          animation: panel-slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (max-width: 768px) {
          .animate-panel-slide-in {
            animation: panel-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }

        @keyframes panel-slide-out {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(100%);
          }
        }
        .animate-panel-slide-out {
          animation: panel-slide-out 0.5s cubic-bezier(0.7, 0, 0.84, 0) forwards;
        }
        @media (max-width: 768px) {
          .animate-panel-slide-out {
            animation: panel-slide-out 0.2s cubic-bezier(0.7, 0, 0.84, 0) forwards;
          }
        }

        @keyframes menu-item-reveal {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (max-width: 768px) {
          /* Faster animations on mobile */
          [style*="animation-delay"] {
            animation-duration: 0.3s !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
