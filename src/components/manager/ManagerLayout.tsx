import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { openPlayerModal } from '../GlobalAudioPlayer';
import {
  ArrowLeft,
  ArrowUpRight,
  Menu,
  Play,
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
  const [playerButtonHovered, setPlayerButtonHovered] = useState(false);
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
      {/* Top bar — same shape as the public site header: player + logo left, nav centered, menu right */}
      <header className="fixed top-0 left-0 right-0 z-40 pt-3 px-4 sm:px-6 lg:px-8">
        <div className="backdrop-blur-xl bg-black/30 border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16 md:h-20">

            {/* Left: player button + logo (+ back button when not on dashboard) */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => openPlayerModal()}
                onMouseEnter={() => setPlayerButtonHovered(true)}
                onMouseLeave={() => setPlayerButtonHovered(false)}
                className="flex items-center justify-center w-14 h-9 rounded-lg hover:bg-white/[0.08] transition-colors text-white/60 hover:text-white flex-shrink-0 overflow-hidden relative"
                title="Player"
              >
                <span className="absolute inset-0 flex items-center justify-center transition-all duration-300">
                  <Play size={18} className={`transition-all duration-300 ${playerButtonHovered ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`} />
                </span>
                <span className="absolute inset-0 flex items-center justify-center transition-all duration-300">
                  <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${playerButtonHovered ? 'opacity-100' : 'opacity-0'}`}>Player</span>
                </span>
              </button>

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

            {/* Center: the 5 pages, direct links — desktop only */}
            <nav className="hidden md:flex items-center justify-center flex-1 px-6">
              <div className="flex items-center gap-6 lg:gap-8">
                {menuItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      className={`text-xs font-black uppercase tracking-widest transition-all duration-200 relative group whitespace-nowrap ${
                        active ? 'text-white' : 'text-white/50 hover:text-white/80'
                      }`}
                    >
                      {item.label}
                      <span className={`absolute -bottom-1.5 left-0 w-full h-0.5 bg-red-500 transition-all duration-200 ${
                        active ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                      }`} />
                    </Link>
                  );
                })}
              </div>
            </nav>

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

      {/* Slide-in menu panel — same "Martin Garrix style" big menu as the public site's Navigation.tsx */}
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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" style={{ WebkitBackdropFilter: 'blur(40px)' }} />
            <div className="relative z-10 h-full flex flex-col px-8 md:px-12" onClick={(e) => e.stopPropagation()}>

              {/* Top bar — logo left, X right, same as Navigation.tsx */}
              <div className="flex items-center justify-between py-5 md:py-6 flex-shrink-0">
                <button onClick={() => { closeMenu(); navigate('/manager/dashboard'); }} className="block flex-shrink-0 cursor-pointer">
                  <img
                    src="/Jonna Rincon Logo WH.png"
                    alt="Jonna Rincon"
                    className="h-[100px] md:h-[110px] w-auto opacity-50 hover:opacity-100 transition-opacity duration-300"
                  />
                </button>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300 cursor-pointer group"
                >
                  <X className="w-5 h-5 text-white/60 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
                </button>
              </div>

              <div className="w-full h-px bg-white/[0.06] mb-4" />

              {/* Menu items — same big typography as the public menu */}
              <div className="flex-1 flex flex-col overflow-y-auto pr-2 pb-12">
                <button
                  onClick={() => { closeMenu(); handleSignOut(); }}
                  className="group w-full text-left py-4 md:py-5 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-3xl md:text-4xl font-semibold text-white/90 group-hover:text-white transition-colors duration-300 tracking-tight">
                        Sign Out
                      </span>
                      <span className="block text-xs text-white/25 mt-1 uppercase tracking-widest font-medium">
                        {user?.displayName || user?.email}
                      </span>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-white/10 group-hover:text-white/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </button>
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
