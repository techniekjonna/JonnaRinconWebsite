import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useCartContext } from '../contexts/CartContext';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart } = useCartContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen text-white flex flex-col">
        <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />
        <Navigation isDarkOverlay={true} isLightMode={false} />
        <div className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center max-w-md">
            <div className="bg-white/[0.08] border border-white/[0.12] rounded-2xl p-12">
              <AlertCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h1 className="text-2xl font-black text-white mb-2">Cart is Empty</h1>
              <p className="text-white/40 mb-8">Add some products to your cart before checking out.</p>
              <button
                onClick={() => navigate('/shop/beats')}
                className="w-full px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const total = getTotalPrice();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clear cart and show success
    clearCart();
    setIsProcessing(false);
    navigate('/checkout-success');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen text-white flex flex-col">
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />
      <Navigation isDarkOverlay={true} isLightMode={false} />

      <div className="flex-1 px-6 md:px-12 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <h1 className="text-5xl font-black text-white uppercase mb-2">Checkout</h1>
            <p className="text-white/40">Complete your purchase securely</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-8">
              {/* Order Items */}
              <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6 uppercase">Order Summary</h2>
                <div className="space-y-4">
                  {cartItems.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex gap-4 pb-4 border-b border-white/[0.08] last:border-0">
                      <img
                        src={item.artworkUrl || '/JEIGHTENESIS.jpg'}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate">{item.title}</h3>
                        <p className="text-sm text-white/60">{item.artist}</p>
                        <p className="text-xs text-white/40 mt-1 uppercase">
                          {item.type === 'track' ? 'Track' : 'Beat'} • Exclusive License
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-white">€{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6 uppercase">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-white/[0.12] rounded-lg cursor-pointer hover:bg-white/[0.04] transition-colors"
                    style={{ borderColor: paymentMethod === 'card' ? 'rgb(220, 38, 38)' : 'inherit' }}>
                    <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')} className="mr-3 w-4 h-4" />
                    <span className="text-white font-semibold">Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center p-4 border border-white/[0.12] rounded-lg cursor-pointer hover:bg-white/[0.04] transition-colors">
                    <input type="radio" name="payment" value="paypal" checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')} className="mr-3 w-4 h-4" />
                    <span className="text-white font-semibold">PayPal</span>
                  </label>
                </div>
              </div>

              {/* Billing Details */}
              {paymentMethod === 'card' && (
                <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 uppercase">Billing Details</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">Email</label>
                      <input type="email" name="email" required value={formData.email} onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-red-500/40" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">Full Name</label>
                      <input type="text" name="fullName" required value={formData.fullName} onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-red-500/40" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">Card Number</label>
                      <input type="text" name="cardNumber" placeholder="1234 5678 9012 3456" required value={formData.cardNumber} onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-red-500/40" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-2">Expiry Date</label>
                        <input type="text" name="expiryDate" placeholder="MM/YY" required value={formData.expiryDate} onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-red-500/40" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-2">CVV</label>
                        <input type="text" name="cvv" placeholder="123" required value={formData.cvv} onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-red-500/40" />
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Order Total */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 bg-white/[0.06] border border-white/[0.12] rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-6">Order Total</h2>
                <div className="space-y-3 pb-6 border-b border-white/[0.08]">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Tax</span>
                    <span>Included</span>
                  </div>
                </div>
                <div className="pt-6 mb-6">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-white">Total</span>
                    <span className="text-3xl font-black text-white">€{total.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || !formData.email || !formData.fullName || (paymentMethod === 'card' && (!formData.cardNumber || !formData.expiryDate || !formData.cvv))}
                  className={`w-full py-4 rounded-lg font-bold uppercase tracking-wider transition-all ${
                    isProcessing || !formData.email || !formData.fullName || (paymentMethod === 'card' && (!formData.cardNumber || !formData.expiryDate || !formData.cvv))
                      ? 'bg-white/[0.06] text-white/30 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Complete Purchase'}
                </button>
                <p className="text-xs text-white/40 text-center mt-4">
                  Secure checkout • All licenses included
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
