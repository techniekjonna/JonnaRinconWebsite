import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { useCartContext } from '../contexts/CartContext';

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMenuLabel, setShowMenuLabel] = useState(false);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [logoScale, setLogoScale] = useState(1);
  const [headerOpacity, setHeaderOpacity] = useState(1);
  const { cartItems, setIsOpen: setCartOpen } = useCartContext();

  // Hide header on protected/admin routes
  const isProtectedRoute = location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/manager') ||
    location.pathname.startsWith('/artist') ||
    location.pathname.startsWith('/customer');

  if (isProtectedRoute) return null;

  // Listen for sidebar open event
  useEffect(() => {
    const handleSidebarStateChange = (e: CustomEvent) => {
      const { isOpen } = e.detail;
      // Subtle animation: slightly fade out header when sidebar opens
      setHeaderOpacity(isOpen ? 0.4 : 1);
      setLogoScale(isOpen ? 0.8 : 1);
    };

    window.addEventListener('sidebar-state-change', handleSidebarStateChange as EventListener);
    return () => window.removeEventListener('sidebar-state-change', handleSidebarStateChange as EventListener);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenu = () => setShowMobileMenu(false);

  const navItems = [
    { label: 'Shop', href: '/shop', position: 'left' },
    { label: 'Catalogue', href: '/catalogue', position: 'left' },
    { label: 'Socials', href: '/socials', position: 'right' },
    { label: 'About Me', href: '/#about', position: 'right' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 pt-3 px-4 sm:px-6 lg:px-8 transition-opacity duration-300"
      style={{ opacity: headerOpacity }}
    >
      <div className="backdrop-blur-xl bg-black/30 border border-white/[0.08] rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 h-20">
          {/* Desktop Logo - Left */}
          <Link to="/" className="hidden md:flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] transition-colors group">
            <span className="text-xs font-black text-white tracking-tighter">JR</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center gap-12">
              {/* Left items */}
              <div className="flex gap-8">
                {navItems
                  .filter(item => item.position === 'left')
                  .map(item => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className={`text-sm font-semibold transition-all duration-200 relative group ${
                        isActive(item.href)
                          ? 'text-white'
                          : 'text-white/50 hover:text-white/80'
                      }`}
                    >
                      {item.label}
                      <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-red-500 transition-all duration-200 ${
                        isActive(item.href) ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                      }`} />
                    </Link>
                  ))}
              </div>

              {/* Center Logo/Title */}
              <div
                ref={logoRef}
                className="text-center px-12 border-x border-white/[0.08] flex-shrink-0 transition-transform duration-300"
                style={{ transform: `scale(${logoScale})` }}
              >
                <h1 className="text-lg font-black text-white tracking-tighter">JONNA RINCON</h1>
              </div>

              {/* Right items */}
              <div className="flex gap-8">
                {navItems
                  .filter(item => item.position === 'right')
                  .map(item => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className={`text-sm font-semibold transition-all duration-200 relative group ${
                        isActive(item.href)
                          ? 'text-white'
                          : 'text-white/50 hover:text-white/80'
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

          {/* Desktop Cart - Right */}
          {cartItems.length > 0 && (
            <button
              onClick={() => setCartOpen(true)}
              className="hidden md:flex items-center justify-center flex-shrink-0 relative w-10 h-10 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] transition-colors group"
              title="Shopping Cart"
            >
              <ShoppingBag size={18} className="text-white/70 group-hover:text-white transition-colors" />
              <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                {cartItems.length}
              </span>
            </button>
          )}

          {/* Mobile: JR Logo - Left */}
          <Link to="/" className="md:hidden flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] transition-colors">
            <span className="text-xs font-black text-white tracking-tighter">JR</span>
          </Link>

          {/* Mobile Menu Button - Center */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            onMouseEnter={() => setShowMenuLabel(true)}
            onMouseLeave={() => setShowMenuLabel(false)}
            className="md:hidden flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.08] transition-colors text-white/40 hover:text-white group flex-1 justify-center"
            title="Menu"
          >
            <div className="transition-transform duration-300">{showMobileMenu ? <X size={18} /> : <Menu size={18} />}</div>
            <span className={`text-xs font-semibold uppercase tracking-widest transition-all duration-300 ${
              showMenuLabel || showMobileMenu
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-2'
            }`}>
              Menu
            </span>
          </button>

          {/* Mobile Cart - Right */}
          {cartItems.length > 0 && (
            <button
              onClick={() => setCartOpen(true)}
              className="md:hidden flex items-center justify-center flex-shrink-0 relative w-10 h-10 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] transition-colors group"
              title="Shopping Cart"
            >
              <ShoppingBag size={18} className="text-white/70 group-hover:text-white transition-colors" />
              <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                {cartItems.length}
              </span>
            </button>
          )}

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div
              ref={menuRef}
              className="absolute top-full right-4 mt-2 w-48 bg-black/95 backdrop-blur-xl border border-white/[0.08] rounded-xl overflow-hidden z-50 md:hidden"
            >
              <nav className="py-3 space-y-1">
                {navItems.map(item => (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={closeMenu}
                    className={`block px-4 py-2.5 text-sm font-semibold transition-all ${
                      isActive(item.href)
                        ? 'bg-white/[0.1] text-white border-l-2 border-red-500'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
