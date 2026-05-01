import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartContext } from './contexts/CartContext';
import Hero from './components/Hero';
import BeatStore from './components/BeatStore';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import SectionCards from './components/SectionCards';

// Hidden for now, kept for later use:
// import Music from './components/Music';
// import Socials from './components/Socials';
// import LiveStudio from './components/LiveStudio';
// import Marquee from './components/Marquee';
// import MarqueeRed from './components/MarqueeRed';
// import WaveformDivider from './components/WaveformDivider';

import { Beat } from './lib/types';

function App() {
  const { isOpen, setIsOpen, addToCart } = useCartContext();
  const navigate = useNavigate();
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  const handleAddToCart = (beat: Beat, license: 'basic' | 'premium' | 'exclusive') => {
    addToCart(beat, license);
  };

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

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
        <div id="hero" style={{ height: 'calc(100vh - 5rem)', overflow: 'hidden' }}><Hero /></div>
        <SectionCards />
        <BeatStore onAddToCart={handleAddToCart} />
        <Footer />
      </main>
    </div>
  );
}

export default App;
