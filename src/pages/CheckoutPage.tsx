import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Tag, X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useCartContext } from '../contexts/CartContext';

const DISCOUNT_CODES: Record<string, { type: 'percent' | 'fixed'; value: number; label: string }> = {
  JONNA10: { type: 'percent', value: 10, label: '10% korting' },
  WELCOME: { type: 'fixed', value: 5, label: '€5,- korting' },
  BEATS20: { type: 'percent', value: 20, label: '20% korting' },
};

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JR-${timestamp}-${random}`;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart } = useCartContext();

  const [isProcessing, setIsProcessing] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; type: 'percent' | 'fixed'; value: number; label: string } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [showOrderItems, setShowOrderItems] = useState(true);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen text-white flex flex-col">
        <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />
        <Navigation isDarkOverlay={true} isLightMode={false} />
        <div className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center max-w-md">
            <div className="bg-white/[0.08] border border-white/[0.12] rounded-2xl p-12">
              <AlertCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h1 className="text-2xl font-black text-white mb-2">Winkelwagen is leeg</h1>
              <p className="text-white/40 mb-8">Voeg producten toe aan je winkelwagen om af te rekenen.</p>
              <button
                onClick={() => navigate('/shop/beats')}
                className="w-full px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all"
              >
                Verder Winkelen
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const subtotal = getTotalPrice();

  const discountAmount = appliedDiscount
    ? appliedDiscount.type === 'percent'
      ? subtotal * (appliedDiscount.value / 100)
      : Math.min(appliedDiscount.value, subtotal)
    : 0;

  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyDiscount = () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) return;

    const found = DISCOUNT_CODES[code];
    if (found) {
      setAppliedDiscount({ code, ...found });
      setDiscountError('');
      setDiscountCode('');
    } else {
      setDiscountError('Ongeldige kortingscode. Probeer opnieuw.');
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountError('');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'E-mailadres is verplicht';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Ongeldig e-mailadres';
    if (!formData.firstName.trim()) newErrors.firstName = 'Voornaam is verplicht';
    if (!formData.lastName.trim()) newErrors.lastName = 'Achternaam is verplicht';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const orderNumber = generateOrderNumber();
    const orderData = {
      orderNumber,
      items: cartItems,
      subtotal,
      discountAmount,
      discountCode: appliedDiscount?.code || null,
      discountLabel: appliedDiscount?.label || null,
      total,
      customerName: `${formData.firstName} ${formData.lastName}`,
      customerEmail: formData.email,
      date: new Date().toISOString(),
    };

    localStorage.setItem('jonna_last_order', JSON.stringify(orderData));
    clearCart();
    setIsProcessing(false);
    navigate('/checkout-success');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const isFormValid = formData.email && formData.firstName.trim() && formData.lastName.trim();

  return (
    <div className="min-h-screen text-white flex flex-col">
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />
      <Navigation isDarkOverlay={true} isLightMode={false} />

      <div className="flex-1 px-6 md:px-12 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={18} />
              Terug
            </button>
            <h1 className="text-5xl font-black text-white uppercase mb-2">Afrekenen</h1>
            <p className="text-white/40">Vul je gegevens in om de bestelling te voltooien</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column */}
              <div className="lg:col-span-2 space-y-6">

                {/* Order items */}
                <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowOrderItems(v => !v)}
                    className="w-full flex items-center justify-between px-8 py-6 hover:bg-white/[0.03] transition-colors"
                  >
                    <h2 className="text-xl font-bold text-white uppercase">
                      Bestelling ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                    </h2>
                    {showOrderItems ? <ChevronUp size={20} className="text-white/40" /> : <ChevronDown size={20} className="text-white/40" />}
                  </button>

                  {showOrderItems && (
                    <div className="px-8 pb-6 space-y-4">
                      {cartItems.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="flex gap-4 pb-4 border-b border-white/[0.08] last:border-0 last:pb-0">
                          <img
                            src={item.artworkUrl || '/JEIGHTENESIS.jpg'}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white truncate">{item.title}</h3>
                            <p className="text-sm text-white/60">{item.artist}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-white/40 uppercase bg-white/[0.06] px-2 py-0.5 rounded">
                                {item.type === 'beatpack' ? 'Beat Pack' : item.type === 'track' ? 'Track' : 'Beat'}
                              </span>
                              <span className="text-xs text-white/40 uppercase bg-white/[0.06] px-2 py-0.5 rounded">
                                Exclusive License
                              </span>
                              {item.bpm && (
                                <span className="text-xs text-white/30">{item.bpm} BPM</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-black text-white text-lg">€{item.price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact gegevens */}
                <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-8">
                  <h2 className="text-xl font-bold text-white mb-6 uppercase">Contactgegevens</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-white/70 mb-2">
                        E-mailadres <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="jouw@email.com"
                        className={`w-full px-4 py-3 bg-white/[0.06] border rounded-lg text-white placeholder-white/30 focus:outline-none transition-colors ${
                          errors.email ? 'border-red-500/60' : 'border-white/[0.12] focus:border-red-500/40'
                        }`}
                      />
                      {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                      <p className="text-white/30 text-xs mt-1">Je ontvangt de bevestiging en downloadlinks op dit adres</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-white/70 mb-2">
                          Voornaam <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="Voornaam"
                          className={`w-full px-4 py-3 bg-white/[0.06] border rounded-lg text-white placeholder-white/30 focus:outline-none transition-colors ${
                            errors.firstName ? 'border-red-500/60' : 'border-white/[0.12] focus:border-red-500/40'
                          }`}
                        />
                        {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white/70 mb-2">
                          Achternaam <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Achternaam"
                          className={`w-full px-4 py-3 bg-white/[0.06] border rounded-lg text-white placeholder-white/30 focus:outline-none transition-colors ${
                            errors.lastName ? 'border-red-500/60' : 'border-white/[0.12] focus:border-red-500/40'
                          }`}
                        />
                        {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Betaling placeholder */}
                <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-8">
                  <h2 className="text-xl font-bold text-white mb-2 uppercase">Betaling</h2>
                  <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-300 font-semibold text-sm">Betalingsfunctionaliteit komt binnenkort</p>
                      <p className="text-blue-400/70 text-xs mt-1">
                        Online betalen via iDEAL, creditcard en PayPal wordt binnenkort toegevoegd.
                        Vul alvast je gegevens in en voltooi de bestelling — we nemen contact op voor de betaling.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column — Order Total */}
              <div className="lg:col-span-1">
                <div className="sticky top-32 bg-white/[0.06] border border-white/[0.12] rounded-2xl p-8 space-y-6">
                  <h2 className="text-xl font-bold text-white uppercase">Overzicht</h2>

                  {/* Price breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-white/60 text-sm">
                      <span>Subtotaal</span>
                      <span>€{subtotal.toFixed(2)}</span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between text-green-400 text-sm">
                        <span>Korting ({appliedDiscount.label})</span>
                        <span>−€{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white/60 text-sm">
                      <span>BTW</span>
                      <span>Inbegrepen</span>
                    </div>
                    <div className="flex justify-between text-white/60 text-sm">
                      <span>Verzendkosten</span>
                      <span>Gratis (digitaal)</span>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.08] pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-white">Totaal</span>
                      <div className="text-right">
                        {appliedDiscount && (
                          <p className="text-white/40 line-through text-sm">€{subtotal.toFixed(2)}</p>
                        )}
                        <span className="text-3xl font-black text-white">€{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Discount code */}
                  <div className="space-y-2">
                    {appliedDiscount ? (
                      <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-green-400" />
                          <span className="text-green-400 font-semibold text-sm">{appliedDiscount.code}</span>
                          <span className="text-green-400/70 text-xs">· {appliedDiscount.label}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveDiscount}
                          className="text-white/40 hover:text-white transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={discountCode}
                            onChange={e => { setDiscountCode(e.target.value); setDiscountError(''); }}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyDiscount())}
                            placeholder="Kortingscode"
                            className="flex-1 px-4 py-2.5 bg-white/[0.06] border border-white/[0.12] rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-red-500/40"
                          />
                          <button
                            type="button"
                            onClick={handleApplyDiscount}
                            className="px-4 py-2.5 bg-white/[0.10] hover:bg-white/[0.16] border border-white/[0.12] rounded-lg text-white text-sm font-semibold transition-colors"
                          >
                            Toepassen
                          </button>
                        </div>
                        {discountError && (
                          <p className="text-red-400 text-xs mt-1">{discountError}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isProcessing || !isFormValid}
                    className={`w-full py-4 rounded-lg font-bold uppercase tracking-wider transition-all ${
                      isProcessing || !isFormValid
                        ? 'bg-white/[0.06] text-white/30 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isProcessing ? 'Bezig met verwerken...' : 'Bestelling Plaatsen'}
                  </button>

                  <p className="text-xs text-white/30 text-center">
                    Alle licenties inbegrepen · Digitale levering
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
