import React, { useEffect, useRef, useState } from 'react';
import {
  X, ChevronLeft, Check, Plus, Minus, Headphones, Music,
  Upload, Star, ShoppingCart, AlertCircle, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Service } from '../lib/firebase/types';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';

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
  { key: '48h' as const, label: '48H', price: 250 },
  { key: '72h' as const, label: '72H', price: 150 },
  { key: '7days' as const, label: '7 Days', price: 100 },
];

const isValidUrl = (str: string): boolean => {
  if (!str) return false;
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

const makeDefaultEntry = (artistName = ''): MixMasterEntry => ({
  trackTitle: '',
  mainArtist: artistName,
  additionalArtists: [],
  vocalStemsLink: '',
  beatStemsLink: '',
  references: [''],
  deliveryTime: null,
});

interface MixMasterModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MixMasterModal({ service, isOpen, onClose }: MixMasterModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [page, setPage] = useState<'info' | 'order'>('info');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [mixMasters, setMixMasters] = useState<MixMasterEntry[]>([makeDefaultEntry()]);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPage('info');
      setActiveTab(0);
      setMixMasters([makeDefaultEntry(user?.displayName || '')]);
      setOrderPlaced(false);
    }
  }, [isOpen, user?.displayName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (page === 'order') setPage('info');
        else onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, page]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || !service) return null;

  const handleOrderNow = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
    } else {
      setPage('order');
    }
  };

  const updateEntry = <K extends keyof MixMasterEntry>(
    idx: number,
    field: K,
    value: MixMasterEntry[K],
  ) => {
    setMixMasters(prev =>
      prev.map((entry, i) => (i === idx ? { ...entry, [field]: value } : entry)),
    );
  };

  const addMixMaster = () => {
    if (mixMasters.length >= 3) return;
    setMixMasters(prev => [...prev, makeDefaultEntry(user?.displayName || '')]);
    setActiveTab(mixMasters.length);
  };

  const removeMixMaster = (idx: number) => {
    if (mixMasters.length <= 1) return;
    const next = mixMasters.filter((_, i) => i !== idx);
    setMixMasters(next);
    setActiveTab(Math.min(activeTab, next.length - 1));
  };

  const addArtist = (idx: number) => {
    updateEntry(idx, 'additionalArtists', [...mixMasters[idx].additionalArtists, '']);
  };

  const updateArtist = (entryIdx: number, artistIdx: number, value: string) => {
    const updated = mixMasters[entryIdx].additionalArtists.map((a, i) =>
      i === artistIdx ? value : a,
    );
    updateEntry(entryIdx, 'additionalArtists', updated);
  };

  const removeArtist = (entryIdx: number, artistIdx: number) => {
    updateEntry(
      entryIdx,
      'additionalArtists',
      mixMasters[entryIdx].additionalArtists.filter((_, i) => i !== artistIdx),
    );
  };

  const addReference = (idx: number) => {
    if (mixMasters[idx].references.length >= 3) return;
    updateEntry(idx, 'references', [...mixMasters[idx].references, '']);
  };

  const updateReference = (entryIdx: number, refIdx: number, value: string) => {
    const updated = mixMasters[entryIdx].references.map((r, i) =>
      i === refIdx ? value : r,
    );
    updateEntry(entryIdx, 'references', updated);
  };

  const removeReference = (entryIdx: number, refIdx: number) => {
    const refs = mixMasters[entryIdx].references;
    if (refs.length <= 1) return;
    updateEntry(entryIdx, 'references', refs.filter((_, i) => i !== refIdx));
  };

  const getTotalPrice = () =>
    mixMasters.reduce((sum, entry) => {
      const opt = DELIVERY_OPTIONS.find(o => o.key === entry.deliveryTime);
      return sum + (opt?.price || 0);
    }, 0);

  const handlePlaceOrder = () => {
    // TODO: implement backend order creation (save to Firestore, add to my-products)
    console.log('Mix & Master order:', mixMasters);
    setOrderPlaced(true);
  };

  // ─── Info Page ───────────────────────────────────────────────────────────────
  const renderInfoPage = () => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-0 overflow-y-auto max-h-[calc(90vh-60px)]">
      {/* Left Column */}
      <div className="md:col-span-2 bg-gradient-to-b from-white/[0.08] to-transparent p-4 md:p-6 border-b md:border-b-0 md:border-r border-white/[0.1]">
        {/* Visual */}
        <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-purple-900/40 to-red-900/40 flex items-center justify-center">
          {service.coverUrl ? (
            <img
              src={service.coverUrl}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-2xl`}>
              <Headphones className="w-12 h-12 text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Service specs */}
        <div className="space-y-3">
          <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.08]">
            <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3">
              Service Details
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">Starting at</span>
                <span className="text-white font-bold">€{service.rate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">Delivery</span>
                <span className="text-white font-bold text-sm">From 48H</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">Revisions</span>
                <span className="text-white font-bold text-sm">Unlimited</span>
              </div>
            </div>
          </div>
          <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.08] text-center">
            <p className="text-white/40 text-xs uppercase tracking-wider">Service Type</p>
            <p className="text-white font-black text-sm mt-1 uppercase">Professional</p>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="md:col-span-3 p-4 md:p-6 flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-1 uppercase tracking-tight leading-tight">
            {service.name}
          </h2>
          <p className="text-sm text-white/60 font-semibold">Professional Audio Service</p>
          {service.description && (
            <p className="text-white/50 text-sm leading-relaxed mt-3">{service.description}</p>
          )}
        </div>

        {/* Features */}
        <div className="mb-6">
          <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3">
            What's Included
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {[
              { text: 'Fast Delivery', description: 'Quick turnaround from 48 hours' },
              {
                text: 'Unlimited Revisions',
                description: 'Open for revisions if sensible',
              },
              {
                text: 'Mixed for many',
                linkWord: 'artists',
                description: 'Extensive experience with clients',
                onLinkClick: () => { navigate('/support'); onClose(); },
              },
              {
                text: 'Experienced in many genres',
                description: 'Versatile sound for any style',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 px-4 py-3 rounded-lg border bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-white/[0.1] hover:border-white/[0.15] transition-all"
              >
                <Check size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  {feature.linkWord ? (
                    <p className="text-xs font-bold uppercase tracking-wider text-white">
                      {feature.text}{' '}
                      <button
                        onClick={feature.onLinkClick}
                        className="text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
                      >
                        {feature.linkWord}
                      </button>
                    </p>
                  ) : (
                    <p className="text-xs font-bold uppercase tracking-wider text-white">
                      {feature.text}
                    </p>
                  )}
                  <p className="text-xs mt-0.5 text-white/50">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Listen to my work */}
        <div className="mb-6 p-4 bg-white/[0.06] border border-white/[0.1] rounded-xl">
          <p className="text-white/60 text-xs font-semibold mb-1">
            Want to hear how I mix and master?
          </p>
          <p className="text-white/40 text-xs leading-relaxed mb-3">
            Check out my public tracks and productions to get a feel for the sound quality.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { navigate('/tracks'); onClose(); }}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 hover:border-purple-400/50 rounded-lg text-xs font-bold text-purple-200 uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <Music size={14} />
              Tracks
            </button>
            <button
              onClick={() => { navigate('/productions'); onClose(); }}
              className="px-4 py-2.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/30 hover:border-red-400/50 rounded-lg text-xs font-bold text-red-200 uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <Zap size={14} />
              Productions
            </button>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="border-t border-white/[0.1] pt-6 mt-auto">
          <div className="mb-4 p-4 bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-400/20 rounded-xl">
            <p className="text-white/40 text-xs uppercase tracking-wider font-bold mb-1">
              Starting Price
            </p>
            <p className="text-4xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent leading-none">
              €{service.rate}
            </p>
            <p className="text-white/40 text-xs mt-1">Excl. BTW · Price depends on delivery time</p>
          </div>
          <button
            onClick={handleOrderNow}
            className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-bold uppercase tracking-wider transition-all duration-200 hover:shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2 group shadow-lg"
          >
            <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
            Order Now
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Order Page ──────────────────────────────────────────────────────────────
  const renderOrderPage = () => {
    if (orderPlaced) {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-4">
            <Check size={32} className="text-green-400" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase mb-2">Order Placed!</h3>
          <p className="text-white/50 text-sm mb-6">
            Your mix &amp; master order has been received. You can track it in My Products.
          </p>
          <button
            onClick={() => { navigate('/customer/my-products'); onClose(); }}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase tracking-wider transition-all"
          >
            View My Products
          </button>
        </div>
      );
    }

    const entry = mixMasters[activeTab];

    return (
      <div className="overflow-y-auto max-h-[calc(90vh-60px)]">
        {/* Order header */}
        <div className="flex items-center gap-3 p-4 md:p-6 border-b border-white/[0.08]">
          <button
            onClick={() => setPage('info')}
            className="p-2 bg-white/[0.08] hover:bg-white/[0.12] rounded-full text-white/60 hover:text-white transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Place Order</h3>
            <p className="text-white/40 text-xs">Mix &amp; Master — {service.name}</p>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Tabs */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {mixMasters.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === idx
                      ? 'bg-red-600 text-white'
                      : 'bg-white/[0.06] border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.1]'
                  }`}
                >
                  Mix Master {idx + 1}
                  {mixMasters.length > 1 && (
                    <span
                      role="button"
                      onClick={e => { e.stopPropagation(); removeMixMaster(idx); }}
                      className="ml-1 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      ×
                    </span>
                  )}
                </button>
              ))}

              {mixMasters.length < 3 ? (
                <button
                  onClick={addMixMaster}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-xs font-bold text-white/40 hover:text-white uppercase tracking-wider transition-all"
                >
                  <Plus size={12} />
                  Add
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-400/20 rounded-xl">
                  <AlertCircle size={12} className="text-orange-400 flex-shrink-0" />
                  <span className="text-xs text-orange-300 font-semibold">
                    More than 3?{' '}
                    <button
                      onClick={() => { navigate('/support'); onClose(); }}
                      className="underline hover:text-orange-200 transition-colors"
                    >
                      Request Album Service!
                    </button>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Track Title */}
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider font-semibold block mb-2">
              Track Title
            </label>
            <input
              type="text"
              value={entry.trackTitle}
              onChange={e => updateEntry(activeTab, 'trackTitle', e.target.value)}
              placeholder="Enter track title..."
              className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] hover:border-white/[0.2] focus:border-white/[0.3] rounded-xl text-white text-sm placeholder-white/30 outline-none transition-colors"
            />
          </div>

          {/* Main Artist */}
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider font-semibold block mb-2">
              Main Artist
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={entry.mainArtist}
                  onChange={e => updateEntry(activeTab, 'mainArtist', e.target.value)}
                  placeholder="Artist name..."
                  className="flex-1 px-4 py-3 bg-white/[0.06] border border-white/[0.1] hover:border-white/[0.2] focus:border-white/[0.3] rounded-xl text-white text-sm placeholder-white/30 outline-none transition-colors"
                />
                <button
                  onClick={() => addArtist(activeTab)}
                  title="Add artist"
                  className="p-3 bg-white/[0.06] border border-white/[0.1] hover:border-white/[0.2] rounded-xl text-white/50 hover:text-white transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
              {entry.additionalArtists.map((artist, artistIdx) => (
                <div key={artistIdx} className="flex gap-2">
                  <input
                    type="text"
                    value={artist}
                    onChange={e => updateArtist(activeTab, artistIdx, e.target.value)}
                    placeholder={`Artist ${artistIdx + 2}...`}
                    className="flex-1 px-4 py-3 bg-white/[0.06] border border-white/[0.1] hover:border-white/[0.2] focus:border-white/[0.3] rounded-xl text-white text-sm placeholder-white/30 outline-none transition-colors"
                  />
                  <button
                    onClick={() => removeArtist(activeTab, artistIdx)}
                    className="p-3 bg-white/[0.06] border border-white/[0.1] hover:border-red-400/30 rounded-xl text-white/50 hover:text-red-400 transition-all"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Vocal Stems */}
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider font-semibold block mb-2">
              Vocal Stems Link
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={entry.vocalStemsLink}
                  onChange={e => updateEntry(activeTab, 'vocalStemsLink', e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className={`w-full pl-4 pr-10 py-3 bg-white/[0.06] border hover:border-white/[0.2] focus:border-white/[0.3] rounded-xl text-white text-sm placeholder-white/30 outline-none transition-colors ${
                    isValidUrl(entry.vocalStemsLink)
                      ? 'border-green-400/50'
                      : 'border-white/[0.1]'
                  }`}
                />
                {isValidUrl(entry.vocalStemsLink) && (
                  <Check
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"
                  />
                )}
              </div>
              <button
                title="Upload vocal stems (coming soon)"
                className="flex items-center gap-2 px-4 py-3 bg-white/[0.06] border border-white/[0.1] hover:border-white/[0.2] rounded-xl text-white/50 hover:text-white text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap"
              >
                <Upload size={14} />
                Upload
              </button>
            </div>
          </div>

          {/* Beat Stems */}
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider font-semibold block mb-2">
              Beat Stems Link
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={entry.beatStemsLink}
                  onChange={e => updateEntry(activeTab, 'beatStemsLink', e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className={`w-full pl-4 pr-10 py-3 bg-white/[0.06] border hover:border-white/[0.2] focus:border-white/[0.3] rounded-xl text-white text-sm placeholder-white/30 outline-none transition-colors ${
                    isValidUrl(entry.beatStemsLink)
                      ? 'border-green-400/50'
                      : 'border-white/[0.1]'
                  }`}
                />
                {isValidUrl(entry.beatStemsLink) && (
                  <Check
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"
                  />
                )}
              </div>
              <button
                title="Upload beat stems (coming soon)"
                className="flex items-center gap-2 px-4 py-3 bg-white/[0.06] border border-white/[0.1] hover:border-white/[0.2] rounded-xl text-white/50 hover:text-white text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap"
              >
                <Upload size={14} />
                Upload
              </button>
            </div>
          </div>

          {/* References */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/40 text-xs uppercase tracking-wider font-semibold">
                Reference Tracks
              </label>
              {entry.references.length < 3 && (
                <button
                  onClick={() => addReference(activeTab)}
                  className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
                >
                  <Plus size={12} />
                  Add
                </button>
              )}
            </div>
            <div className="space-y-2">
              {entry.references.map((ref, refIdx) => (
                <div key={refIdx} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={ref}
                      onChange={e => updateReference(activeTab, refIdx, e.target.value)}
                      placeholder="https://open.spotify.com/..."
                      className={`w-full pl-4 pr-10 py-3 bg-white/[0.06] border hover:border-white/[0.2] focus:border-white/[0.3] rounded-xl text-white text-sm placeholder-white/30 outline-none transition-colors ${
                        isValidUrl(ref) ? 'border-green-400/50' : 'border-white/[0.1]'
                      }`}
                    />
                    {isValidUrl(ref) && (
                      <Check
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"
                      />
                    )}
                  </div>
                  {entry.references.length > 1 && (
                    <button
                      onClick={() => removeReference(activeTab, refIdx)}
                      className="p-3 bg-white/[0.06] border border-white/[0.1] hover:border-red-400/30 rounded-xl text-white/50 hover:text-red-400 transition-all"
                    >
                      <Minus size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Time */}
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider font-semibold block mb-2">
              Delivery Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DELIVERY_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => updateEntry(activeTab, 'deliveryTime', opt.key)}
                  className={`px-4 py-3 rounded-xl border transition-all text-center ${
                    entry.deliveryTime === opt.key
                      ? 'bg-red-600/30 border-red-400/50 text-white'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:border-white/[0.2] hover:text-white'
                  }`}
                >
                  <p className="text-sm font-black uppercase">{opt.label}</p>
                  <p className="text-xs font-bold text-white/60 mt-0.5">€{opt.price}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">excl. BTW</p>
                </button>
              ))}
            </div>
          </div>

          {/* Total & Place Order */}
          <div className="border-t border-white/[0.08] pt-6">
            {getTotalPrice() > 0 && (
              <div className="mb-4 p-4 bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-400/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider font-bold">Total</p>
                    <p className="text-white/30 text-[10px] mt-0.5">
                      {mixMasters.length} mix master{mixMasters.length > 1 ? 's' : ''} · Excl. BTW
                    </p>
                  </div>
                  <p className="text-2xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    €{getTotalPrice()}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handlePlaceOrder}
              className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-bold uppercase tracking-wider transition-all duration-200 hover:shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2 group shadow-lg"
            >
              <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
              Place Order
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 max-h-screen overflow-y-auto">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />

        {/* Modal */}
        <div
          ref={modalRef}
          className="relative w-full max-w-2xl bg-gradient-to-br from-white/[0.12] to-white/[0.05] backdrop-blur-2xl border border-white/[0.2] rounded-3xl overflow-hidden shadow-2xl my-4 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 bg-white/[0.06] backdrop-blur-sm border-b border-white/[0.15] px-6 py-4 flex items-center justify-between">
            {/* Featured Badge (info page only) */}
            {service.featured && page === 'info' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/30 rounded-full">
                <Star size={14} className="text-purple-300" />
                <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                  Featured
                </span>
              </div>
            ) : <div />}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 bg-white/[0.1] hover:bg-white/[0.2] rounded-full text-white/60 hover:text-white transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {page === 'info' ? renderInfoPage() : renderOrderPage()}
          </div>
        </div>
      </div>

      {/* Auth prompt */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Sign In to Order"
        description="You need an account to place an order. Your completed mix & master will appear in My Products."
      />
    </>
  );
}
