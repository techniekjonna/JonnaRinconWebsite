import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Download, ArrowRight, Mail, Package } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { CartItem } from '../contexts/CartContext';

interface OrderData {
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  discountCode: string | null;
  discountLabel: string | null;
  total: number;
  customerName: string;
  customerEmail: string;
  date: string;
}

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('jonna_last_order');
      if (stored) {
        setOrder(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/customer/dashboard');
    }, 30000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const formattedDate = order
    ? new Date(order.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navigation isDarkOverlay={true} isLightMode={false} />

      <div className="flex-1 flex items-start justify-center px-4 py-20">
        <div className="w-full max-w-2xl space-y-6">

          {/* Success header */}
          <div className="bg-white/[0.08] border border-white/[0.12] rounded-2xl p-10 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center">
                <Check className="w-10 h-10 text-green-400" strokeWidth={3} />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white mb-1">Bestelling Geplaatst!</h1>
              <p className="text-white/50">
                {order?.customerName ? `Bedankt, ${order.customerName.split(' ')[0]}!` : 'Bedankt voor je bestelling!'}
                {' '}Je bestelling is succesvol ontvangen.
              </p>
            </div>
            {order && (
              <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.10] rounded-lg px-4 py-2">
                <Package size={14} className="text-white/40" />
                <span className="text-white/40 text-sm">Ordernummer:</span>
                <span className="text-white font-bold text-sm tracking-wider">{order.orderNumber}</span>
              </div>
            )}
          </div>

          {/* Order details */}
          {order && (
            <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl overflow-hidden">
              <div className="px-8 py-5 border-b border-white/[0.08]">
                <h2 className="text-lg font-bold text-white uppercase">Bestelde Producten</h2>
              </div>
              <div className="px-8 py-4 space-y-4">
                {order.items.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex gap-4 pb-4 border-b border-white/[0.06] last:border-0 last:pb-0">
                    <img
                      src={item.artworkUrl || '/JEIGHTENESIS.jpg'}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{item.title}</h3>
                      <p className="text-sm text-white/50">{item.artist}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-white/40 uppercase bg-white/[0.06] px-2 py-0.5 rounded">
                          {item.type === 'beatpack' ? 'Beat Pack' : item.type === 'track' ? 'Track' : 'Beat'}
                        </span>
                        <span className="text-xs text-white/40 uppercase bg-white/[0.06] px-2 py-0.5 rounded">
                          Exclusive License
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-white">€{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Prijsoverzicht */}
              <div className="px-8 py-5 bg-white/[0.03] border-t border-white/[0.08] space-y-2">
                <div className="flex justify-between text-sm text-white/50">
                  <span>Subtotaal</span>
                  <span>€{order.subtotal.toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Korting {order.discountCode ? `(${order.discountCode})` : ''}</span>
                    <span>−€{order.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-white/50">
                  <span>BTW</span>
                  <span>Inbegrepen</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/[0.08]">
                  <span className="font-bold text-white">Totaal</span>
                  <span className="font-black text-white text-xl">€{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Info blokken */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-6 space-y-2">
              <div className="flex items-center gap-2 text-white/70 mb-1">
                <Mail size={16} />
                <span className="text-sm font-semibold uppercase">Bevestiging</span>
              </div>
              <p className="text-white/40 text-sm">
                {order?.customerEmail
                  ? <>Een bevestiging wordt verstuurd naar <span className="text-white/70">{order.customerEmail}</span></>
                  : 'Een bevestigingsmail wordt naar je e-mailadres verstuurd.'
                }
              </p>
              {formattedDate && (
                <p className="text-white/30 text-xs">{formattedDate}</p>
              )}
            </div>

            <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-6 space-y-2">
              <div className="flex items-center gap-2 text-white/70 mb-1">
                <Download size={16} />
                <span className="text-sm font-semibold uppercase">Downloads</span>
              </div>
              <p className="text-white/40 text-sm">
                Je downloads zijn beschikbaar in je dashboard zodra de betaling is verwerkt.
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Orderstatus</span>
                <span className="text-green-400 font-semibold">Bevestigd</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-white/[0.06] pt-3">
                <span className="text-white/40">Betaling</span>
                <span className="text-yellow-400 font-semibold">In afwachting</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-white/[0.06] pt-3">
                <span className="text-white/40">Licenties</span>
                <span className="text-white/70 font-semibold">Beschikbaar na betaling</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/customer/dashboard')}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all uppercase tracking-wide"
            >
              <Download size={18} />
              Ga naar Dashboard
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/shop/beats')}
              className="w-full px-8 py-3 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.12] text-white/70 font-semibold rounded-lg transition-all text-sm"
            >
              Verder Winkelen
            </button>
            <p className="text-xs text-white/20 text-center">
              Je wordt automatisch doorgestuurd naar het dashboard...
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
