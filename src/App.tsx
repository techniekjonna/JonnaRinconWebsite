import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartContext } from './contexts/CartContext';
import Hero from './components/Hero';
import BeatStore from './components/BeatStore';
import Music from './components/Music';
import Socials from './components/Socials';
import LiveStudio from './components/LiveStudio';
import Footer from './components/Footer';
import Marquee from './components/Marquee';
import MarqueeRed from './components/MarqueeRed';
import WaveformDivider from './components/WaveformDivider';
import LoadingScreen from './components/LoadingScreen';

import { Beat } from './lib/types';

function App() {
  const { cartItems, isOpen, setIsOpen, addToCart, removeFromCart } = useCartContext();
  const navigate = useNavigate();
  const [isDarkOverlay, setIsDarkOverlay] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  const handleAddToCart = (beat: Beat, license: 'basic' | 'premium' | 'exclusive') => {
    addToCart(beat, license);
  };

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };


  // Detect scroll position for dark overlay
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / window.innerHeight) * 100;
      setIsDarkOverlay(scrollPercent >= 8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <div className="min-h-screen text-white">
      <LoadingScreen onLoadingComplete={() => {
        setLoadingComplete(true);
        setTimeout(() => setContentVisible(true), 100);
      }} />

      <main
        className="pt-20"
        style={{
          opacity: contentVisible ? 1 : 0,
          transition: 'opacity 1.2s ease-in-out',
        }}
      >
        {/* === HERO + DARK SECTIONS === */}
        <div id="hero" className="h-screen overflow-hidden"><Hero /></div>
        <Marquee />
        <BeatStore onAddToCart={handleAddToCart} />
        <WaveformDivider />

        {/* === ALL SECTIONS — semi-transparent so JEIGHTENESIS background shows through === */}
        <div className="relative z-10">
          <Music />
          <Socials />
          <MarqueeRed />
          <div id="live-studio"><LiveStudio /></div>
          <Footer />
        </div>
      </main>
    </div>
  );
}

export default App;
