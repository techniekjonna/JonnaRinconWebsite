import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOrderNotifications } from '../../hooks/useOrderNotifications';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ArrowLeft,
  ArrowUpRight,
  Menu,
  X,
  LayoutGrid,
  Users,
  Receipt,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface SubmenuItem {
  label: string;
  subtitle: string;
  href: string;
  badge?: number;
}

interface MenuItem {
  label: string;
  subtitle: string;
  href?: string;
  submenu: SubmenuItem[];
  badge: number;
  icon: LucideIcon;
  mobileLabel: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [menuButtonHovered, setMenuButtonHovered] = useState(false);
  const recentlyClosedRef = useRef(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, signOut } = useAuth();
  const { pendingCount, newSinceLastSeen } = useOrderNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const isOnDashboard = location.pathname === '/admin/dashboard' || location.pathname === '/admin';

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const goBack = () => { try { navigate(-1); } catch { navigate('/admin/dashboard'); } };

  const menuItems: MenuItem[] = [
    {
      label: 'Management',
      subtitle: 'Beats, Services, Tracks & Mix Masters',
      href: '/admin/management',
      submenu: [
        { label: 'Beats', subtitle: 'Beat instrumentals', href: '/admin/management?tab=beats' },
        { label: 'Services', subtitle: 'Audio services', href: '/admin/management?tab=services' },
        { label: 'Tracks', subtitle: 'Discography, remixes & custom', href: '/admin/management?tab=tracks' },
        { label: 'Mix Masters', subtitle: 'Client mix & master archive', href: '/admin/management?tab=mixmasters' },
      ],
      badge: 0,
      icon: LayoutGrid,
      mobileLabel: 'Manage',
    },
    {
      label: 'Artist Support',
      subtitle: 'Artist Requests, Collab Requests, Chat',
      href: '/admin/board',
      submenu: [],
      badge: 0,
      icon: Users,
      mobileLabel: 'Support',
    },
    {
      label: 'Orders and Stats',
      subtitle: 'Bestellingen, Producten, Kortingscodes',
      submenu: [
        { label: 'Bestellingen', subtitle: 'Beheer bestellingen', href: '/admin/orders', badge: pendingCount },
        { label: 'Product Management', subtitle: 'Klantaankopen', href: '/admin/product-management' },
        { label: 'Discount Codes', subtitle: 'Promo codes', href: '/admin/discount-codes' },
      ],
      badge: newSinceLastSeen > 0 ? newSinceLastSeen : (pendingCount > 0 ? pendingCount : 0),
      icon: Receipt,
      mobileLabel: 'Orders',
    },
    {
      label: 'Jonna Rincon Panel',
      subtitle: 'Agenda, Analytics & More',
      submenu: [
        { label: 'Panel', subtitle: 'Jonna Rincon overzicht', href: '/admin/jonna-rincon-panel' },
        { label: 'Analytics', subtitle: 'Dashboard analytics', href: '/admin/analytics' },
      ],
      badge: 0,
      icon: Sparkles,
      mobileLabel: 'Panel',
    },
  ];

  const closeMenu = () => {
    if (isMenuClosing || !isMenuOpen) return;
    setIsMenuClosing(true);
    closeTimeout.current = setTimeout(() => {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
      recentlyClosedRef.current = true;
      setTimeout(() => { recentlyClosedRef.current = false; }, 350);
    }, 500);
  };

  const openMenu = () => {
    if (isMenuOpen && !isMenuClosing) return;
    if (recentlyClosedRef.current) return;
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setIsMenuClosing(false);
    setIsMenuOpen(true);
  };

  // Close the menu whenever the route changes
  useEffect(() => {
    if (isMenuOpen || isMenuClosing) closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  useEffect(() => {
    return () => { if (closeTimeout.current) clearTimeout(closeTimeout.current); };
  }, []);

  const isItemActive = (item: MenuItem) => {
    if (item.href && (location.pathname === item.href || location.pathname.startsWith(item.href + '/'))) return true;
    return item.submenu.some(sub => location.pathname === sub.href.split('?')[0]);
  };

  const isSubActive = (href: string) => {
    const [path, query] = href.split('?');
    if (location.pathname !== path) return false;
    if (!query) return true;
    return new URLSearchParams(location.search).get('tab') === new URLSearchParams(query).get('tab');
  };

  const getPrimaryHref = (item: MenuItem) => item.href ?? item.submenu[0]?.href ?? '/admin/dashboard';

  const menuVisible = isMenuOpen || isMenuClosing;

  return (
    <div className="min-h-screen bg-black">
      {/* Top bar — logo + menu button only, same glass-card language as the public site header */}
      <header className="fixed top-0 left-0 right-0 z-40 pt-3 px-4 sm:px-6 lg:px-8">
        <div className="backdrop-blur-xl bg-black/30 border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16 md:h-20">

            {/* Left: logo, same size as the public site's header */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/admin/dashboard" className="flex items-center justify-center w-14 h-14 md:w-24 md:h-24">
                <img src="/Jonna Rincon Logo WH.png" alt="JR" className="w-full h-full object-contain opacity-80 hover:opacity-100 transition-opacity" />
              </Link>
              {!isOnDashboard && (
                <button
                  onClick={goBack}
                  className="w-9 h-9 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center flex-shrink-0"
                  title="Terug"
                >
                  <ArrowLeft size={16} className="text-white/60" />
                </button>
              )}
            </div>

            {/* Right: menu button — same hover icon-to-label swap as the public header's hamburger */}
            <button
              onClick={openMenu}
              onMouseEnter={() => setMenuButtonHovered(true)}
              onMouseLeave={() => setMenuButtonHovered(false)}
              className="flex items-center justify-center w-14 h-9 rounded-lg hover:bg-white/[0.08] transition-colors text-white/60 hover:text-white flex-shrink-0 overflow-hidden relative"
              title="Menu"
            >
              <span className="absolute inset-0 flex items-center justify-center transition-all duration-300">
                <Menu size={20} className={`transition-all duration-300 ${menuButtonHovered ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`} />
              </span>
              <span className="absolute inset-0 flex items-center justify-center transition-all duration-300">
                <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${menuButtonHovered ? 'opacity-100' : 'opacity-0'}`}>Menu</span>
              </span>
            </button>

          </div>
        </div>
      </header>

      {/* Slide-in menu panel — same mechanics as the public site's Navigation.tsx panel */}
      {menuVisible && (
        <>
          <div
            className={`fixed inset-0 z-[100] transition-opacity duration-500 ${isMenuClosing ? 'opacity-0' : 'opacity-100'}`}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            onClick={closeMenu}
          />
          <div
            className={`fixed top-0 right-0 bottom-0 z-[101] w-full md:w-[480px] lg:w-[520px] md:border-l md:border-white/[0.06] ${
              isMenuClosing ? 'animate-admin-panel-slide-out' : 'animate-admin-panel-slide-in'
            }`}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" style={{ WebkitBackdropFilter: 'blur(40px)' }} />
            <div className="relative z-10 h-full flex flex-col px-6 md:px-10" onClick={(e) => e.stopPropagation()}>

              {/* Top bar */}
              <div className="flex items-center justify-between py-5 md:py-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {user?.displayName?.[0] || user?.email?.[0] || 'A'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user?.displayName || 'Admin'}</p>
                    <p className="text-[11px] text-white/30 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all flex-shrink-0"
                >
                  <X className="w-5 h-5 text-white/60 hover:text-white transition-colors" />
                </button>
              </div>

              <div className="w-full h-px bg-white/[0.06] mb-2 flex-shrink-0" />

              {/* Nav groups — every page listed flat, no further click-to-expand */}
              <div className="flex-1 overflow-y-auto pr-1 pb-6">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item);
                  return (
                    <div key={item.label} className="py-4 border-b border-white/[0.04]">
                      <Link
                        to={getPrimaryHref(item)}
                        onClick={closeMenu}
                        className={`group flex items-center justify-between gap-3 ${active ? 'text-white' : 'text-white/80 hover:text-white'}`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon size={16} className={active ? 'text-red-400' : 'text-white/30 group-hover:text-white/60'} />
                          <span className="text-sm font-bold uppercase tracking-wider">{item.label}</span>
                          {item.badge > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-amber-500 text-[9px] font-bold text-black leading-none">
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </span>
                        <ArrowUpRight size={15} className="text-white/15 group-hover:text-red-400/60 transition-colors flex-shrink-0" />
                      </Link>
                      {item.submenu.length > 1 && (
                        <div className="mt-2.5 ml-[26px] space-y-2">
                          {item.submenu.map((sub) => (
                            <Link
                              key={sub.href}
                              to={sub.href}
                              onClick={closeMenu}
                              className={`group/sub flex items-center justify-between gap-2 ${isSubActive(sub.href) ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                            >
                              <span className="text-xs font-semibold">{sub.label}</span>
                              {!!sub.badge && sub.badge > 0 && (
                                <span className="inline-flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full bg-amber-500/20 text-[9px] font-bold text-amber-400 leading-none flex-shrink-0">
                                  {sub.badge > 99 ? '99+' : sub.badge}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Quick actions — moved in from the old top-bar icon cluster */}
                <div className="pt-4 flex flex-col gap-1">
                  <button
                    onClick={() => { closeMenu(); navigate('/admin/dashboard'); }}
                    className="flex items-center gap-2.5 py-2.5 text-white/60 hover:text-white transition-colors"
                  >
                    <LayoutDashboard size={16} className="text-white/30" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Dashboard</span>
                  </button>
                  <button
                    onClick={() => { closeMenu(); navigate('/admin/settings'); }}
                    className="flex items-center gap-2.5 py-2.5 text-white/60 hover:text-white transition-colors"
                  >
                    <Settings size={16} className="text-white/30" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Settings</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 py-2.5 text-white/60 hover:text-red-400 transition-colors"
                  >
                    <LogOut size={16} className="text-white/30" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile bottom tab bar — the four main sections, always visible */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
        aria-label="Primary"
      >
        <div className="backdrop-blur-xl bg-black/30 border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-stretch justify-around">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);
              return (
                <Link
                  key={item.label}
                  to={getPrimaryHref(item)}
                  className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                    active ? 'text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {item.badge > 0 && (
                    <span className="absolute top-1.5 right-[22%] flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full bg-amber-500 text-[8px] font-bold text-black leading-none">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  <Icon size={19} />
                  <span className="text-[9px] font-black uppercase tracking-wider">{item.mobileLabel}</span>
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-500 transition-opacity duration-200 ${
                    active ? 'opacity-100' : 'opacity-0'
                  }`} />
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex flex-col min-h-screen pt-24 sm:pt-28 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-6">
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</main>
      </div>

      <style>{`
        @keyframes admin-panel-slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-admin-panel-slide-in {
          animation: admin-panel-slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (max-width: 768px) {
          .animate-admin-panel-slide-in {
            animation: admin-panel-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }
        @keyframes admin-panel-slide-out {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        .animate-admin-panel-slide-out {
          animation: admin-panel-slide-out 0.5s cubic-bezier(0.7, 0, 0.84, 0) forwards;
        }
        @media (max-width: 768px) {
          .animate-admin-panel-slide-out {
            animation: admin-panel-slide-out 0.2s cubic-bezier(0.7, 0, 0.84, 0) forwards;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
