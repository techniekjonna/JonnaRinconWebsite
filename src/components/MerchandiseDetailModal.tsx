import React, { useEffect, useRef, useState } from 'react';
import { X, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
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
        className="relative w-full max-w-3xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/[0.1] hover:bg-white/[0.15] rounded-full text-white/60 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8">
          {/* Image Section */}
          <div className="w-full md:w-1/2 flex-shrink-0">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/[0.06]">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Logos */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2">
                {merchandise.showJonnaRinconLogo && (
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2 flex items-center justify-center flex-shrink-0">
                    <img
                      src="/Jonna Rincon Logo WH.png"
                      alt="Jonna Rincon"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fallback to a text badge if logo doesn't load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                {merchandise.showJeighteenLogo && (
                  <div className="w-12 h-12 bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg p-2 flex items-center justify-center flex-shrink-0">
                    <img
                      src="/Logo.png"
                      alt="JEIGHTEEN"
                      className="w-full h-full object-contain invert"
                      onError={(e) => {
                        // Fallback to a text badge if logo doesn't load
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
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setIsImageLoading(true);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all border ${
                      currentImageIndex === index
                        ? 'border-pink-500 ring-2 ring-pink-500'
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
          </div>

          {/* Details Section */}
          <div className="flex-1 flex flex-col justify-between">
            {/* Title & Info */}
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight">
                {merchandise.name}
              </h2>

              {/* Category & Price */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/40 text-sm font-semibold uppercase tracking-wider">
                  {merchandise.category}
                </span>
                <span className="text-2xl font-black text-pink-500">
                  ${merchandise.price.toFixed(2)}
                </span>
              </div>

              {/* Divider */}
              <div className="border-b border-white/[0.1] mb-4" />

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-white/60 text-xs uppercase tracking-wider font-semibold mb-2">
                  Description
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  {merchandise.description}
                </p>
              </div>

              {/* Meta Info */}
              {merchandise.metaDescription && (
                <div className="p-4 bg-white/[0.06] border border-white/[0.08] rounded-xl mb-6">
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
                            ? 'bg-pink-600 text-white border border-pink-500'
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
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isInCart || (merchandise.sizes && merchandise.sizes.length > 0 && !selectedSize)}
              className={`w-full px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                isInCart
                  ? 'bg-green-600/20 text-green-400 border border-green-500/20 cursor-not-allowed'
                  : merchandise.sizes && merchandise.sizes.length > 0 && !selectedSize
                  ? 'bg-white/[0.06] text-white/40 border border-white/[0.08] cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white'
              }`}
            >
              <ShoppingCart size={18} />
              {isInCart
                ? 'Added to Cart'
                : merchandise.sizes && merchandise.sizes.length > 0 && !selectedSize
                ? 'Select a Size'
                : 'Add to Cart'}
            </button>

            {/* Close Button for Mobile */}
            <button
              onClick={onClose}
              className="mt-3 px-6 py-2 bg-white/[0.1] hover:bg-white/[0.15] text-white/60 hover:text-white rounded-xl font-semibold transition-all md:hidden"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
