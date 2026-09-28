import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LogOut,
  ArrowLeft,
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
    { label: 'DASHBOARD', subtitle: 'Overview & stats', href: '/manager/dashboard', icon: Home, mobileLabel: 'Home' },
    { label: 'JONNA RINCON PANEL', subtitle: 'Agenda, Social & More', href: '/manager/jonna-rincon-panel', icon: Sparkles, mobileLabel: 'Panel' },
    { label: 'BEATS', subtitle: 'Beat management', href: '/manager/beats', icon: Disc3, mobileLabel: 'Beats' },
    { label: 'COLLABORATIONS', subtitle: 'Active collabs', href: '/manager/collaborations', icon: Handshake, mobileLabel: 'Collabs' },
    { label: 'CHAT', subtitle: 'Messages', href: '/manager/chat', icon: MessageSquare, mobileLabel: 'Chat' },
  ];

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

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
              <span className="hidden md:inline text-xs font-black uppercase tracking-widest text-white/30 ml-2">Manager</span>
            </div>

            {/* Desktop nav */}
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

            {/* Right: utility icons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/[0.08] transition-colors text-white/50 hover:text-white"
                title="Sign Out"
              >
                <LogOut size={17} />
              </button>
              <div className="hidden sm:flex items-center gap-2 ml-1 pl-2 border-l border-white/[0.08]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                  {user?.displayName?.[0] || user?.email?.[0] || 'M'}
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

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
    </div>
  );
};

export default ManagerLayout;
