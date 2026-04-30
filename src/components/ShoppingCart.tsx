import { X, ShoppingCart as CartIcon, Trash2 } from 'lucide-react';
import { CartItem } from '../hooks/useCart';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}

export default function ShoppingCart({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onCheckout,
}: ShoppingCartProps) {
  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);

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
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <CartIcon className="w-8 h-8 text-white" />
              <h2 className="text-3xl font-black text-white">
                Shopping Cart
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-3 glass rounded-full transition-all hover:scale-110 hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>
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
                onClick={onCheckout}
                className="w-full py-5 bg-white text-black hover:bg-gray-200 rounded-lg font-black text-xl transition-all hover:scale-105 active:scale-95"
              >
                Proceed to Checkout
              </button>
              <p className="text-center text-xs text-gray-500 mt-4">
                Secure checkout &bull; All licenses included
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
