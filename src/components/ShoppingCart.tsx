import { useState } from 'react';
import { X, ShoppingCart as CartIcon, Trash2, AlertTriangle } from 'lucide-react';
import { CartItem } from '../hooks/useCart';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onClearCart?: () => void;
  onCheckout: () => void;
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
}

export default function ShoppingCart({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isLoggedIn = false,
  onLoginRequired,
}: ShoppingCartProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleCheckout = () => {
    if (!isLoggedIn) {
      onLoginRequired?.();
      return;
    }
    onCheckout();
  };

  const handleClearConfirmed = () => {
    onClearCart?.();
    setShowClearConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xl z-[100] animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Centraal Pop-up Cart */}
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-scale-in">
          {/* Clear confirmation dialog */}
          {showClearConfirm && (
            <>
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-10 rounded-2xl" />
              <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
                <div className="bg-black/90 border border-white/20 rounded-2xl p-8 text-center max-w-sm w-full">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white mb-2">Clear cart?</h3>
                  <p className="text-white/50 text-sm mb-6">All items will be removed from your cart.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 py-3 border border-white/20 rounded-lg text-white/70 hover:text-white hover:border-white/40 font-semibold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearConfirmed}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold transition-all"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <CartIcon className="w-8 h-8 text-white" />
              <h2 className="text-3xl font-black text-white">
                Shopping Cart
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {items.length > 0 && onClearCart && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-xs text-white/30 hover:text-red-400 uppercase tracking-widest font-semibold transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="p-3 glass rounded-full transition-all hover:scale-110 hover:rotate-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <CartIcon className="w-24 h-24 text-white/20 mx-auto mb-6" />
                <p className="text-gray-400 text-xl font-medium mb-2">Your cart is empty</p>
                <p className="text-gray-500 text-sm mb-8">Add some beats or tracks to get started!</p>
                <button
                  onClick={onClose}
                  className="px-8 py-4 bg-white text-black hover:bg-gray-200 rounded-lg font-bold text-lg transition-all hover:scale-105"
                >
                  Browse Music
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="bg-white/5 border border-white/10 rounded-lg p-5 transition-all hover:bg-white/10"
                  >
                    <div className="flex gap-5">
                      <img
                        src={item.artworkUrl || '/JEIGHTENESIS.jpg'}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xl text-white mb-1 truncate">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-3">
                          {item.artist}
                          {item.bpm ? <> &bull; {item.bpm} BPM</> : null}
                          {item.key ? <> &bull; {item.key}</> : null}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase ${
                            item.type === 'track'
                              ? 'bg-purple-600/20 text-purple-300'
                              : 'bg-white/10 text-gray-300'
                          }`}>
                            {item.type === 'track' ? 'Track' : 'Beat'} &bull; Exclusive License
                          </span>
                          <span className="text-2xl font-black text-white">
                            &euro;{item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-3 hover:bg-red-600/20 rounded-xl transition-all group flex-shrink-0"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Checkout */}
          {items.length > 0 && (
            <div className="border-t border-white/10 p-8 flex-shrink-0">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xl font-bold text-gray-300">Total:</span>
                <span className="text-4xl font-black text-white">
                  &euro;{total.toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full py-5 bg-white text-black hover:bg-gray-200 rounded-lg font-black text-xl transition-all hover:scale-105 active:scale-95"
              >
                {isLoggedIn ? 'Proceed to Checkout' : 'Sign In to Checkout'}
              </button>
              {!isLoggedIn && (
                <p className="text-center text-xs text-white/40 mt-3">
                  You need an account to complete your purchase.
                </p>
              )}
              <p className="text-center text-xs text-gray-500 mt-2">
                Secure checkout &bull; All licenses included
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
