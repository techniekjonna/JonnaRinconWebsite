import React from 'react';
import { Purchase } from '../lib/firebase/types';
import { Download, Calendar, Lock } from 'lucide-react';

interface ProductCardProps {
  product: Purchase;
  onClick: () => void;
  daysUntilExpiry?: number;
  isExpired?: boolean;
}

export default function ProductCard({
  product,
  onClick,
  daysUntilExpiry,
  isExpired = false,
}: ProductCardProps) {
  const hasStems = !!product.stemsUrl;
  const createdDate = new Date(product.createdAt.toDate()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const expiryDate = product.expiresAt.toDate().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const getExpiryColor = () => {
    if (isExpired) return 'bg-red-500/10 border-red-500/20 text-red-400';
    if (daysUntilExpiry && daysUntilExpiry <= 7) return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    return 'bg-green-500/10 border-green-500/20 text-green-400';
  };

  const getExpiryLabel = () => {
    if (isExpired) return 'Expired';
    if (daysUntilExpiry === 0) return 'Expires Today';
    if (daysUntilExpiry === 1) return 'Expires Tomorrow';
    return `${daysUntilExpiry} days left`;
  };

  return (
    <button
      onClick={onClick}
      className={`relative group bg-white/[0.04] backdrop-blur-md border rounded-2xl overflow-hidden transition-all duration-300 hover:bg-white/[0.08] ${
        isExpired ? 'border-white/[0.04] opacity-60' : 'border-white/[0.06] hover:border-white/[0.12]'
      }`}
    >
      {/* Artwork */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-red-600/20 to-red-900/10">
        <img
          src={product.artworkUrl}
          alt={product.beatTitle}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isExpired ? 'grayscale' : 'group-hover:scale-105'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Status Badge */}
        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getExpiryColor()}`}>
          {isExpired ? (
            <span className="flex items-center gap-1">
              <Lock size={12} />
              Expired
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {daysUntilExpiry && daysUntilExpiry <= 7 ? 'Expires Soon' : 'Active'}
            </span>
          )}
        </div>

        {/* License Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-red-600/80 rounded-full text-[10px] font-bold text-white uppercase">
          {product.licenseType}
        </div>

        {/* Stems Badge */}
        {hasStems && !isExpired && (
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-blue-600/80 rounded-full text-[10px] font-bold text-white uppercase">
            + Stems
          </div>
        )}

        {/* Download Icon on Hover */}
        {!isExpired && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
            <Download className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title & Artist */}
        <div className="min-w-0">
          <p className="font-bold text-white truncate text-sm">{product.beatTitle}</p>
          <p className="text-xs text-white/40 truncate">{product.beatArtist}</p>
        </div>

        {/* Product Info */}
        <div className="space-y-2 text-xs text-white/30">
          <div className="flex items-center justify-between">
            <span>Product #</span>
            <span className="text-white/50 font-mono text-[10px]">{product.productNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Purchased</span>
            <span className="text-white/50">{createdDate}</span>
          </div>
          <div className={`flex items-center justify-between pt-2 border-t border-white/[0.08] ${
            isExpired ? 'text-red-400' : daysUntilExpiry && daysUntilExpiry <= 7 ? 'text-yellow-400' : ''
          }`}>
            <span>Expires</span>
            <span className="font-semibold">{expiryDate}</span>
          </div>
        </div>

        {/* Download Files Available */}
        {!isExpired && (
          <div className="pt-2 border-t border-white/[0.08]">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Available Files</p>
            <div className="flex gap-2">
              {product.downloadLinks?.wav && (
                <span className="px-2 py-1 bg-white/[0.08] rounded text-[10px] text-white/60 uppercase">WAV</span>
              )}
              {product.downloadLinks?.stems && (
                <span className="px-2 py-1 bg-blue-600/20 rounded text-[10px] text-blue-400 uppercase">Stems</span>
              )}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Price Paid</span>
          <span className="text-lg font-black text-red-500">€{product.price.toFixed(2)}</span>
        </div>
      </div>
    </button>
  );
}
