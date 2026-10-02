import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LogOut,
  ArrowLeft,
  ArrowUpRight,
  Menu,
  X,
  Home,
  Sparkles,
  Disc3,
  Handshake,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

interface ManagerLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  label: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
  mobileLabel: string;
}

const ManagerLayout: React.FC<ManagerLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [menuButtonHovered, setMenuButtonHovered] = useState(false);
  const recentlyClosedRef = useRef(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isOnDashboard = location.pathname === '/manager/dashboard' || location.pathname === '/manager';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const goBack = () => { try { navigate(-1); } catch { navigate('/manager/dashboard'); } };

  const menuItems: MenuItem[] = [
    { label: 'Dashboard', subtitle: 'Overview & stats', href: '/manager/dashboard', icon: Home, mobileLabel: 'Home' },
    { label: 'Jonna Rincon Panel', subtitle: 'Agenda, Social & More', href: '/manager/jonna-rincon-panel', icon: Sparkles, mobileLabel: 'Panel' },
    { label: 'Beats', subtitle: 'Beat management', href: '/manager/beats', icon: Disc3, mobileLabel: 'Beats' },
    { label: 'Collaborations', subtitle: 'Active collabs', href: '/manager/collaborations', icon: Handshake, mobileLabel: 'Collabs' },
    { label: 'Chat', subtitle: 'Messages', href: '/manager/chat', icon: MessageSquare, mobileLabel: 'Chat' },
  ];

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

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

  useEffect(() => {
    if (isMenuOpen || isMenuClosing) closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    return () => { if (closeTimeout.current) clearTimeout(closeTimeout.current); };
  }, []);

  const menuVisible = isMenuOpen || isMenuClosing;

  return (
    <div className="min-h-screen bg-black">
      {/* Top bar — logo + menu button only, same glass-card language as the public site header */}
      <header className="fixed top-0 left-0 right-0 z-40 pt-3 px-4 sm:px-6 lg:px-8">
        <div className="backdrop-blur-xl bg-black/30 border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16 md:h-20">

            {/* Left: logo, same size as the public site's header */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/manager/dashboard" className="flex items-center justify-center w-14 h-14 md:w-24 md:h-24">
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
              isMenuClosing ? 'animate-manager-panel-slide-out' : 'animate-manager-panel-slide-in'
            }`}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" style={{ WebkitBackdropFilter: 'blur(40px)' }} />
            <div className="relative z-10 h-full flex flex-col px-6 md:px-10" onClick={(e) => e.stopPropagation()}>

              {/* Top bar */}
              <div className="flex items-center justify-between py-5 md:py-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {user?.displayName?.[0] || user?.email?.[0] || 'M'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user?.displayName || 'Manager'}</p>
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

              {/* Nav — every page listed flat */}
              <div className="flex-1 overflow-y-auto pr-1 pb-6">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      onClick={closeMenu}
                      className={`group flex items-center justify-between gap-3 py-4 border-b border-white/[0.04] ${active ? 'text-white' : 'text-white/80 hover:text-white'}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon size={16} className={active ? 'text-blue-400' : 'text-white/30 group-hover:text-white/60'} />
                        <span className="text-sm font-bold uppercase tracking-wider">{item.label}</span>
                      </span>
                      <ArrowUpRight size={15} className="text-white/15 group-hover:text-blue-400/60 transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}

                {/* Quick actions */}
                <div className="pt-4 flex flex-col gap-1">
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

      {/* Mobile bottom tab bar — main sections, always visible */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
        aria-label="Primary"
      >
        <div className="backdrop-blur-xl bg-black/30 border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-stretch justify-around">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                    active ? 'text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
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
        @keyframes manager-panel-slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-manager-panel-slide-in {
          animation: manager-panel-slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (max-width: 768px) {
          .animate-manager-panel-slide-in {
            animation: manager-panel-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }
        @keyframes manager-panel-slide-out {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        .animate-manager-panel-slide-out {
          animation: manager-panel-slide-out 0.5s cubic-bezier(0.7, 0, 0.84, 0) forwards;
        }
        @media (max-width: 768px) {
          .animate-manager-panel-slide-out {
            animation: manager-panel-slide-out 0.2s cubic-bezier(0.7, 0, 0.84, 0) forwards;
          }
        }
      `}</style>
    </div>
  );
};

export default ManagerLayout;
