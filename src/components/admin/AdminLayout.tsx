import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOrderNotifications } from '../../hooks/useOrderNotifications';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ArrowLeft,
  ChevronDown,
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const { pendingCount, newSinceLastSeen } = useOrderNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement | null>(null);

  const isOnDashboard = location.pathname === '/admin/dashboard' || location.pathname === '/admin';

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const goBack = () => { try { navigate(-1); } catch { navigate('/admin/dashboard'); } };

  const menuItems: MenuItem[] = [
    {
      label: 'MANAGEMENT',
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
      label: 'ARTIST SUPPORT',
      subtitle: 'Artist Requests, Collab Requests, Chat',
      href: '/admin/board',
      submenu: [],
      badge: 0,
      icon: Users,
      mobileLabel: 'Support',
    },
    {
      label: 'ORDERS AND STATS',
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
      label: 'JONNA RINCON PANEL',
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

  // Close whatever's open when the route changes
  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  // Close an open dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openDropdown]);

  const isItemActive = (item: MenuItem) => {
    if (item.href && (location.pathname === item.href || location.pathname.startsWith(item.href + '/'))) return true;
    return item.submenu.some(sub => location.pathname === sub.href.split('?')[0]);
  };

  const getPrimaryHref = (item: MenuItem) => item.href ?? item.submenu[0]?.href ?? '/admin/dashboard';

  return (
    <div className="min-h-screen bg-black">
      {/* Top bar — same glass-card language as the public site header */}
      <header className="fixed top-0 left-0 right-0 z-40 pt-3 px-4 sm:px-6 lg:px-8">
        <div className="backdrop-blur-xl bg-black/30 border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16 md:h-20">

            {/* Left: logo + back button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/" className="flex items-center justify-center w-10 h-10 md:w-14 md:h-14" title="Back to Home">
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
              <span className="hidden md:inline text-xs font-black uppercase tracking-widest text-white/30 ml-2">Admin</span>
            </div>

            {/* Desktop nav — horizontal, dropdowns for grouped sections */}
            <nav ref={navRef} className="hidden md:flex items-center justify-center flex-1 px-6">
              <div className="flex items-center gap-6 lg:gap-8">
                {menuItems.map((item) => {
                  const active = isItemActive(item);
                  const isOpen = openDropdown === item.label;
                  const linkClasses = `text-xs font-black uppercase tracking-widest transition-all duration-200 relative group whitespace-nowrap ${
                    active ? 'text-white' : 'text-white/50 hover:text-white/80'
                  }`;
                  return (
                    <div key={item.label} className="relative">
                      {item.submenu.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                          className={`${linkClasses} flex items-center gap-1`}
                        >
                          {item.label}
                          {item.badge > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-amber-500 text-[9px] font-bold text-black leading-none">
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                          <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                          <span className={`absolute -bottom-1.5 left-0 w-full h-0.5 bg-red-500 transition-all duration-200 ${
                            active || isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                          }`} />
                        </button>
                      ) : (
                        <Link to={item.href ?? '/admin/dashboard'} className={linkClasses}>
                          {item.label}
                          {item.badge > 0 && (
                            <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-amber-500 text-[9px] font-bold text-black leading-none align-middle">
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                          <span className={`absolute -bottom-1.5 left-0 w-full h-0.5 bg-red-500 transition-all duration-200 ${
                            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                          }`} />
                        </Link>
                      )}

                      {item.submenu.length > 0 && isOpen && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 backdrop-blur-xl bg-black/80 border border-white/[0.08] rounded-2xl overflow-hidden py-2 shadow-2xl">
                          {item.submenu.map((sub) => (
                            <Link
                              key={sub.href}
                              to={sub.href}
                              onClick={() => setOpenDropdown(null)}
                              className="group/sub flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.06] transition-colors"
                            >
                              <span>
                                <span className="block text-xs font-bold text-white/80 group-hover/sub:text-white uppercase tracking-wide transition-colors">{sub.label}</span>
                                <span className="block text-[10px] text-white/30 mt-0.5">{sub.subtitle}</span>
                              </span>
                              {!!sub.badge && sub.badge > 0 && (
                                <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400 leading-none flex-shrink-0 ml-2">
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
              </div>
            </nav>

            {/* Right: utility icons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/[0.08] transition-colors text-white/50 hover:text-white"
                title="Dashboard"
              >
                <LayoutDashboard size={17} />
              </button>
              <button
                onClick={() => navigate('/admin/settings')}
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/[0.08] transition-colors text-white/50 hover:text-white"
                title="Settings"
              >
                <Settings size={17} />
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/[0.08] transition-colors text-white/50 hover:text-white"
                title="Sign Out"
              >
                <LogOut size={17} />
              </button>
              <div className="hidden sm:flex items-center gap-2 ml-1 pl-2 border-l border-white/[0.08]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                  {user?.displayName?.[0] || user?.email?.[0] || 'A'}
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

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
    </div>
  );
};

export default AdminLayout;
