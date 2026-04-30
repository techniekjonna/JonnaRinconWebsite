import React, { useState, useEffect } from 'react';
import { X, MessageCircle, AlertCircle, Link as LinkIcon, Download, RotateCcw, Clock } from 'lucide-react';
import { ProductPurchase, DownloadLink } from '../lib/firebase/types';

interface MyProductModalProps {
  product: ProductPurchase | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestSupport?: (productId: string) => void;
  onChat?: (productId: string) => void;
  onDownload?: (productId: string, linkKey: string) => void;
  onResetTimer?: (productId: string) => void;
  onAddLink?: (productId: string, link: string) => void;
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const daysUntilExpiry = (expiresAt: any): number => {
  if (!expiresAt) return 0;
  const expiryDate = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const MyProductModal: React.FC<MyProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onRequestSupport,
  onChat,
  onDownload,
  onResetTimer,
  onAddLink,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'downloads' | 'links' | 'status'>('overview');
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');

  // Timer countdown effect for mix masters
  useEffect(() => {
    if (!product?.deliveryTimer || !isOpen) return;

    const timer = setInterval(() => {
      if (product.deliveryTimer) {
        const expiresAt = product.deliveryTimer.expiresAt.toDate
          ? product.deliveryTimer.expiresAt.toDate()
          : new Date(product.deliveryTimer.expiresAt);

        const now = new Date();
        const diff = Math.max(0, expiresAt.getTime() - now.getTime());
        const seconds = Math.floor(diff / 1000);

        setTimerDisplay(formatTime(seconds));

        if (diff <= 0) {
          clearInterval(timer);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const isMixMaster = product.productType === 'service' && product.deliveryTimer;
  const mainDownload = product.downloadLinks?.main;
  const hasExpiredDownloads = Object.values(product.downloadLinks || {}).some(link => !link.isActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-white/[0.12] to-white/[0.05] backdrop-blur-2xl border border-white/[0.2] rounded-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2 bg-white/[0.1] hover:bg-white/[0.15] rounded-full text-white/60 hover:text-white transition-all"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="bg-white/[0.08] border-b border-white/[0.1] p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">{product.productType}</p>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                {product.productTitle}
              </h2>
              {product.productArtist && (
                <p className="text-white/60 mt-1">{product.productArtist}</p>
              )}
            </div>
            {product.coverImage && (
              <img
                src={product.coverImage}
                alt={product.productTitle}
                className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
              />
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/[0.1] flex gap-0">
          {(['overview', 'downloads', 'links', 'status'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-xs uppercase font-bold tracking-wider transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'downloads' && 'Downloads'}
              {tab === 'links' && 'Links'}
              {tab === 'status' && 'Status'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-300px)] p-6 space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {isMixMaster && product.deliveryTimer && (
                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-400/20 rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <Clock className="w-12 h-12 text-orange-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-white/60 text-sm mb-1">Jonna Rincon gaat aan de slag met het mix en masteren van de track.</p>
                      <p className="text-2xl font-black text-white">{timerDisplay}</p>
                      <p className="text-white/40 text-xs mt-2">
                        Delivery option: {product.deliveryTimer.deliveryOption}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Price</p>
                  <p className="text-2xl font-bold text-white">€{product.price.toFixed(2)}</p>
                </div>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Purchased</p>
                  <p className="text-white text-sm">
                    {product.createdAt.toDate
                      ? product.createdAt.toDate().toLocaleDateString()
                      : new Date(product.createdAt as any).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Downloads Tab */}
          {activeTab === 'downloads' && (
            <div className="space-y-4">
              {mainDownload ? (
                <div className="bg-white/[0.06] border border-white/[0.1] rounded-xl p-4">
                  <p className="text-white/60 text-sm mb-3">Main Download</p>
                  <button
                    onClick={() => onDownload?.(product.id, 'main')}
                    disabled={!mainDownload.isActive}
                    className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      mainDownload.isActive
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-white/[0.06] text-white/40 cursor-not-allowed'
                    }`}
                  >
                    <Download size={18} />
                    {mainDownload.isActive ? 'Download' : 'Download Ready'}
                  </button>
                  <p className="text-white/40 text-xs mt-3">
                    {mainDownload.isActive ? (
                      <>
                        Available for {daysUntilExpiry(mainDownload.expiresAt)} days
                      </>
                    ) : (
                      'Download will be available once processed'
                    )}
                  </p>
                </div>
              ) : (
                <div className="bg-white/[0.06] border border-white/[0.1] rounded-xl p-4 text-center py-8">
                  <AlertCircle className="w-8 h-8 text-white/40 mx-auto mb-2" />
                  <p className="text-white/40">No downloads available yet</p>
                </div>
              )}
            </div>
          )}

          {/* Links Tab */}
          {activeTab === 'links' && (
            <div className="space-y-4">
              {product.downloadLinks && Object.entries(product.downloadLinks).length > 0 ? (
                Object.entries(product.downloadLinks).map(([key, link]) => (
                  <div key={key} className="bg-white/[0.06] border border-white/[0.1] rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold capitalize">{key}</p>
                        <p className="text-white/40 text-xs">Expires: {new Date(link.expiresAt as any).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        link.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {link.isActive ? 'Active' : 'Expired'}
                      </span>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm break-all flex items-center gap-2"
                    >
                      <LinkIcon size={14} />
                      View Link
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/40">
                  No links added yet
                </div>
              )}
            </div>
          )}

          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="bg-white/[0.06] border border-white/[0.1] rounded-xl p-4">
                <p className="text-white/60 text-sm mb-3">Support Status</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${
                    product.supportStatus === 'completed' ? 'bg-green-500' :
                    product.supportStatus === 'in_progress' ? 'bg-blue-500' :
                    product.supportStatus === 'requested' ? 'bg-orange-500' : 'bg-white/20'
                  }`} />
                  <p className="text-white font-semibold capitalize">
                    {product.supportStatus === 'requested' ? 'Support Requested' :
                     product.supportStatus === 'in_progress' ? 'In Progress' :
                     product.supportStatus === 'completed' ? 'Completed' : 'No Support'}
                  </p>
                </div>
              </div>

              <div className="bg-white/[0.06] border border-white/[0.1] rounded-xl p-4">
                <p className="text-white/60 text-sm mb-3">Overall Status</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                    product.status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : product.status === 'expired'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-white/[0.06] text-white/40'
                  }`}>
                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-white/[0.1] bg-white/[0.05] p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onChat?.(product.id)}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              Chat
            </button>
            <button
              onClick={() => onRequestSupport?.(product.id)}
              disabled={product.supportStatus === 'requested' || product.supportStatus === 'in_progress'}
              className={`px-4 py-3 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                product.supportStatus === 'requested' || product.supportStatus === 'in_progress'
                  ? 'bg-white/[0.06] text-white/40 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              <AlertCircle size={18} />
              Support
            </button>
          </div>

          {isMixMaster && (
            <button
              onClick={() => onResetTimer?.(product.id)}
              className="w-full px-4 py-3 bg-white/[0.1] hover:bg-white/[0.15] text-white rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Reset Timer
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-white/[0.1] hover:bg-white/[0.15] text-white/60 hover:text-white rounded-xl font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProductModal;
