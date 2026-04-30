import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ShoppingBag } from 'lucide-react';
import { useCartContext } from '../contexts/CartContext';

const Header: React.FC = () => {
  const [hamburgerHovered, setHamburgerHovered] = useState(false);
  const location = useLocation();
  const logoRef = useRef<HTMLDivElement>(null);
  const [logoScale, setLogoScale] = useState(1);
  const [headerOpacity, setHeaderOpacity] = useState(1);
  const { cartItems } = useCartContext();

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

  useEffect(() => {
    const handleSidebarStateChange = (e: CustomEvent) => {
      const { isOpen } = e.detail;
      setHeaderOpacity(isOpen ? 0.4 : 1);
      setLogoScale(isOpen ? 0.8 : 1);
    };

    window.addEventListener('sidebar-state-change', handleSidebarStateChange as EventListener);
    return () => window.removeEventListener('sidebar-state-change', handleSidebarStateChange as EventListener);
  }, []);

  const navItems = [
    { label: 'Shop', href: '/shop', position: 'left' },
    { label: 'Catalogue', href: '/catalogue', position: 'left' },
    { label: 'Socials', href: '/socials', position: 'right' },
    { label: 'About Me', href: '/#about', position: 'right' },
  ];

  const isActive = (path: string) => location.pathname === path;

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
        style={{
          opacity: hamburgerHovered ? 0 : 1,
          transform: hamburgerHovered ? 'translateY(-6px)' : 'translateY(0)',
        }}
      >
        <Menu size={20} />
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-black uppercase tracking-[0.2em] transition-all duration-300"
        style={{
          opacity: hamburgerHovered ? 1 : 0,
          transform: hamburgerHovered ? 'translateY(0)' : 'translateY(6px)',
        }}
      >
        MENU
      </span>
    </button>
  );

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 pt-3 px-4 sm:px-6 lg:px-8 transition-opacity duration-300"
      style={{ opacity: headerOpacity }}
    >
      <div className="backdrop-blur-xl bg-black/30 border border-white/[0.08] rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 h-20">

          {/* Desktop Logo - Left */}
          <Link to="/" className="hidden md:flex items-center justify-center flex-shrink-0 w-32 h-32">
            <img src="/Jonna Rincon Logo WH.png" alt="JR" className="w-full h-full object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center gap-12">
              <div className="flex gap-8">
                {navItems
                  .filter(item => item.position === 'left')
                  .map(item => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className={`text-sm font-semibold transition-all duration-200 relative group ${
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

              <div
                ref={logoRef}
                className="text-center px-12 border-x border-white/[0.08] flex-shrink-0 transition-transform duration-300"
                style={{ transform: `scale(${logoScale})` }}
              >
                <h1 className="text-lg font-black text-white tracking-tighter">JONNA RINCON</h1>
              </div>

              <div className="flex gap-8">
                {navItems
                  .filter(item => item.position === 'right')
                  .map(item => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className={`text-sm font-semibold transition-all duration-200 relative group ${
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

          {/* Desktop: Cart + Hamburger */}
          <div className="hidden md:flex items-center gap-2">
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
            <HamburgerMenuButton className="flex" />
          </div>

          {/* Mobile: JR Logo - Left */}
          <Link to="/" className="md:hidden flex items-center justify-center flex-shrink-0 w-10 h-10">
            <img src="/Jonna Rincon Logo WH.png" alt="JR" className="w-full h-full object-contain" />
          </Link>

          <div className="md:hidden flex-1" />

          {/* Mobile: Cart + Hamburger */}
          <div className="md:hidden flex items-center gap-2">
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
            <HamburgerMenuButton className="flex" />
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
