import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Play, ShoppingBag } from 'lucide-react';
import { useCartContext } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, useT } from '../contexts/LanguageContext';
import { subscribeToPlayerState, openPlayerModal } from './GlobalAudioPlayer';

const WAVEFORM_HEIGHTS = [5, 10, 14, 8, 16, 11, 14, 9, 16, 12, 8, 14, 10, 6, 12];
const CYCLE_MS = 2500;

const Header: React.FC = () => {
  const [hamburgerHovered, setHamburgerHovered] = useState(false);
  const [playerButtonHovered, setPlayerButtonHovered] = useState(false);
  const location = useLocation();
  const { cartItems } = useCartContext();
  const { user } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const t = useT();

  // Player state for waveform banner
  const [isPlayingNow, setIsPlayingNow] = useState(false);
  const [bannerTrack, setBannerTrack] = useState<{ title: string; artist: string } | null>(null);
  const [cyclePhase, setCyclePhase] = useState<0 | 1 | 2 | 3>(0); // 0=click-hint, 1=label, 2=title, 3=artist
  const [textVisible, setTextVisible] = useState(true);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return subscribeToPlayerState((store) => {
      const playing = store.isPlaying && !!store.currentTrack;
      setIsPlayingNow(playing);
      setBannerTrack(store.currentTrack ? { title: store.currentTrack.title, artist: store.currentTrack.artist } : null);
    });
  }, []);

  // Cycle "Now playing" / title / artist
  useEffect(() => {
    if (cycleRef.current) clearInterval(cycleRef.current);
    if (!isPlayingNow) { setCyclePhase(0); setTextVisible(true); return; }
    cycleRef.current = setInterval(() => {
      setTextVisible(false);
      setTimeout(() => {
        setCyclePhase(p => ((p + 1) % 4) as 0 | 1 | 2 | 3);
        setTextVisible(true);
      }, 350);
    }, CYCLE_MS);
    return () => { if (cycleRef.current) clearInterval(cycleRef.current); };
  }, [isPlayingNow]);

  const nowPlayingText = cyclePhase === 0
    ? 'Click here for more info'
    : cyclePhase === 1
    ? 'Now Playing'
    : cyclePhase === 2
    ? (bannerTrack?.title ?? '')
    : (bannerTrack?.artist ?? '');

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

  // Shows the flag of the language you'd switch TO, not the current one
  const LanguageToggleButton = () => (
    <button
      onClick={toggleLanguage}
      title={language === 'en' ? 'Bekijk in het Nederlands' : 'View in English'}
      className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-lg hover:bg-white/[0.08] transition-colors text-lg"
    >
      <span aria-hidden="true">{language === 'en' ? '🇳🇱' : '🇬🇧'}</span>
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
        <Play size={18} className={`transition-all duration-300 ${playerButtonHovered ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`} />
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

              {/* Center brand — now playing above, logo middle, waveform below */}
              <div className="text-center px-6 border-x border-white/[0.08] flex-shrink-0 flex flex-col items-center justify-center gap-1 self-stretch overflow-hidden">

                {/* "Now playing" cycling text — above logo, visible when playing */}
                {isPlayingNow && bannerTrack && (
                  <button
                    onClick={() => openPlayerModal()}
                    className="group"
                    title={`Now playing: ${bannerTrack.title}`}
                  >
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40 group-hover:text-white/70 transition-colors"
                      style={{ opacity: textVisible ? 1 : 0, transition: 'opacity 0.35s ease' }}
                    >
                      {nowPlayingText}
                    </span>
                  </button>
                )}

                {/* Logo — clickable to player when playing, no action when not */}
                {isPlayingNow ? (
                  <button onClick={() => openPlayerModal()} className="group">
                    <h1 className="text-lg font-black text-white tracking-tighter group-hover:text-white/80 transition-colors">
                      JONNA RINCON
                    </h1>
                  </button>
                ) : (
                  <h1 className="text-lg font-black text-white tracking-tighter">
                    JONNA RINCON
                  </h1>
                )}

                {/* Waveform — below logo, visible when playing */}
                {isPlayingNow && bannerTrack && (
                  <button
                    onClick={() => openPlayerModal()}
                    className="group flex items-end gap-[2px] px-1"
                    title={`Now playing: ${bannerTrack.title}`}
                  >
                    {WAVEFORM_HEIGHTS.map((h, i) => (
                      <div
                        key={i}
                        className="w-[2px] rounded-full bg-white animate-waveform-bar group-hover:bg-red-200 transition-colors"
                        style={{
                          height: `${h}px`,
                          boxShadow: '0 0 5px rgba(255,255,255,0.7)',
                          animationDuration: `${0.55 + (i % 5) * 0.1}s`,
                          animationDelay: `${i * 55}ms`,
                        }}
                      />
                    ))}
                  </button>
                )}
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

          {/* Mobile: now playing above, brand middle, waveform below */}
          <div className="md:hidden flex-1 flex flex-col items-center justify-center gap-0.5">

            {/* "Now playing" text — above logo */}
            <div className="h-3.5 flex items-center justify-center">
              {isPlayingNow && bannerTrack ? (
                <button onClick={() => openPlayerModal()} className="group">
                  <span
                    className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/40 group-hover:text-white/70 transition-colors"
                    style={{ opacity: textVisible ? 1 : 0, transition: 'opacity 0.35s ease' }}
                  >
                    {nowPlayingText}
                  </span>
                </button>
              ) : null}
            </div>

            {/* Logo — opens player when playing, no action when not */}
            {isPlayingNow ? (
              <button onClick={() => openPlayerModal()} className="group">
                <span className="text-sm font-black text-white tracking-tighter group-hover:text-white/80 transition-colors">JONNA RINCON</span>
              </button>
            ) : (
              <span className="text-sm font-black text-white tracking-tighter">JONNA RINCON</span>
            )}

            {/* Waveform — below logo */}
            <div className="h-3.5 flex items-center justify-center">
              {isPlayingNow && bannerTrack ? (
                <button
                  onClick={() => openPlayerModal()}
                  className="group flex items-end gap-[2px]"
                  title={`Now playing: ${bannerTrack.title}`}
                >
                  {WAVEFORM_HEIGHTS.slice(0, 9).map((h, i) => (
                    <div
                      key={i}
                      className="w-[2px] rounded-full bg-white animate-waveform-bar group-hover:bg-red-200 transition-colors"
                      style={{
                        height: `${Math.max(3, Math.round(h * 0.6))}px`,
                        boxShadow: '0 0 4px rgba(255,255,255,0.6)',
                        animationDuration: `${0.55 + (i % 5) * 0.1}s`,
                        animationDelay: `${i * 60}ms`,
                      }}
                    />
                  ))}
                </button>
              ) : null}
            </div>
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
    </header>
  );
};

export default Header;
