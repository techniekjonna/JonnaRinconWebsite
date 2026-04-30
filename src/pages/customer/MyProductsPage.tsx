import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { purchaseService, artService } from '../../lib/firebase/services';
import { followGateService } from '../../lib/firebase/services/followGateService';
import { Purchase, FollowGateCompletion, Art } from '../../lib/firebase/types';
import CustomerLayout from '../../components/customer/CustomerLayout';
import ProductCard from '../../components/ProductCard';
import ProductDetailModal from '../../components/ProductDetailModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Download, Calendar, Package, AlertCircle, Gift, ShoppingBag, ExternalLink, Image } from 'lucide-react';

type FilterType = 'all' | 'purchased' | 'packs' | 'art' | 'free';

export default function MyProductsPage() {
  const { user, isAuthenticated } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasedArt, setPurchasedArt] = useState<Art[]>([]);
  const [freeDownloads, setFreeDownloads] = useState<FollowGateCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Purchase | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'expiry'>('recent');
  const [filter, setFilter] = useState<FilterType>('all');

  if (!isAuthenticated || !user?.uid) {
    return (
      <CustomerLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">My Products</h1>
            <p className="text-white/40">Your purchased beats, tracks, and free downloads</p>
          </div>
          <div className="text-center py-20">
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-12 max-w-md mx-auto">
              <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-xl font-bold text-white mb-2">Sign In Required</p>
              <p className="text-white/40 text-sm mb-6">
                Please sign in to view your purchased products and downloads.
              </p>
              <a href="/login" className="inline-block px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  useEffect(() => {

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [purchaseData, freeData, artData] = await Promise.all([
          purchaseService.getUserPurchases(user.uid),
          followGateService.getUserCompletions(user.uid),
          artService.getUserPurchasedArt(user.uid),
        ]);
        setPurchases(purchaseData);
        setFreeDownloads(freeData);
        setPurchasedArt(artData);
      } catch (error: any) {
        setError(error.message || 'Failed to fetch products');
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isAuthenticated]);

  const sortedPurchases = [...purchases].sort((a, b) => {
    if (sortBy === 'recent') {
      return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
    } else {
      return (a.expiresAt?.toMillis?.() || 0) - (b.expiresAt?.toMillis?.() || 0);
    }
  });

  const activeProducts = sortedPurchases.filter(p => !purchaseService.isDownloadExpired(p.expiresAt) && !p.packBeats);
  const expiredProducts = sortedPurchases.filter(p => purchaseService.isDownloadExpired(p.expiresAt) && !p.packBeats);
  const activeBeatPacks = sortedPurchases.filter(p => !purchaseService.isDownloadExpired(p.expiresAt) && !!p.packBeats);
  const expiredBeatPacks = sortedPurchases.filter(p => purchaseService.isDownloadExpired(p.expiresAt) && !!p.packBeats);

  const activeFreeDownloads = freeDownloads.filter(f => !followGateService.isExpired(f.expiresAt));
  const expiredFreeDownloads = freeDownloads.filter(f => followGateService.isExpired(f.expiresAt));

  const totalActive = activeProducts.length + activeFreeDownloads.length;
  const totalAll = purchases.length + freeDownloads.length + purchasedArt.length;

  const filterTabs: { value: FilterType; label: string; icon: React.ElementType; count: number }[] = [
    { value: 'all', label: 'All', icon: Package, count: totalAll },
    { value: 'purchased', label: 'Purchased', icon: ShoppingBag, count: activeProducts.length + expiredProducts.length },
    { value: 'packs', label: 'Beat Packs', icon: Package, count: activeBeatPacks.length + expiredBeatPacks.length },
    { value: 'art', label: 'Art Collection', icon: Image, count: purchasedArt.length },
    { value: 'free', label: 'Free Downloads', icon: Gift, count: freeDownloads.length },
  ];

  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-black text-white mb-2">My Products</h1>
          <p className="text-white/40">Your purchased beats, tracks, and free downloads</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/[0.08] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-red-500" />
              <p className="text-white/40 text-sm uppercase tracking-wider">Total Products</p>
            </div>
            <p className="text-3xl font-black text-white">{totalAll}</p>
          </div>

          <div className="bg-white/[0.08] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Download className="w-5 h-5 text-green-500" />
              <p className="text-white/40 text-sm uppercase tracking-wider">Available</p>
            </div>
            <p className="text-3xl font-black text-white">{totalActive}</p>
          </div>

          <div className="bg-white/[0.08] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-5 h-5 text-purple-500" />
              <p className="text-white/40 text-sm uppercase tracking-wider">Free Downloads</p>
            </div>
            <p className="text-3xl font-black text-white">{activeFreeDownloads.length}</p>
          </div>

          <div className="bg-white/[0.08] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-yellow-500" />
              <p className="text-white/40 text-sm uppercase tracking-wider">Expires Soon</p>
            </div>
            <p className="text-3xl font-black text-white">
              {activeProducts.filter(p => purchaseService.getDaysUntilExpiry(p.expiresAt) <= 7).length +
                activeFreeDownloads.filter(f => followGateService.getDaysUntilExpiry(f.expiresAt) <= 7).length}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === tab.value
                    ? 'bg-white/[0.12] text-white border border-white/[0.1]'
                    : 'bg-white/[0.04] text-white/40 hover:text-white/60 border border-transparent'
                }`}
              >
                <Icon size={16} />
                {tab.label}
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                  filter === tab.value ? 'bg-white/[0.15] text-white' : 'bg-white/[0.06] text-white/30'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <LoadingSpinner text="Loading your products..." />
          </div>
        ) : totalAll === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-12 max-w-md mx-auto">
              <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-xl font-bold text-white mb-2">No Products Yet</p>
              <p className="text-white/40 text-sm">
                Start building your library by purchasing beats or downloading free tracks
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Purchased Products */}
            {(filter === 'all' || filter === 'purchased') && activeProducts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white uppercase">
                    {filter === 'purchased' ? 'Active Products' : 'Purchased Products'}
                  </h2>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'recent' | 'expiry')}
                    className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white text-sm"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="expiry">Expires Soon</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => setSelectedProduct(product)}
                      daysUntilExpiry={purchaseService.getDaysUntilExpiry(product.expiresAt)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Beat Packs */}
            {(filter === 'all' || filter === 'packs') && activeBeatPacks.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase flex items-center gap-3">
                  <Package className="w-6 h-6 text-red-500" />
                  Beat Packs
                </h2>
                <div className="space-y-4">
                  {activeBeatPacks.map((pack) => (
                    <div key={pack.id} className="bg-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden">
                      <div className="p-5 flex items-center gap-4 border-b border-white/[0.06]">
                        <img src={pack.artworkUrl || '/JEIGHTENESIS.jpg'} alt={pack.beatTitle} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white truncate">{pack.beatTitle}</h3>
                          <p className="text-xs text-white/40">
                            {pack.packBeats?.length || 0} beat{(pack.packBeats?.length || 0) !== 1 ? 's' : ''} · {purchaseService.getDaysUntilExpiry(pack.expiresAt)}d left
                          </p>
                        </div>
                        <span className="text-sm font-black text-red-500">&euro;{pack.price.toFixed(0)}</span>
                      </div>
                      <div className="divide-y divide-white/[0.04]">
                        {pack.packBeats?.map((b, i) => (
                          <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.03]">
                            <span className="text-xs text-white/30 w-6 text-center flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{b.title}</p>
                              <p className="text-xs text-white/40 truncate">{b.artist} &middot; {b.bpm} BPM &middot; {b.key} &middot; {b.genre}</p>
                            </div>
                            {b.downloadUrl ? (
                              <a
                                href={b.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/20 rounded-lg text-red-400 text-xs font-bold transition-all flex-shrink-0"
                              >
                                <Download size={14} /> Download
                              </a>
                            ) : (
                              <span className="text-xs text-white/30">No link</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Art Collection */}
            {(filter === 'all' || filter === 'art') && purchasedArt.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase">Art Collection</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {purchasedArt.map((art) => (
                    <div
                      key={art.id}
                      className="bg-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all group cursor-pointer"
                    >
                      <div className="relative aspect-square">
                        <img src={art.image} alt={art.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-white font-bold text-sm truncate">{art.title}</h3>
                          <p className="text-white/40 text-xs mt-1">{art.artist}</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white/40 text-xs uppercase tracking-wider">{art.type}</p>
                            {art.subtype && <p className="text-white/60 text-xs">{art.subtype}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold">{art.year}</p>
                            <p className="text-white/40 text-xs">Owned</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Free Downloads */}
            {(filter === 'all' || filter === 'free') && activeFreeDownloads.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase">Free Downloads</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeFreeDownloads.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all group"
                    >
                      <div className="relative aspect-square">
                        {item.artworkUrl ? (
                          <img src={item.artworkUrl} alt={item.productTitle} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center">
                            <Gift size={40} className="text-white/20" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs font-bold">
                            FREE
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-bold text-sm truncate">{item.productTitle}</h3>
                        <p className="text-white/30 text-xs mt-1 capitalize">{item.productType}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-white/30 text-xs">
                            {followGateService.getDaysUntilExpiry(item.expiresAt)}d left
                          </span>
                          {item.downloadUrl && (
                            <a
                              href={item.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/20 rounded-lg text-green-400 text-xs font-bold transition-all"
                            >
                              <Download size={14} />
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expired Products */}
            {(filter === 'all' || filter === 'purchased') && expiredProducts.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase">Expired Downloads</h2>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-semibold mb-1">Download Period Expired</p>
                      <p className="text-yellow-400/80 text-sm">
                        These products are no longer available for download. Contact support with your product number for access.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expiredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => setSelectedProduct(product)}
                      isExpired={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Expired Free Downloads */}
            {(filter === 'all' || filter === 'free') && expiredFreeDownloads.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase">Expired Free Downloads</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expiredFreeDownloads.map((item) => (
                    <div key={item.id} className="bg-white/[0.04] border border-white/[0.04] rounded-2xl overflow-hidden opacity-50">
                      <div className="relative aspect-square">
                        {item.artworkUrl ? (
                          <img src={item.artworkUrl} alt={item.productTitle} className="w-full h-full object-cover grayscale" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600/10 to-pink-600/10 flex items-center justify-center">
                            <Gift size={40} className="text-white/10" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-white/40 font-bold text-sm truncate">{item.productTitle}</h3>
                        <p className="text-white/20 text-xs mt-1">Expired</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </CustomerLayout>
  );
}
