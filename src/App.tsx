import { useState, useEffect } from 'react';
import Hero from './components/Hero';
import BeatStore from './components/BeatStore';
import Music from './components/Music';
import Socials from './components/Socials';
import LiveStudio from './components/LiveStudio';
import Footer from './components/Footer';
import ShoppingCart from './components/ShoppingCart';
import Marquee from './components/Marquee';
import MarqueeRed from './components/MarqueeRed';
import WaveformDivider from './components/WaveformDivider';
import LoadingScreen from './components/LoadingScreen';

import { Beat, CartItem } from './lib/types';

// FIREBASE IMPORTS
import { collection, addDoc } from 'firebase/firestore';
import { db } from './lib/firebase/config';

function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDarkOverlay, setIsDarkOverlay] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);


  const handleAddToCart = (beat: Beat, license: 'basic' | 'premium' | 'exclusive') => {
    let price = beat.price;
    if (license === 'premium') price = beat.price * 1.5;
    if (license === 'exclusive') price = beat.price * 3;

    const newItem: CartItem = { beat, license, price };
    setCartItems([...cartItems, newItem]);
    setIsCartOpen(true);
  };

  const handleRemoveItem = (beatId: string) => {
    setCartItems(cartItems.filter((item) => item.beat.id !== beatId));
  };

  const handleCheckout = async () => {
    const order = {
      customerEmail: 'customer@example.com',
      items: cartItems.map(item => ({
        beatId: item.beat.id,
        beatTitle: item.beat.title,
        licenseType: item.license,
        price: item.price
      })),
      total: cartItems.reduce((sum, item) => sum + item.price, 0),
      status: 'pending',
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, 'orders'), order);
      alert('Order created successfully!');
      setCartItems([]);
    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Failed to create order');
    }
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
      <LoadingScreen onLoadingComplete={() => setLoadingComplete(true)} />

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />

      <main className="pt-20">
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
