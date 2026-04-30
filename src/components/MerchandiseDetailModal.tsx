import React, { useEffect, useRef, useState } from 'react';
import { X, ShoppingCart, ChevronLeft, ChevronRight, Package, Sparkles, BadgeCheck, Zap } from 'lucide-react';
import { Merchandise } from '../lib/firebase/types';
import { toDirectUrl } from '../lib/utils/imageUtils';

interface MerchandiseDetailModalProps {
  merchandise: Merchandise | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (merchandise: Merchandise) => void;
  cartItems?: any[];
}

export default function MerchandiseDetailModal({
  merchandise,
  isOpen,
  onClose,
  onAddToCart,
  cartItems = [],
}: MerchandiseDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Combine main image with gallery
  const allImages = merchandise
    ? [merchandise.image, ...(merchandise.gallery || [])]
    : [];

  const isInCart = merchandise
    ? cartItems.some(item => item.id === merchandise.id && item.type === 'merchandise')
    : false;

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

  // Reset image index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
      setIsImageLoading(true);
      setSelectedSize(null);
    }
  }, [isOpen, merchandise?.id]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen || !merchandise) return null;

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1
    );
    setIsImageLoading(true);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1
    );
    setIsImageLoading(true);
  };

  const handleAddToCart = () => {
    // For items with sizes, require size selection
    if (merchandise?.sizes && merchandise.sizes.length > 0 && !selectedSize) {
      return;
    }
    if (onAddToCart) {
      onAddToCart(merchandise);
    }
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
        className="relative w-full max-w-4xl bg-gradient-to-br from-white/[0.12] to-white/[0.05] backdrop-blur-2xl border border-white/[0.2] rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2 bg-white/[0.1] hover:bg-white/[0.15] rounded-full text-white/60 hover:text-white transition-all"
        >
          <X size={24} />
        </button>

        {/* Featured Badge */}
        {merchandise.featured && (
          <div className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500/30 to-orange-500/30 border border-red-400/30 rounded-full">
            <BadgeCheck size={14} className="text-red-300" />
            <span className="text-xs font-bold text-red-200 uppercase tracking-wider">Featured</span>
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0 overflow-y-auto max-h-[90vh]">
          {/* Left Column - Image */}
          <div className="md:col-span-2 bg-gradient-to-b from-white/[0.08] to-transparent p-4 md:p-6 border-b md:border-b-0 md:border-r border-white/[0.08]">
            {/* Product Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 group">
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/[0.06]">
                  <div className="text-white/40">Loading...</div>
                </div>
              )}
              <img
                src={allImages[currentImageIndex]}
                alt={merchandise.name}
                className="w-full h-full object-cover"
                onLoad={() => setIsImageLoading(false)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Logos */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2">
                {merchandise.showJonnaRinconLogo && (
                  <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 drop-shadow-lg">
                    <img
                      src="/Jonna Rincon Logo WH.png"
                      alt="Jonna Rincon"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                {merchandise.showJeighteenLogo && (
                  <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 drop-shadow-lg">
                    <img
                      src="/JEIGHTEEN-logo.png"
                      alt="JEIGHTEEN"
                      className="w-full h-full object-contain brightness-0 drop-shadow-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-black/80 rounded-full text-white hover:text-white transition-all shadow-lg hover:shadow-xl"
                    title="Previous image"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-black/80 rounded-full text-white hover:text-white transition-all shadow-lg hover:shadow-xl"
                    title="Next image"
                  >
                    <ChevronRight size={24} />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/50 rounded-full text-xs font-semibold text-white">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setIsImageLoading(true);
                    }}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all border ${
                      currentImageIndex === index
                        ? 'border-red-500 ring-2 ring-red-500'
                        : 'border-white/[0.1] hover:border-white/[0.2]'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${merchandise.name} thumbnail`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Stock Status */}
            <div className="mt-4 p-4 bg-white/[0.06] border border-white/[0.1] rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Stock</span>
                <span className={`font-bold text-sm ${
                  (merchandise.totalStock ?? 0) > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(merchandise.totalStock ?? 0) > 0 ? `${merchandise.totalStock} Available` : 'Out of Stock'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="md:col-span-3 p-4 md:p-6 flex flex-col justify-between overflow-y-auto">
            {/* Header */}
            <div className="mb-6">
              {/* Title & Category */}
              <div className="mb-4">
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">{merchandise.category}</p>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-1 uppercase tracking-tight leading-tight">
                  {merchandise.name}
                </h2>
              </div>

              {/* Price */}
              <div className="mb-6">
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Price</p>
                <p className="text-4xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                  €{merchandise.price.toFixed(2)}
                </p>
              </div>

              {/* Divider */}
              <div className="border-b border-white/[0.1] mb-6" />

              {/* Description */}
              {merchandise.description && (
                <div className="mb-6">
                  <p className="text-white/80 text-sm leading-relaxed">
                    {merchandise.description}
                  </p>
                </div>
              )}

              {/* Product Info */}
              {merchandise.metaDescription && (
                <div className="mb-6 p-4 bg-white/[0.06] border border-white/[0.1] rounded-xl">
                  <p className="text-white/60 text-sm">
                    {merchandise.metaDescription}
                  </p>
                </div>
              )}

              {/* Size Selection */}
              {merchandise.sizes && merchandise.sizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-white/60 text-xs uppercase tracking-wider font-semibold mb-3">
                    Select Size
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {merchandise.sizes.map((size) => (
                      <button
                        key={size.name}
                        onClick={() => setSelectedSize(size.name)}
                        disabled={size.stock === 0}
                        className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                          selectedSize === size.name
                            ? 'bg-red-600 text-white border border-red-500'
                            : size.stock === 0
                            ? 'bg-white/[0.04] text-white/30 border border-white/[0.08] cursor-not-allowed'
                            : 'bg-white/[0.06] border border-white/[0.1] text-white/70 hover:bg-white/[0.10] hover:border-white/[0.15]'
                        }`}
                      >
                        {size.name}
                        {size.stock === 0 && <span className="text-xs ml-1 opacity-60">(Out)</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Features (if applicable) */}
              {merchandise.tags && merchandise.tags.length > 0 && (
                <div className="mb-6">
                  <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3">Features & Materials</p>
                  <div className="flex flex-wrap gap-2">
                    {(merchandise as any).tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/30 rounded-full text-xs text-red-200 uppercase tracking-wider font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pre-order Info */}
              {merchandise.isPreOrder && (
                <div className="mb-6 p-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-400/20 rounded-xl flex items-start gap-3">
                  <Zap size={18} className="text-orange-300 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-orange-200 uppercase tracking-wider">Pre-Order Item</p>
                    <p className="text-xs text-orange-200/70 mt-0.5">
                      Order now and receive your item soon. Pre-order deadline: {
                        merchandise.preOrderDeadline
                          ? (() => {
                              try {
                                const deadline = merchandise.preOrderDeadline;
                                // Handle Timestamp objects (has toDate method)
                                if (deadline && typeof deadline === 'object' && 'toDate' in deadline) {
                                  return (deadline as any).toDate().toLocaleDateString();
                                }
                                // Handle Date objects
                                if (deadline instanceof Date) {
                                  return deadline.toLocaleDateString();
                                }
                                // Handle string dates
                                if (typeof deadline === 'string') {
                                  return new Date(deadline).toLocaleDateString();
                                }
                                return 'TBA';
                              } catch (e) {
                                return 'TBA';
                              }
                            })()
                          : 'TBA'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="border-t border-white/[0.1] pt-6 space-y-3">
              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={isInCart || (merchandise.sizes && merchandise.sizes.length > 0 && !selectedSize) || (merchandise.totalStock ?? 0) === 0}
                className={`w-full px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  isInCart
                    ? 'bg-green-600/20 text-green-400 border border-green-500/20 cursor-not-allowed'
                    : merchandise.sizes && merchandise.sizes.length > 0 && !selectedSize
                    ? 'bg-white/[0.06] text-white/40 border border-white/[0.08] cursor-not-allowed'
                    : (merchandise.totalStock ?? 0) === 0
                    ? 'bg-white/[0.06] text-white/40 border border-white/[0.08] cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border border-red-500/30 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/30'
                }`}
              >
                <ShoppingCart size={18} />
                {isInCart
                  ? 'Added to Cart'
                  : merchandise.sizes && merchandise.sizes.length > 0 && !selectedSize
                  ? 'Select a Size'
                  : (merchandise.totalStock ?? 0) === 0
                  ? 'Out of Stock'
                  : 'Add to Cart'}
              </button>

              {/* Close Button for Mobile */}
              <button
                onClick={onClose}
                className="w-full px-6 py-2 bg-white/[0.1] hover:bg-white/[0.15] text-white/60 hover:text-white rounded-xl font-semibold transition-all md:hidden"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
