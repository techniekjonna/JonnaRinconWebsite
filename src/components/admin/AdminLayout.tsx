import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

type SidebarPosition = 'floating' | 'left' | 'right';

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [expandedShop, setExpandedShop] = useState(false);
  const [expandedCatalogue, setExpandedCatalogue] = useState(false);
  const [expandedArtist, setExpandedArtist] = useState(false);
  const [expandedSocial, setExpandedSocial] = React.useState(false);
  const [expandedAnalytics, setExpandedAnalytics] = React.useState(false);
  const [expandedPanel, setExpandedPanel] = React.useState(false);
  const [sidebarPosition, setSidebarPositionState] = useState<SidebarPosition>(() => {
    const saved = localStorage.getItem('admin-sidebar-position') as SidebarPosition;
    return saved || 'floating';
  });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);
  const scrollPositionRef = useRef(0);

  const isDocked = sidebarPosition !== 'floating';
  const isOnDashboard = location.pathname === '/admin/dashboard' || location.pathname === '/admin';

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  // Dispatch sidebar state change event
  React.useEffect(() => {
    const event = new CustomEvent('sidebar-state-change', {
      detail: { isOpen: isMenuOpen }
    });
    window.dispatchEvent(event);
  }, [isMenuOpen]);

  const setSidebarPosition = (pos: SidebarPosition) => {
    localStorage.setItem('admin-sidebar-position', pos);
    setSidebarPositionState(pos);
  };

  const menuItems = [
    {
      label: 'SHOP',
      subtitle: 'Art, Beats, Services, Merchandise',
      action: () => setExpandedShop(!expandedShop),
      submenu: [
        { label: 'Art', subtitle: 'Digital & visual art', href: '/admin/art' },
        { label: 'Beats', subtitle: 'Beat instrumentals', href: '/admin/beats' },
        { label: 'Services', subtitle: 'Audio services', href: '/admin/services' },
        { label: 'Merchandise', subtitle: 'Branded products', href: '/admin/merchandise' },
      ],
      expanded: expandedShop,
    },
    {
      label: 'CATALOGUE',
      subtitle: 'Tracks, Remixes, Playlists & Custom',
      href: '/admin/tracks',
      submenu: [
        { label: 'Tracks', subtitle: 'Discography', href: '/admin/tracks' },
        { label: 'Remixes', subtitle: 'Remixes & edits', href: '/admin/tracks' },
        { label: 'Playlists', subtitle: 'Playlist management', href: '/admin/tracks' },
        { label: 'Custom', subtitle: 'Custom tabs', href: '/admin/tracks' },
      ],
      expanded: expandedCatalogue,
    },
    {
      label: 'ARTIST SUPPORT',
      subtitle: 'Artist Requests, Collab Requests, Chat',
      href: '/admin/board',
      submenu: [],
      expanded: false,
    },
    {
      label: 'SOCIAL MEDIA',
      subtitle: 'Content management',
      href: '/admin/content',
      submenu: [],
      expanded: false,
    },
    {
      label: 'ORDERS AND STATS',
      subtitle: 'Orders, Products, Analytics',
      action: () => setExpandedAnalytics(!expandedAnalytics),
      submenu: [
        { label: 'Orders', subtitle: 'Order management', href: '/admin/orders' },
        { label: 'Product Management', subtitle: 'Customer purchases', href: '/admin/product-management' },
        { label: 'Analytics', subtitle: 'Dashboard analytics', href: '/admin/analytics' },
        { label: 'Discount Codes', subtitle: 'Promo codes', href: '/admin/discount-codes' },
      ],
      expanded: expandedAnalytics,
    },
    {
      label: 'JONNA RINCON PANEL',
      subtitle: 'Agenda & Projects',
      action: () => setExpandedPanel(!expandedPanel),
      submenu: [
        { label: 'Agenda', subtitle: 'Planning & tasks', href: '/admin/agenda' },
        { label: 'Projects', subtitle: 'Project management', href: '/admin/projects' },
      ],
      expanded: expandedPanel,
    },
  ];

  const cycleSidebarPosition = () => {
    const next: SidebarPosition =
      sidebarPosition === 'floating' ? 'left'
      : sidebarPosition === 'left' ? 'right'
      : 'floating';

    // Switching from floating to docked: immediately close floating menu
    if (sidebarPosition === 'floating' && next !== 'floating' && (isMenuOpen || isMenuClosing)) {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
      setIsMenuOpen(false);
      setIsMenuClosing(false);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollPositionRef.current > 0) {
        window.scrollTo(0, scrollPositionRef.current);
        scrollPositionRef.current = 0;
      }
    }
    setSidebarPosition(next);
  };

  // Body scroll lock — only in floating mode
  React.useEffect(() => {
    if (isDocked) return;
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
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isMenuOpen, isMenuClosing, isDocked]);

  React.useEffect(() => {
    return () => { if (closeTimeout.current) clearTimeout(closeTimeout.current); };
  }, []);

  // Close menu immediately whenever the route changes
  React.useEffect(() => {
    if (isMenuOpen || isMenuClosing) {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
      setIsMenuOpen(false);
      setIsMenuClosing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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

  const menuVisible = isMenuOpen || isMenuClosing;

  const positionIcon =
    sidebarPosition === 'left' ? <ChevronRight size={18} /> :
    sidebarPosition === 'right' ? <ChevronLeft size={18} /> :
    <Menu size={18} />;

  const positionTitle = `Sidebar: ${
    sidebarPosition === 'floating' ? 'Floating' :
    sidebarPosition === 'left' ? 'Left' : 'Right'
  }`;

  const goBack = () => { try { navigate(-1); } catch { navigate('/admin/dashboard'); } };

  // ── DOCKED SIDEBAR LAYOUT ────────────────────────────────────────────────
  if (isDocked) {
    return (
      <div className={`min-h-screen bg-black flex ${sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* Persistent docked sidebar — no overlay/blur on page */}
        <aside
          className={`w-[270px] flex-shrink-0 h-screen sticky top-0 flex flex-col overflow-hidden
            ${sidebarPosition === 'left' ? 'border-r' : 'border-l'} border-white/[0.06]`}
          style={{ background: 'rgba(5,5,5,0.98)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
            <button
              onClick={() => navigate('/')}
              className="hover:opacity-80 transition-opacity"
              title="Back to Home"
            >
              <img
                src="/Jonna Rincon Logo WH.png"
                alt="Jonna Rincon"
                className="h-28 w-auto opacity-40 hover:opacity-90 transition-opacity duration-300"
              />
            </button>
            <button
              onClick={() => setSidebarPosition('floating')}
              className="p-2 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all group"
              title="Sidebar verbergen"
            >
              <X className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
            </button>
          </div>
          <div className="w-full h-px bg-white/[0.06] flex-shrink-0" />

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            {menuItems.map((item) => (
              <div key={item.label}>
                <button
                  onClick={() => {
                    if ('href' in item && item.href) {
                      navigate(item.href);
                    } else {
                      item.action?.();
                    }
                  }}
                  className="group w-full text-left px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <span className="block text-[11px] font-bold text-white/60 group-hover:text-white uppercase tracking-widest transition-colors">
                      {item.label}
                    </span>
                  </div>
                  {!('href' in item && item.href) && (
                    <ChevronRight
                      size={13}
                      className={`text-white/20 flex-shrink-0 ml-2 transition-transform duration-200 ${item.expanded ? 'rotate-90' : ''}`}
                    />
                  )}
                </button>
                <div className={`overflow-hidden transition-all duration-200 ease-out ${item.expanded ? 'max-h-96' : 'max-h-0'}`}>
                  {item.submenu.map((sub) => (
                    <button
                      key={sub.href}
                      onClick={() => navigate(sub.href)}
                      className="group w-full text-left px-8 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors"
                    >
                      <span className="block text-xs text-white/50 group-hover:text-white transition-colors">{sub.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="w-full h-px bg-white/[0.06] flex-shrink-0" />

          {/* Bottom actions */}
          <div className="px-5 py-4 flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 rounded-lg text-white/40 hover:bg-white/[0.04] hover:text-white/80 transition"
                title="Dashboard"
              >
                <LayoutDashboard size={16} />
              </button>
              <button
                onClick={() => navigate('/admin/settings')}
                className="p-2 rounded-lg text-white/40 hover:bg-white/[0.04] hover:text-white/80 transition"
                title="Settings"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={cycleSidebarPosition}
                className="p-2 rounded-lg bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 transition"
                title={positionTitle}
              >
                {positionIcon}
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg text-white/40 hover:bg-white/[0.04] hover:text-white/80 transition"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {user?.displayName?.[0] || user?.email?.[0] || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.displayName || 'Admin'}</p>
                <p className="text-[10px] text-white/25 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content — takes remaining width */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Minimal top bar (back button only) */}
          <div className="sticky top-0 z-20 flex items-center px-6 py-4 flex-shrink-0">
            {!isOnDashboard && (
              <button
                onClick={goBack}
                className="w-10 h-10 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center"
                title="Terug"
              >
                <ArrowLeft size={18} className="text-white/60" />
              </button>
            )}
          </div>
          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</main>
        </div>
      </div>
    );
  }

  // ── FLOATING MODE ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 md:px-10 py-4 md:py-5">
        <div className="flex-shrink-0">
          {!isOnDashboard && (
            <button
              onClick={goBack}
              className="w-10 h-10 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300 flex items-center justify-center cursor-pointer"
              title="Terug"
            >
              <ArrowLeft size={18} className="text-white/60" />
            </button>
          )}
          {isOnDashboard && (
            <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
          )}
        </div>
        <button
          onClick={openMenu}
          className="text-lg md:text-xl font-black uppercase tracking-[0.3em] text-white transition-all duration-500 hover:opacity-60 cursor-pointer"
        >
          Menu
        </button>
      </div>

      {/* Floating side panel with blur overlay */}
      {menuVisible && (
        <>
          {/* Blur overlay — only in floating mode */}
          <div
            className={`fixed inset-0 z-[100] transition-opacity duration-500 ${isMenuClosing ? 'opacity-0' : 'opacity-100'}`}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            onClick={closeMenu}
          />

          {/* Side panel */}
          <div
            className={`fixed top-0 right-0 bottom-0 z-[101] w-full md:w-[480px] lg:w-[520px] md:border-l md:border-white/[0.06] ${
              isMenuClosing ? 'animate-panel-slide-out' : 'animate-panel-slide-in'
            }`}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" style={{ WebkitBackdropFilter: 'blur(40px)' }} />
            <div className="relative z-10 h-full flex flex-col px-8 md:px-12">
              {/* Header */}
              <div className="flex items-center justify-between py-3 md:py-4 flex-shrink-0">
                <button
                  onClick={() => { closeMenu(); setTimeout(() => navigate('/'), 100); }}
                  className="block flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  title="Back to Home"
                >
                  <img
                    src="/Jonna Rincon Logo WH.png"
                    alt="Jonna Rincon"
                    className="h-[110px] md:h-[150px] w-auto opacity-50 hover:opacity-100 transition-opacity duration-300"
                  />
                </button>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300 cursor-pointer group"
                >
                  <X className="w-5 h-5 text-white/60 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
                </button>
              </div>

              <div className="w-full h-px bg-white/[0.06]" />

              {/* Menu items */}
              <div className="flex-1 flex flex-col overflow-y-auto pr-2 pb-12">
                {menuItems.map((item, i) => (
                  <div key={item.label}>
                    <button
                      onClick={() => {
                        if ('href' in item && item.href) {
                          navigate(item.href);
                          closeMenu();
                        } else {
                          item.action?.();
                        }
                      }}
                      className="group w-full text-left py-4 md:py-5 cursor-pointer border-b border-white/[0.04]"
                      style={{
                        animation: isMenuClosing ? 'none' : `menu-item-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + i * 0.06}s both`,
                      }}
                    >
                      <div className={`flex items-center justify-between transition-transform duration-300 ${!item.expanded && !('href' in item && item.href) ? 'group-hover:translate-x-2' : ''}`}>
                        <div>
                          <span className="block text-3xl md:text-4xl font-semibold text-white/90 group-hover:text-white transition-colors duration-300 tracking-tight">
                            {item.label}
                          </span>
                          <span className="block text-xs text-white/25 mt-1 uppercase tracking-widest font-medium group-hover:text-red-400/60 transition-colors duration-300">
                            {item.subtitle}
                          </span>
                        </div>
                        {!('href' in item && item.href) && (
                          <ArrowUpRight className={`w-5 h-5 text-white/10 group-hover:text-red-400/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${item.expanded ? 'rotate-90' : ''}`} />
                        )}
                      </div>
                    </button>

                    {item.submenu && (
                      <div className={`overflow-hidden transition-all duration-300 ease-out ${item.expanded ? 'max-h-[800px]' : 'max-h-0'}`}>
                        {item.submenu.map((sub, si) => (
                          <button
                            key={sub.href}
                            onClick={() => { navigate(sub.href); closeMenu(); }}
                            className="group w-full text-left py-3 md:py-4 cursor-pointer border-b border-white/[0.04] hover:translate-x-1.5 transition-transform duration-300"
                            style={{
                              animation: item.expanded && !isMenuClosing ? `menu-item-reveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${0.05 + si * 0.04}s both` : 'none',
                              paddingLeft: '2rem',
                            }}
                          >
                            <span className="block text-lg font-semibold text-white/60 group-hover:text-white transition-colors duration-300 tracking-tight">
                              {sub.label}
                            </span>
                            <span className="block text-xs text-white/20 mt-0.5 uppercase tracking-widest font-medium group-hover:text-white/40 transition-colors duration-300">
                              {sub.subtitle}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Bottom icons */}
                <div className="flex flex-col gap-4 pt-6">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => { navigate('/admin/dashboard'); closeMenu(); }}
                      className="p-2.5 rounded-xl transition-all duration-200 text-white/40 hover:bg-white/[0.04] hover:text-white/80"
                      title="Dashboard"
                    >
                      <LayoutDashboard size={18} />
                    </button>
                    <button
                      onClick={() => { navigate('/admin/settings'); closeMenu(); }}
                      className="p-2.5 rounded-xl transition-all duration-200 text-white/40 hover:bg-white/[0.04] hover:text-white/80"
                      title="Settings"
                    >
                      <Settings size={18} />
                    </button>
                    <button
                      onClick={cycleSidebarPosition}
                      className={`p-2.5 rounded-xl border transition-all duration-200 ${
                        sidebarPosition !== 'floating'
                          ? 'bg-red-600/20 border-red-600/40 text-red-400 hover:bg-red-600/30'
                          : 'border-transparent text-white/40 hover:bg-white/[0.04] hover:text-white/80'
                      }`}
                      title={positionTitle}
                    >
                      {positionIcon}
                    </button>
                    <button
                      onClick={() => { closeMenu(); handleSignOut(); }}
                      className="p-2.5 rounded-xl transition-all duration-200 text-white/40 hover:bg-white/[0.04] hover:text-white/80"
                      title="Sign Out"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                  <button
                    onClick={() => { closeMenu(); handleSignOut(); }}
                    className="text-left cursor-pointer w-full"
                  >
                    <span className="text-sm uppercase tracking-widest text-white/20 hover:text-red-400 transition-colors duration-300 font-medium">
                      Sign Out
                    </span>
                  </button>
                </div>
              </div>

              <div className="w-full h-px bg-white/[0.06]" />

              {/* User info */}
              <div className="flex-shrink-0 py-6 md:py-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
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

      {/* Main content */}
      <div className="flex flex-col min-h-screen pt-20">
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</main>
      </div>

      <style>{`
        @keyframes panel-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-panel-slide-in { animation: panel-slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @media (max-width: 768px) { .animate-panel-slide-in { animation: panel-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; } }
        @keyframes panel-slide-out { from { transform: translateX(0); } to { transform: translateX(100%); } }
        .animate-panel-slide-out { animation: panel-slide-out 0.5s cubic-bezier(0.7, 0, 0.84, 0) forwards; }
        @media (max-width: 768px) { .animate-panel-slide-out { animation: panel-slide-out 0.2s cubic-bezier(0.7, 0, 0.84, 0) forwards; } }
        @keyframes menu-item-reveal { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @media (max-width: 768px) { [style*="animation-delay"] { animation-duration: 0.3s !important; } }
      `}</style>
    </div>
  );
};

export default AdminLayout;
