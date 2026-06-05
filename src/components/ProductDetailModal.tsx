import React, { useEffect, useRef, useState } from 'react';
import { X, Download, AlertCircle, Copy, Check } from 'lucide-react';
import { Purchase } from '../lib/firebase/types';
import { purchaseService } from '../lib/firebase/services';

interface ProductDetailModalProps {
  product: Purchase;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'wav' | 'stems'>('wav');
  const [copiedProductNumber, setCopiedProductNumber] = useState(false);
  const isExpired = purchaseService.isDownloadExpired(product.expiresAt);
  const daysRemaining = purchaseService.getDaysUntilExpiry(product.expiresAt);

  // Handle click outside
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

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyProductNumber = () => {
    navigator.clipboard.writeText(product.productNumber);
    setCopiedProductNumber(true);
    setTimeout(() => setCopiedProductNumber(false), 2000);
  };

  const handleDownload = (url: string, filename: string) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-3xl overflow-hidden shadow-2xl max-h-[82vh] flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2.5 bg-black/50 hover:bg-white/[0.15] border border-white/[0.15] rounded-full text-white/80 hover:text-white transition-all shadow-md"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8">
          {/* Artwork Section */}
          <div className="w-full md:w-1/3 flex-shrink-0">
            <div className="relative aspect-square rounded-2xl overflow-hidden">
              <img
                src={product.artworkUrl}
                alt={product.beatTitle}
                className={`w-full h-full object-cover ${isExpired ? 'grayscale' : ''}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Status Badge */}
              {isExpired && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-400 font-bold">Download Expired</p>
                  </div>
                </div>
              )}

              {/* License Badge */}
              <div className="absolute top-3 left-3 px-3 py-1 bg-red-600/80 rounded-full text-xs font-bold text-white uppercase">
                {product.licenseType}
              </div>

              {/* Days Remaining */}
              {!isExpired && (
                <div className={`absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  daysRemaining <= 7
                    ? 'bg-yellow-600/80 text-white'
                    : 'bg-green-600/80 text-white'
                }`}>
                  {daysRemaining} days left
                </div>
              )}
            </div>

            {/* Product Number */}
            <div className="mt-4 p-4 bg-white/[0.06] border border-white/[0.08] rounded-xl">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Product Number</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-mono text-white font-bold">{product.productNumber}</p>
                <button
                  onClick={copyProductNumber}
                  className="p-1.5 hover:bg-white/[0.08] rounded transition text-white/40 hover:text-white/60"
                  title="Copy product number"
                >
                  {copiedProductNumber ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="flex-1 flex flex-col justify-between">
            {/* Title & Artist */}
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-1 uppercase tracking-tight">
                {product.beatTitle}
              </h2>
              <p className="text-white/40 text-sm md:text-base mb-6">{product.beatArtist}</p>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">License Type</p>
                  <p className="text-white text-sm font-semibold capitalize">{product.licenseType}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Purchase Date</p>
                  <p className="text-white text-sm font-semibold">
                    {product.createdAt.toDate().toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Price Paid</p>
                  <p className="text-white text-sm font-semibold text-red-500">€{product.price.toFixed(2)}</p>
                </div>
                <div className={`${isExpired ? 'text-red-400' : daysRemaining <= 7 ? 'text-yellow-400' : ''}`}>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Expires</p>
                  <p className="text-white text-sm font-semibold">{product.expiresAt.toDate().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Expiry Warning */}
              {!isExpired && daysRemaining <= 7 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-6">
                  <p className="text-yellow-400 text-xs font-semibold">
                    ⚠️ Your download access expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. Download now!
                  </p>
                </div>
              )}

              {/* Expired Notice */}
              {isExpired && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
                  <p className="text-red-400 text-xs font-semibold">
                    📝 Your download period has expired. Contact support with your product number ({product.productNumber}) for re-access.
                  </p>
                </div>
              )}
            </div>

            {/* Downloads Section */}
            {!isExpired && (
              <div className="space-y-4">
                {/* Tabs */}
                <div className="flex gap-2 border-b border-white/[0.1]">
                  <button
                    onClick={() => setActiveTab('wav')}
                    className={`px-4 py-3 font-bold uppercase text-xs tracking-wider border-b-2 transition-all ${
                      activeTab === 'wav'
                        ? 'border-red-600 text-white'
                        : 'border-transparent text-white/40 hover:text-white/60'
                    }`}
                  >
                    WAV File
                  </button>
                  {product.stemsUrl && (
                    <button
                      onClick={() => setActiveTab('stems')}
                      className={`px-4 py-3 font-bold uppercase text-xs tracking-wider border-b-2 transition-all ${
                        activeTab === 'stems'
                          ? 'border-blue-600 text-white'
                          : 'border-transparent text-white/40 hover:text-white/60'
                      }`}
                    >
                      Stems Pack
                    </button>
                  )}
                </div>

                {/* Tab Content */}
                <div className="space-y-3">
                  {activeTab === 'wav' && product.downloadLinks?.wav && (
                    <div className="p-4 bg-white/[0.06] border border-white/[0.08] rounded-xl">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-3">WAV Format</p>
                      <p className="text-sm text-white/60 mb-4">
                        High-quality WAV file (24-bit) of the beat for your projects.
                      </p>
                      <button
                        onClick={() => handleDownload(
                          product.downloadLinks.wav!.url,
                          `${product.beatTitle.replace(/\s+/g, '_')}_${product.productNumber}.wav`
                        )}
                        className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <Download size={18} />
                        Download WAV
                      </button>
                    </div>
                  )}

                  {activeTab === 'stems' && product.downloadLinks?.stems && (
                    <div className="p-4 bg-white/[0.06] border border-white/[0.08] rounded-xl">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Stems Pack</p>
                      <p className="text-sm text-white/60 mb-4">
                        Complete stems package (ZIP) with individual track elements for full editing control.
                      </p>
                      <button
                        onClick={() => handleDownload(
                          product.downloadLinks.stems!.url,
                          `${product.beatTitle.replace(/\s+/g, '_')}_${product.productNumber}_STEMS.zip`
                        )}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <Download size={18} />
                        Download Stems
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Close Button for Mobile */}
            {isExpired && (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-white/[0.1] hover:bg-white/[0.15] text-white rounded-xl font-bold uppercase tracking-wider transition-all"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
