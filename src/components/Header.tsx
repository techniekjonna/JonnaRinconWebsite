import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Play, ShoppingBag } from 'lucide-react';
import { useCartContext } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, useT } from '../contexts/LanguageContext';
import { subscribeToPlayerState, openPlayerModal } from './GlobalAudioPlayer';

const Header: React.FC = () => {
  const [hamburgerHovered, setHamburgerHovered] = useState(false);
  const [playerButtonHovered, setPlayerButtonHovered] = useState(false);
  const location = useLocation();
  const { cartItems } = useCartContext();
  const { user } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const t = useT();

  // Drives the subtle glow on the player button — the only "now playing" indicator
  const [isPlayingNow, setIsPlayingNow] = useState(false);

  useEffect(() => {
    return subscribeToPlayerState((store) => {
      setIsPlayingNow(store.isPlaying && !!store.currentTrack);
    });
  }, []);

  const openNavPanel = () => {
    window.dispatchEvent(new CustomEvent('open-nav-panel'));
  };

  const openCart = () => {
    window.dispatchEvent(new CustomEvent('open-cart'));
  };

  const isProtectedRoute = location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/manager') ||
    location.pathname.startsWith('/artist') ||
    location.pathname.startsWith('/customer');

  if (isProtectedRoute) return null;

  const navItems = [
    { label: t('Beats', 'Beats'), href: '/shop/beats', position: 'left' },
    { label: t('Services', 'Diensten'), href: '/shop/services', position: 'left' },
    { label: t('Music', 'Muziek'), href: '/catalogue', position: 'right' },
    { label: t('Contact Me', 'Contact'), href: '/contact', position: 'right' },
  ];

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  // Shows the flag of the currently active language
  const LanguageToggleButton = () => (
    <button
      onClick={toggleLanguage}
      title={language === 'en' ? 'View in English' : 'Bekijk in het Nederlands'}
      className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-lg hover:bg-white/[0.08] transition-colors text-lg"
    >
      <span aria-hidden="true">{language === 'en' ? '🇬🇧' : '🇳🇱'}</span>
    </button>
  );

  const PlayerButton = ({ className }: { className?: string }) => (
    <button
      onClick={() => openPlayerModal()}
      onMouseEnter={() => setPlayerButtonHovered(true)}
      onMouseLeave={() => setPlayerButtonHovered(false)}
      className={`items-center justify-center w-14 h-9 rounded-lg hover:bg-white/[0.08] transition-colors text-white/60 hover:text-white flex-shrink-0 overflow-hidden relative ${className}`}
      title={t('Player', 'Speler')}
    >
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
      >
        <Play
          size={18}
          className={`text-white transition-all duration-300 ${playerButtonHovered ? 'opacity-0 scale-75' : 'opacity-100 scale-100'} ${isPlayingNow ? 'animate-player-glow' : ''}`}
        />
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
      >
        <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${playerButtonHovered ? 'opacity-100' : 'opacity-0'}`}>{t('Player', 'Speler')}</span>
      </span>
    </button>
  );

  const HamburgerMenuButton = ({ className }: { className?: string }) => (
    <button
      onClick={openNavPanel}
      onMouseEnter={() => setHamburgerHovered(true)}
      onMouseLeave={() => setHamburgerHovered(false)}
      className={`items-center justify-center w-14 h-9 rounded-lg hover:bg-white/[0.08] transition-colors text-white/60 hover:text-white flex-shrink-0 overflow-hidden relative ${className}`}
      title="Menu"
    >
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
      >
        <Menu size={20} className={`transition-all duration-300 ${hamburgerHovered ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`} />
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
      >
        <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${hamburgerHovered ? 'opacity-100' : 'opacity-0'}`}>Menu</span>
      </span>
    </button>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pt-3 px-4 sm:px-6 lg:px-8">
      <div className="backdrop-blur-xl bg-black/30 border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16 md:h-20">

          {/* Left: Player button + Logo (button sits left of logo, logo nudged right to make room) */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <PlayerButton className="flex" />
            <Link to="/" className="flex items-center justify-center flex-shrink-0 w-14 h-14 md:w-24 md:h-24">
              <img
                src="/Jonna Rincon Logo WH.png"
                alt="JR"
                className="w-full h-full object-contain"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center gap-12">
              <div className="flex gap-8">
                {navItems.filter(item => item.position === 'left').map(item => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`text-xs font-black uppercase tracking-widest transition-all duration-200 relative group ${
                      isActive(item.href) ? 'text-white' : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    {item.label}
                    <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-red-500 transition-all duration-200 ${
                      isActive(item.href) ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                    }`} />
                  </Link>
                ))}
              </div>

              {/* Center brand — plain, static; the player button's glow is
                  the only "now playing" indicator */}
              <div className="text-center px-6 border-x border-white/[0.08] flex-shrink-0 flex flex-col items-center justify-center gap-1 self-stretch overflow-hidden">
                <h1 className="text-lg font-black text-white tracking-tighter">
                  JONNA RINCON
                </h1>
              </div>

              <div className="flex gap-8">
                {navItems.filter(item => item.position === 'right').map(item => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`text-xs font-black uppercase tracking-widest transition-all duration-200 relative group ${
                      isActive(item.href) ? 'text-white' : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    {item.label}
                    <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-red-500 transition-all duration-200 ${
                      isActive(item.href) ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                    }`} />
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Mobile: plain, static brand — the player button's glow is the
              only "now playing" indicator */}
          <div className="md:hidden flex-1 flex flex-col items-center justify-center gap-0.5">
            <span className="text-sm font-black text-white tracking-tighter">JONNA RINCON</span>
          </div>

          {/* Right: Cart + Hamburger */}
          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                onClick={openCart}
                className="flex items-center justify-center flex-shrink-0 relative w-10 h-10 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] transition-colors group"
                title="Shopping Cart"
              >
                <ShoppingBag size={18} className="text-white/70 group-hover:text-white transition-colors" />
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {cartItems.length}
                </span>
              </button>
            )}
            <LanguageToggleButton />
            <HamburgerMenuButton className="flex" />
          </div>

        </div>
      </div>

      <style>{`
        @keyframes player-glow {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(255,255,255,0.6)); }
          50% { filter: drop-shadow(0 0 7px rgba(255,255,255,0.95)); }
        }
        .animate-player-glow {
          animation: player-glow 1.8s ease-in-out infinite;
        }
      `}</style>
    </header>
  );
};

export default Header;
