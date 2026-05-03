import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, ArrowUpRight, Music, LogOut, LogIn, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCartContext } from '../contexts/CartContext';
import ShoppingCart from './ShoppingCart';
import { getCurrentTrack, togglePlayerOpen, openPlayer, setPreviewTrack } from './GlobalAudioPlayer';
import { useTracks } from '../hooks/useTracks';
import { useContrastColor } from '../lib/utils/colorDetection';

interface NavigationProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  isDarkOverlay?: boolean;
  isLightMode?: boolean;
  onMenuToggle?: (isOpen: boolean) => void;
}

export default function Navigation({ cartItemCount = 0, onCartClick, isDarkOverlay = false, isLightMode = false, onMenuToggle }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showClearAuthConfirm, setShowClearAuthConfirm] = useState(false);
  const [expandedShop, setExpandedShop] = useState(false);
  const [expandedCatalogue, setExpandedCatalogue] = useState(false);
  const [expandedAboutMe, setExpandedAboutMe] = useState(false);
  const [expandedGetInTouch, setExpandedGetInTouch] = useState(false);
  const { user, signIn, signUp, signOut } = useAuth();
  const { cartItems, isOpen: isCartOpen, setIsOpen: setIsCartOpen, removeFromCart, clearCart } = useCartContext();
  const { tracks } = useTracks();
  const navigate = useNavigate();
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);
  const scrollPositionRef = useRef(0);

  // Smart color detection for menu button and logo
  const smartColor = useContrastColor();

  // Convert color name to actual color value for inline styles
  const getColorValue = (colorName: string): string => {
    const colors: Record<string, string> = {
      'white': '#ffffff',
      'black': '#000000',
    };
    return colors[colorName] || '#ffffff';
  };

  const navTextColor = getColorValue('white');  // Always white navigation text

  // Listen for external open event (from Header hamburger button)
  useEffect(() => {
    const handleOpenPanel = () => openMenu();
    window.addEventListener('open-nav-panel', handleOpenPanel);
    return () => window.removeEventListener('open-nav-panel', handleOpenPanel);
  }, []);

  // Lock scroll when menu is open - improved state management
  useEffect(() => {
    const updateBodyScroll = () => {
      if (isMenuOpen && !isMenuClosing) {
        // Save current scroll position before locking
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
        // Restore scroll position
        if (scrollPositionRef.current > 0) {
          window.scrollTo(0, scrollPositionRef.current);
        }
      }
    };

    updateBodyScroll();
    onMenuToggle?.(isMenuOpen);

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isMenuOpen, isMenuClosing, onMenuToggle]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        await signIn(authEmail, authPassword);
      } else {
        if (authPassword.length < 6) {
          setAuthError('Password must be at least 6 characters');
          setAuthLoading(false);
          return;
        }
        await signUp(authEmail, authPassword, authName || undefined);
      }
      setIsAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      navigate('/customer/dashboard');
    } catch (err: any) {
      setAuthError(err.message || 'Something went wrong');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin/dashboard';
      case 'artist': return '/artist/dashboard';
      case 'user': return '/customer/dashboard';
      default: return '/login';
    }
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
    setAuthError('');
  };

  const clearAuthForm = () => {
    setAuthEmail('');
    setAuthPassword('');
    setAuthName('');
    setAuthError('');
    setShowClearAuthConfirm(false);
  };

  const closeMenu = () => {
    setIsMenuClosing(true);
    closeTimeout.current = setTimeout(() => {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
    }, 500);
  };

  const openMenu = () => {
    if (isMenuOpen && !isMenuClosing) return; // prevent double-open
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setIsMenuClosing(false);
    setIsMenuOpen(true);
  };

  const handleCartClick = () => {
    closeMenu();
    onCartClick?.();
  };

  const handleMenuAuthClick = () => {
    closeMenu();
    if (user) {
      navigate(getDashboardLink());
    } else {
      setAuthMode('login');
      setIsAuthModalOpen(true);
    }
  };

  // Determine nav colors based on smart detection
  // Use smartColor for both logo and menu based on background brightness
  const useWhiteNav = true;  // Always use white logo and white text for nav
  const useBlackNav = false;

  const shopSubmenu = [
    { label: 'Beat Shop', subtitle: 'Browse instrumentals', href: '/shop/beats' },
    { label: 'Services', subtitle: 'Professional audio services', href: '/shop/services' },
    { label: 'Merchandise', subtitle: 'Official branded products', href: '/shop/merchandise' },
    { label: 'Art', subtitle: 'Digital & visual art', href: '/shop/art' },
  ];

  const catalogueSubmenu = [
    { label: 'Tracks', subtitle: 'Full discography', href: '/catalogue' },
    { label: 'Remixes', subtitle: 'Remixes and edits', href: '/catalogue' },
    { label: 'DJ Sets', subtitle: 'Live DJ performances', href: '/catalogue' },
  ];

  const aboutMeSubmenu = [
    { label: 'Productions', subtitle: 'Production work & collaborations', href: '/about' },
    { label: 'Streams', subtitle: 'Stream on all platforms', href: '/about' },
    { label: 'Community', subtitle: 'Artist support & features', href: '/about' },
  ];

  const getInTouchSubmenu = [
    { label: 'Social Media', subtitle: 'Follow on all platforms', href: '/socials', action: () => { closeMenu(); navigate('/socials'); } },
    { label: 'Contact', subtitle: 'For serious inquiries', href: '#contact', action: () => { closeMenu(); navigate('/contact'); } },
  ];

  const menuItems: { label: string; subtitle: string; href?: string; action?: () => void; submenu?: Array<{ label: string; subtitle: string; href: string; action?: () => void }>; expanded?: boolean; mobileOnly?: boolean }[] = [
    { label: 'SHOP', subtitle: 'Browse our catalog', action: () => setExpandedShop(!expandedShop), submenu: shopSubmenu, expanded: expandedShop },
    { label: 'CATALOGUE', subtitle: 'Tracks, remixes & DJ sets', action: () => setExpandedCatalogue(!expandedCatalogue), submenu: catalogueSubmenu, expanded: expandedCatalogue },
    { label: 'ABOUT ME', subtitle: 'Productions, streams & community', action: () => { closeMenu(); navigate('/about'); }, mobileOnly: true },
    { label: 'GET IN TOUCH', subtitle: 'Connect with Jonna', action: () => setExpandedGetInTouch(!expandedGetInTouch), submenu: getInTouchSubmenu, expanded: expandedGetInTouch },
  ];

  const socialLinks = [
    { label: 'Instagram', href: 'https://www.instagram.com/jonnarincon/' },
    { label: 'YouTube', href: 'https://www.youtube.com/jonnarincon' },
    { label: 'Spotify', href: 'https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F' },
    { label: 'SoundCloud', href: 'https://soundcloud.com/jonnarincon' },
    { label: 'Shops', href: '/shop', internal: true },
  ];

  const menuVisible = isMenuOpen || isMenuClosing;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="w-full">

        {/* Auth Modal */}
        {isAuthModalOpen && (
          <>
            {/* Backdrop — closes modal but keeps form data */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[120] animate-fade-in"
              onClick={() => setIsAuthModalOpen(false)}
            />

            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 pointer-events-none">
              <div className="pointer-events-auto bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in relative">
                {/* Clear form confirmation overlay */}
                {showClearAuthConfirm && (
                  <>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 rounded-2xl" />
                    <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
                      <div className="text-center">
                        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                        <h3 className="text-lg font-black text-white mb-1">Clear form?</h3>
                        <p className="text-white/50 text-sm mb-5">All entered data will be removed.</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowClearAuthConfirm(false)}
                            className="flex-1 py-2.5 border border-white/20 rounded-lg text-white/70 hover:text-white font-semibold text-sm transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={clearAuthForm}
                            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold text-sm transition-all"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="p-8">
                  <div className="flex items-start justify-between mb-8">
                    <h2 className="text-4xl font-black text-white uppercase tracking-wider">
                      {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setShowClearAuthConfirm(true)}
                        className="text-xs text-white/20 hover:text-red-400 uppercase tracking-widest font-semibold transition-colors"
                        title="Clear form"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setIsAuthModalOpen(false)}
                        className="p-2 rounded-full transition-all hover:scale-110 hover:rotate-90"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="flex flex-col gap-5">
                    {authError && (
                      <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-xl text-sm">
                        {authError}
                      </div>
                    )}

                    {authMode === 'signup' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Full Name</label>
                        <input
                          type="text"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-white/30 focus:outline-none transition-all"
                          placeholder="Your name"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-white/30 focus:outline-none transition-all"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Password</label>
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-white/30 focus:outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>

                    {authMode === 'login' && (
                      <div className="flex justify-end">
                        <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                          Forgot password?
                        </a>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-4 bg-white text-black hover:bg-gray-200 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {authLoading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm">
                      {authMode === 'login' ? (
                        <>
                          Don't have an account?{' '}
                          <button onClick={toggleAuthMode} className="text-white hover:text-gray-300 font-semibold transition-colors">
                            Create one
                          </button>
                        </>
                      ) : (
                        <>
                          Already have an account?{' '}
                          <button onClick={toggleAuthMode} className="text-white hover:text-gray-300 font-semibold transition-colors">
                            Sign in
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========== SIDE PANEL MENU (Martin Garrix style) ========== */}
        {menuVisible && (
          <>
            {/* Backdrop — subtle dark overlay */}
            <div
              className={`fixed inset-0 z-[100] transition-opacity duration-500 ${
                isMenuClosing ? 'opacity-0' : 'opacity-100'
              }`}
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              onClick={closeMenu}
            />

            {/* Side Panel — slides in from right */}
            <div
              className={`fixed top-0 right-0 bottom-0 z-[101] w-full md:w-[480px] lg:w-[520px] md:border-l md:border-white/[0.06] ${
                isMenuClosing ? 'animate-panel-slide-out' : 'animate-panel-slide-in'
              }`}
            >
              {/* Panel background — glassmorphism */}
              <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" style={{ WebkitBackdropFilter: 'blur(40px)' }} />

              {/* Panel content */}
              <div className="relative z-10 h-full flex flex-col px-8 md:px-12">

                {/* Top bar — Logo left, X right */}
                <div className="flex items-center justify-between py-5 md:py-6 flex-shrink-0">
                  <button
                    onClick={() => { closeMenu(); navigate('/'); }}
                    className="block flex-shrink-0 cursor-pointer"
                  >
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

                {/* Divider */}
                <div className="w-full h-px bg-white/[0.06] mb-4" />

                {/* Menu items — clean, modern, spaced, scrollable */}
                <div className="flex-1 flex flex-col overflow-y-auto pr-2 pb-12">
                  {menuItems.map((item, i) => (
                    <div key={item.label} className={item.mobileOnly ? 'md:hidden' : ''}>
                      <button
                        onClick={item.action}
                        className="group w-full text-left py-4 md:py-5 cursor-pointer border-b border-white/[0.04]"
                        style={{
                          animation: isMenuClosing ? 'none' : `menu-item-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + i * 0.06}s both`,
                        }}
                      >
                        <div className={`flex items-center justify-between transition-transform duration-300 ${!item.expanded ? 'group-hover:translate-x-2' : ''}`}>
                          <div>
                            <span className="block text-3xl md:text-4xl font-semibold text-white/90 group-hover:text-white transition-colors duration-300 tracking-tight">
                              {item.label}
                            </span>
                            <span className="block text-xs text-white/25 mt-1 uppercase tracking-widest font-medium group-hover:text-red-400/60 transition-colors duration-300">
                              {item.subtitle}
                            </span>
                          </div>
                          <ArrowUpRight className={`w-5 h-5 text-white/10 group-hover:text-red-400/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${item.expanded ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {/* Submenu */}
                      {item.submenu && (
                        <div className={`overflow-hidden transition-all duration-300 ease-out ${item.expanded ? 'max-h-[800px]' : 'max-h-0'}`}>
                          {/* Group small items together */}
                          {(() => {
                            const smallItems = item.submenu.filter((s: any) => s.isSmall);
                            const regularItems = item.submenu.filter((s: any) => !s.isSmall);

                            return (
                              <>
                                {/* Regular items */}
                                {regularItems.map((subitem: any, subIndex) => (
                                  <button
                                    key={subitem.href || subitem.label}
                                    onClick={() => {
                                      if (subitem.action) {
                                        subitem.action();
                                      } else {
                                        closeMenu();
                                        navigate(subitem.href);
                                      }
                                    }}
                                    className="group w-full text-left py-3 md:py-4 cursor-pointer border-b border-white/[0.04] hover:translate-x-1.5 transition-transform duration-300"
                                    style={{
                                      animation: item.expanded && !isMenuClosing ? `menu-item-reveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${0.05 + subIndex * 0.04}s both` : 'none',
                                      paddingLeft: '2rem',
                                    }}
                                  >
                                    <span className="block text-lg md:text-lg font-semibold text-white/60 group-hover:text-white transition-colors duration-300 tracking-tight">
                                      {subitem.label}
                                    </span>
                                    <span className="block text-xs text-white/20 mt-0.5 uppercase tracking-widest font-medium group-hover:text-white/40 transition-colors duration-300">
                                      {subitem.subtitle}
                                    </span>
                                  </button>
                                ))}

                                {/* Small items on same line */}
                                {smallItems.length > 0 && (
                                  <div
                                    className="flex items-center gap-4 py-2 md:py-2.5 px-8 border-b border-white/[0.04] text-center justify-center"
                                    style={{
                                      animation: item.expanded && !isMenuClosing ? `menu-item-reveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${0.05 + regularItems.length * 0.04}s both` : 'none',
                                    }}
                                  >
                                    {smallItems.map((subitem: any, idx) => (
                                      <div key={subitem.href} className="flex items-center gap-4">
                                        <button
                                          onClick={() => {
                                            closeMenu();
                                            navigate(subitem.href);
                                          }}
                                          className="text-xs text-white/60 hover:text-white transition-colors duration-300"
                                        >
                                          {subitem.label}
                                        </button>
                                        {idx < smallItems.length - 1 && (
                                          <span className="text-xs text-white/20">|</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Auth item */}
                  <button
                    onClick={handleMenuAuthClick}
                    className="group w-full text-left py-4 md:py-5 cursor-pointer"
                    style={{
                      animation: isMenuClosing ? 'none' : `menu-item-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + menuItems.length * 0.06}s both`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-3xl md:text-4xl font-semibold text-white/90 group-hover:text-white transition-colors duration-300 tracking-tight">
                          {user ? 'DASHBOARD' : 'SIGN IN'}
                        </span>
                        {user && (
                          <span className="block text-xs text-white/25 mt-1 uppercase tracking-widest font-medium">
                            {user.displayName || user.email}
                          </span>
                        )}
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-white/10 group-hover:text-white/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </button>

                  {/* Now Playing Widget */}
                  {getCurrentTrack() && (
                    <div className="mt-6 p-4 rounded-lg bg-white/[0.04] border border-white/[0.06] backdrop-blur-md">
                      <div className="flex items-center gap-3">
                        <Music className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-white/40 uppercase tracking-wider">Now Playing</p>
                          <p className="text-sm font-semibold text-white truncate">
                            {getCurrentTrack()?.title}
                          </p>
                          <p className="text-xs text-white/50 truncate">
                            {getCurrentTrack()?.artist}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom row: Cart + Player + Login/Logout buttons */}
                  <div className="flex flex-col gap-4 pt-6">
                    {/* Button row */}
                    <div className="flex items-center gap-5">
                      {/* Cart Button */}
                      <button
                        onClick={() => {
                          closeMenu();
                          setIsCartOpen(true);
                        }}
                        className="relative transition-all hover:scale-110 duration-300 cursor-pointer"
                      >
                        <ShoppingBag className="w-5 h-5 text-white/30 hover:text-white transition-colors" strokeWidth={1.5} />
                        {cartItems.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                            {cartItems.length}
                          </span>
                        )}
                      </button>

                      {/* Player Button */}
                      <button
                        onClick={() => {
                          closeMenu();
                          if (!getCurrentTrack() && tracks.length > 0) {
                            const published = tracks.filter(t => t.status === 'published');
                            const random = published[Math.floor(Math.random() * published.length)];
                            if (random) {
                              setPreviewTrack({
                                id: random.id,
                                title: random.title,
                                artist: random.artist,
                                audioUrl: random.audioUrl,
                                coverArt: random.artworkUrl || '',
                              });
                            }
                            openPlayer();
                          } else {
                            togglePlayerOpen();
                          }
                        }}
                        className="transition-all hover:scale-110 duration-300 cursor-pointer"
                        title="Toggle player"
                      >
                        <Music className="w-5 h-5 text-white/30 hover:text-white transition-colors" strokeWidth={1.5} />
                      </button>

                      {/* Login/Logout Button */}
                      {user ? (
                        <button
                          onClick={() => { closeMenu(); handleSignOut(); }}
                          className="transition-all hover:scale-110 duration-300 cursor-pointer"
                          title="Logout"
                        >
                          <LogOut className="w-5 h-5 text-white/30 hover:text-white transition-colors" strokeWidth={1.5} />
                        </button>
                      ) : (
                        <button
                          onClick={() => { closeMenu(); setIsAuthModalOpen(true); setAuthMode('login'); }}
                          className="transition-all hover:scale-110 duration-300 cursor-pointer"
                          title="Login"
                        >
                          <LogIn className="w-5 h-5 text-white/30 hover:text-white transition-colors" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>


                    {/* Logout text button (alternative if user prefers) */}
                    {user && (
                      <button
                        onClick={() => { closeMenu(); handleSignOut(); }}
                        className="text-left cursor-pointer w-full"
                      >
                        <span className="text-sm uppercase tracking-widest text-white/20 hover:text-red-400 transition-colors duration-300 font-medium">
                          Sign Out
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-white/[0.06]" />

                {/* Bottom — Social links */}
                <div className="flex-shrink-0 py-6 md:py-8">
                  <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
                    {socialLinks.map((link) =>
                      (link as any).internal ? (
                        <button
                          key={link.label}
                          onClick={() => { closeMenu(); navigate(link.href); }}
                          className="text-[11px] text-white/25 uppercase tracking-[0.15em] font-medium hover:text-white/60 transition-colors duration-300"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-white/25 uppercase tracking-[0.15em] font-medium hover:text-white/60 transition-colors duration-300"
                        >
                          {link.label}
                        </a>
                      )
                    )}
                  </div>
                  <p className="text-[10px] text-white/15 uppercase tracking-[0.15em] font-medium">
                    &copy; 2025 Jonna Rincon
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
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

      {/* Shopping Cart Modal */}
      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={(beatId) => {
          removeFromCart(beatId);
        }}
        onClearCart={clearCart}
        onCheckout={() => {
          setIsCartOpen(false);
          navigate('/checkout');
        }}
        isLoggedIn={!!user}
        onLoginRequired={() => {
          setIsCartOpen(false);
          navigate('/register');
        }}
      />
    </nav>
  );
}
