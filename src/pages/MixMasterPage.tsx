import React, { useState } from 'react';
import {
  ChevronLeft, ShoppingCart, ArrowRight, Headphones,
  Check, Plus, Minus, Upload, AlertCircle, Zap, Music,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import { useAuth } from '../contexts/AuthContext';
import { useServices } from '../hooks/useServices';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { Service } from '../lib/firebase/types';

interface MixMasterEntry {
  trackTitle: string;
  mainArtist: string;
  additionalArtists: string[];
  vocalStemsLink: string;
  beatStemsLink: string;
  references: string[];
  deliveryTime: '48h' | '72h' | '7days' | null;
}

const DELIVERY_OPTIONS = [
  { key: '48h' as const, label: '48H', price: 250, desc: 'Express delivery' },
  { key: '72h' as const, label: '72H', price: 150, desc: 'Standard fast' },
  { key: '7days' as const, label: '7 Days', price: 100, desc: 'Relaxed timeline' },
];

const isMixService = (s: Service) => {
  const n = s.name.toLowerCase();
  const sl = (s.slug || '').toLowerCase();
  return n.includes('mix') || sl.includes('mix') || n.includes('master') || sl.includes('master');
};

const isValidUrl = (str: string) => {
  if (!str) return false;
  try { new URL(str); return true; } catch { return false; }
};

const makeEntry = (artist = ''): MixMasterEntry => ({
  trackTitle: '',
  mainArtist: artist,
  additionalArtists: [],
  vocalStemsLink: '',
  beatStemsLink: '',
  references: [''],
  deliveryTime: null,
});

export default function MixMasterPage() {
  useScrollToTop();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { services, loading } = useServices({ status: 'published' });

  const service = services.find(isMixService) ?? null;

  const [page, setPage] = useState<'overview' | 'order'>('overview');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mixMasters, setMixMasters] = useState<MixMasterEntry[]>([makeEntry()]);
  const [activeTab, setActiveTab] = useState(0);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const updateEntry = <K extends keyof MixMasterEntry>(idx: number, field: K, value: MixMasterEntry[K]) => {
    setMixMasters(prev => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  };

  const addMix = () => {
    if (mixMasters.length >= 3) return;
    setMixMasters(prev => [...prev, makeEntry(user?.displayName || '')]);
    setActiveTab(mixMasters.length);
  };

  const removeMix = (idx: number) => {
    if (mixMasters.length <= 1) return;
    const next = mixMasters.filter((_, i) => i !== idx);
    setMixMasters(next);
    setActiveTab(Math.min(activeTab, next.length - 1));
  };

  const getTotalPrice = () =>
    mixMasters.reduce((sum, e) => {
      const opt = DELIVERY_OPTIONS.find(o => o.key === e.deliveryTime);
      return sum + (opt?.price || 0);
    }, 0);

  const handleOrderNow = () => {
    if (!isAuthenticated) { setShowLoginModal(true); return; }
    setMixMasters([makeEntry(user?.displayName || '')]);
    setActiveTab(0);
    setPage('order');
  };

  const handlePlaceOrder = () => {
    console.log('Mix & Master order:', mixMasters);
    setOrderPlaced(true);
  };

  const entry = mixMasters[activeTab];

  return (
    <div className="min-h-screen text-white">
      <Navigation />

      <div className="fixed inset-0 -z-10">
        <img src="/JEIGHTENESIS.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/85" />
      </div>

      <main className="pt-32 pb-24 px-4 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Services</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
            Mix & Master
          </h1>
          <p className="text-white/40 text-sm mt-4 max-w-md mx-auto">
            Professional mixing and mastering by Jonna Rincon. Fast delivery, unlimited revisions.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-red-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && page === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.05] border border-white/10 p-5">
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Delivery</p>
                <p className="text-3xl font-black text-white">48H</p>
                <p className="text-white/40 text-xs mt-1">Express turnaround</p>
              </div>
              <div className="bg-white/[0.05] border border-white/10 p-5">
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Revisions</p>
                <p className="text-3xl font-black text-white">∞</p>
                <p className="text-white/40 text-xs mt-1">Until you're satisfied</p>
              </div>
            </div>

            {/* About */}
            <div className="bg-white/[0.04] border border-white/10 p-6">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-3">About</p>
              <p className="text-white/70 text-sm leading-relaxed">
                {service?.description ||
                  'Get your track mixed and mastered by Jonna Rincon — a producer with 200+ released tracks and experience across EDM, Urban, Moombahton and more. Send your stems, pick your deadline, and receive a polished, release-ready master.'}
              </p>
            </div>

            {/* What's included */}
            <div className="bg-white/[0.04] border border-white/10 p-6">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-4">What's Included</p>
              <div className="space-y-3">
                {[
                  ['Fast Delivery', 'Turnaround from 48 hours'],
                  ['Unlimited Revisions', 'Open for revisions if sensible'],
                  ['Multi-Genre Experience', 'EDM, Urban, Moombahton & more'],
                  ['Up to 3 Tracks', 'Order multiple mixes in one go'],
                ].map(([title, desc]) => (
                  <div key={title} className="flex items-start gap-3">
                    <Check size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white text-sm font-bold">{title}</p>
                      <p className="text-white/40 text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery pricing */}
            <div className="bg-white/[0.04] border border-white/10 p-6">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-4">Pricing</p>
              <div className="grid grid-cols-3 gap-3">
                {DELIVERY_OPTIONS.map(({ label, price, desc }) => (
                  <div key={label} className="bg-white/[0.04] border border-white/10 p-4 text-center">
                    <p className="text-white font-black text-lg uppercase">{label}</p>
                    <p className="text-red-500 font-black text-xl mt-1">€{price}</p>
                    <p className="text-white/30 text-[10px] mt-1">{desc}</p>
                    <p className="text-white/20 text-[10px]">excl. BTW</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Listen CTA */}
            <div className="p-5 bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-white/60 text-sm font-semibold">Hear the quality</p>
                <p className="text-white/30 text-xs">Check out produced & mixed tracks</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/tracks')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/10 hover:border-white/20 text-white/70 text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <Music size={14} /> Tracks
                </button>
                <button
                  onClick={() => navigate('/productions')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/10 hover:border-white/20 text-white/70 text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <Zap size={14} /> Productions
                </button>
              </div>
            </div>

            {/* Rate */}
            {service && (
              <div className="bg-white/[0.05] border border-white/10 p-6 flex items-baseline justify-between">
                <p className="text-white/30 text-xs uppercase tracking-wider">Starting at</p>
                <p className="text-white text-2xl font-black">
                  €{service.rate}<span className="text-white/40 text-sm font-normal"> excl. BTW</span>
                </p>
              </div>
            )}

            <button
              onClick={handleOrderNow}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <ShoppingCart size={18} />
              Order Now <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Order page */}
        {!loading && page === 'order' && !orderPlaced && (
          <div className="space-y-6">
            <button
              onClick={() => setPage('overview')}
              className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
            >
              <ChevronLeft size={16} /> Back to overview
            </button>

            {/* Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {mixMasters.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
                    activeTab === idx
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-white/[0.06] border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  Mix {idx + 1}
                  {mixMasters.length > 1 && (
                    <span
                      role="button"
                      onClick={e => { e.stopPropagation(); removeMix(idx); }}
                      className="hover:text-red-400 transition-colors cursor-pointer"
                    >
                      ×
                    </span>
                  )}
                </button>
              ))}
              {mixMasters.length < 3 ? (
                <button
                  onClick={addMix}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-white/[0.08] hover:border-white/20 text-xs font-bold text-white/40 hover:text-white uppercase tracking-wider transition-all"
                >
                  <Plus size={12} /> Add
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-400/20">
                  <AlertCircle size={12} className="text-orange-400" />
                  <span className="text-xs text-orange-300 font-semibold">
                    More than 3?{' '}
                    <button onClick={() => navigate('/support')} className="underline hover:text-orange-200">
                      Contact us
                    </button>
                  </span>
                </div>
              )}
            </div>

            {/* Track Title */}
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider font-semibold block mb-2">Track Title</label>
              <input
                type="text"
                value={entry.trackTitle}
                onChange={e => updateEntry(activeTab, 'trackTitle', e.target.value)}
                placeholder="Enter track title..."
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 hover:border-white/20 focus:border-white/30 text-white text-sm placeholder-white/30 outline-none transition-colors"
              />
            </div>

            {/* Main Artist */}
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider font-semibold block mb-2">Main Artist</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={entry.mainArtist}
                    onChange={e => updateEntry(activeTab, 'mainArtist', e.target.value)}
                    placeholder="Artist name..."
                    className="flex-1 px-4 py-3 bg-white/[0.06] border border-white/10 hover:border-white/20 focus:border-white/30 text-white text-sm placeholder-white/30 outline-none transition-colors"
                  />
                  <button
                    onClick={() => updateEntry(activeTab, 'additionalArtists', [...entry.additionalArtists, ''])}
                    className="p-3 bg-white/[0.06] border border-white/10 hover:border-white/20 text-white/50 hover:text-white transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {entry.additionalArtists.map((artist, ai) => (
                  <div key={ai} className="flex gap-2">
                    <input
                      type="text"
                      value={artist}
                      onChange={e => {
                        const updated = entry.additionalArtists.map((a, i) => i === ai ? e.target.value : a);
                        updateEntry(activeTab, 'additionalArtists', updated);
                      }}
                      placeholder={`Artist ${ai + 2}...`}
                      className="flex-1 px-4 py-3 bg-white/[0.06] border border-white/10 hover:border-white/20 focus:border-white/30 text-white text-sm placeholder-white/30 outline-none transition-colors"
                    />
                    <button
                      onClick={() => updateEntry(activeTab, 'additionalArtists', entry.additionalArtists.filter((_, i) => i !== ai))}
                      className="p-3 bg-white/[0.06] border border-white/10 hover:border-red-400/30 text-white/50 hover:text-red-400 transition-all"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Stems */}
            {[
              { label: 'Vocal Stems Link', field: 'vocalStemsLink' as const },
              { label: 'Beat Stems Link', field: 'beatStemsLink' as const },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="text-white/40 text-xs uppercase tracking-wider font-semibold block mb-2">{label}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={entry[field] as string}
                      onChange={e => updateEntry(activeTab, field, e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className={`w-full pl-4 pr-10 py-3 bg-white/[0.06] border hover:border-white/20 focus:border-white/30 text-white text-sm placeholder-white/30 outline-none transition-colors ${
                        isValidUrl(entry[field] as string) ? 'border-green-400/50' : 'border-white/10'
                      }`}
                    />
                    {isValidUrl(entry[field] as string) && (
                      <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                    )}
                  </div>
                  <button className="flex items-center gap-2 px-4 py-3 bg-white/[0.06] border border-white/10 hover:border-white/20 text-white/50 hover:text-white text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap">
                    <Upload size={14} /> Upload
                  </button>
                </div>
              </div>
            ))}

            {/* References */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/40 text-xs uppercase tracking-wider font-semibold">Reference Tracks</label>
                {entry.references.length < 3 && (
                  <button
                    onClick={() => updateEntry(activeTab, 'references', [...entry.references, ''])}
                    className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
                  >
                    <Plus size={12} /> Add
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {entry.references.map((ref, ri) => (
                  <div key={ri} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={ref}
                        onChange={e => {
                          const updated = entry.references.map((r, i) => i === ri ? e.target.value : r);
                          updateEntry(activeTab, 'references', updated);
                        }}
                        placeholder="https://open.spotify.com/..."
                        className={`w-full pl-4 pr-10 py-3 bg-white/[0.06] border hover:border-white/20 focus:border-white/30 text-white text-sm placeholder-white/30 outline-none transition-colors ${
                          isValidUrl(ref) ? 'border-green-400/50' : 'border-white/10'
                        }`}
                      />
                      {isValidUrl(ref) && (
                        <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                      )}
                    </div>
                    {entry.references.length > 1 && (
                      <button
                        onClick={() => updateEntry(activeTab, 'references', entry.references.filter((_, i) => i !== ri))}
                        className="p-3 bg-white/[0.06] border border-white/10 hover:border-red-400/30 text-white/50 hover:text-red-400 transition-all"
                      >
                        <Minus size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery time */}
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider font-semibold block mb-2">Delivery Time</label>
              <div className="grid grid-cols-3 gap-2">
                {DELIVERY_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => updateEntry(activeTab, 'deliveryTime', opt.key)}
                    className={`py-3 border transition-all text-center ${
                      entry.deliveryTime === opt.key
                        ? 'bg-red-600/30 border-red-400/50 text-white'
                        : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <p className="text-sm font-black uppercase">{opt.label}</p>
                    <p className="text-xs font-bold text-white/60 mt-0.5">€{opt.price}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">excl. BTW</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Total & CTA */}
            <div className="border-t border-white/10 pt-6">
              {getTotalPrice() > 0 && (
                <div className="mb-4 p-4 bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider font-bold">Total</p>
                    <p className="text-white/30 text-[10px] mt-0.5">
                      {mixMasters.length} mix{mixMasters.length > 1 ? 'es' : ''} · Excl. BTW
                    </p>
                  </div>
                  <p className="text-2xl font-black text-white">€{getTotalPrice()}</p>
                </div>
              )}
              <button
                onClick={handlePlaceOrder}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <ShoppingCart size={18} /> Place Order
              </button>
            </div>
          </div>
        )}

        {/* Order success */}
        {!loading && page === 'order' && orderPlaced && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-4">
              <Check size={32} className="text-green-400" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase mb-2">Order Placed!</h3>
            <p className="text-white/50 text-sm mb-6">
              Your mix & master order has been received. Track it in My Products.
            </p>
            <button
              onClick={() => navigate('/customer/my-products')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider transition-all"
            >
              View My Products
            </button>
          </div>
        )}
      </main>

      <Footer />
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="Sign In to Order"
          description="You need an account to place a mix & master order."
        />
      )}
    </div>
  );
}
