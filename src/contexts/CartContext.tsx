import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Beat, Track, BeatPack } from '../lib/firebase/types';

export interface CartItem {
  id: string;
  type: 'beat' | 'track' | 'beatpack';
  title: string;
  artist: string;
  artworkUrl: string;
  audioUrl: string;
  price: number;
  bpm?: number;
  key?: string;
  originalData: any;
}

interface CartContextType {
  cartItems: CartItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addToCart: (beat: Beat) => void;
  addTrackToCart: (track: Track) => void;
  addPackToCart: (pack: BeatPack) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'jonna_beats_cart';

function beatToCartItem(beat: Beat): CartItem {
  return {
    id: beat.id,
    type: 'beat',
    title: beat.title,
    artist: beat.artist,
    artworkUrl: beat.artworkUrl,
    audioUrl: beat.audioUrl,
    price: beat.licenses.exclusive?.price || 0,
    bpm: beat.bpm,
    key: beat.key,
    originalData: beat,
  };
}

function trackToCartItem(track: Track): CartItem {
  return {
    id: track.id,
    type: 'track',
    title: track.title,
    artist: track.artist,
    artworkUrl: track.artworkUrl,
    audioUrl: track.audioUrl,
    price: track.licenses.exclusive?.price || 0,
    bpm: track.bpm,
    key: track.key,
    originalData: track,
  };
}

function packToCartItem(pack: BeatPack): CartItem {
  return {
    id: `pack-${pack.id}`,
    type: 'beatpack',
    title: pack.title,
    artist: `Beat Pack · ${pack.beats.length} beats`,
    artworkUrl: pack.coverUrl,
    audioUrl: pack.beats[0]?.audioUrl || '',
    price: pack.price,
    originalData: pack,
  };
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0 && !('type' in parsed[0] && ('beat' === parsed[0].type || 'track' === parsed[0].type))) {
          const migrated = parsed.map((beat: any) => ({
            id: beat.id,
            type: 'beat' as const,
            title: beat.title,
            artist: beat.artist,
            artworkUrl: beat.artworkUrl || '',
            audioUrl: beat.audioUrl || '',
            price: beat.licenses?.exclusive?.price || 0,
            bpm: beat.bpm,
            key: beat.key,
            originalData: beat,
          }));
          setCartItems(migrated);
        } else {
          setCartItems(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    }
  }, [cartItems, isLoaded]);

  const addToCart = (beat: Beat) => {
    setCartItems(prev => [...prev, beatToCartItem(beat)]);
    setIsOpen(true);
  };

  const addTrackToCart = (track: Track) => {
    if (cartItems.some(item => item.id === track.id)) return;
    setCartItems(prev => [...prev, trackToCartItem(track)]);
    setIsOpen(true);
  };

  const addPackToCart = (pack: BeatPack) => {
    const cartId = `pack-${pack.id}`;
    if (cartItems.some(item => item.id === cartId)) return;
    setCartItems(prev => [...prev, packToCartItem(pack)]);
    setIsOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      isOpen,
      setIsOpen,
      addToCart,
      addTrackToCart,
      addPackToCart,
      removeFromCart,
      clearCart,
      getTotalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within CartProvider');
  }
  return context;
};
