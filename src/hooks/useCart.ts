import { useCartContext } from '../contexts/CartContext';
import { Beat, Track } from '../lib/firebase/types';

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

export function useCart() {
  const ctx = useCartContext();
  return {
    cartItems: ctx.cartItems,
    addToCart: ctx.addToCart,
    addTrackToCart: ctx.addTrackToCart,
    removeFromCart: ctx.removeFromCart,
    removeItemByIndex: (index: number) => {
      const item = ctx.cartItems[index];
      if (item) ctx.removeFromCart(item.id);
    },
    clearCart: ctx.clearCart,
    getTotalPrice: ctx.getTotalPrice,
    isLoaded: true,
  };
}
