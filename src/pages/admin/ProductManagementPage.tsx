import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Search, Filter, Eye } from 'lucide-react';
import { ProductPurchase, ProductCategory } from '../../lib/firebase/types';

// Mock hook - in production this would fetch from Firestore
const useProductPurchases = () => {
  const [purchases] = useState<ProductPurchase[]>([]);
  const loading = false;
  return { purchases, loading };
};

const ProductManagementPage: React.FC = () => {
  const { purchases, loading } = useProductPurchases();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<ProductCategory | 'all'>('all');
  const [filterArtist, setFilterArtist] = useState('all');
  const [filterSupport, setFilterSupport] = useState<'all' | 'idle' | 'requested' | 'in_progress' | 'completed'>('all');

  // Get unique artists for filter dropdown
  const artists = useMemo(() => {
    const uniqueArtists = Array.from(new Set(purchases.map(p => p.productArtist).filter(Boolean)));
    return uniqueArtists;
  }, [purchases]);

  // Filter purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter(purchase => {
      const matchesSearch =
        purchase.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.productArtist?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = filterCategory === 'all' || purchase.productType === filterCategory;
      const matchesArtist = filterArtist === 'all' || purchase.productArtist === filterArtist;
      const matchesSupport = filterSupport === 'all' || purchase.supportStatus === filterSupport;

      return matchesSearch && matchesCategory && matchesArtist && matchesSupport;
    });
  }, [purchases, searchQuery, filterCategory, filterArtist, filterSupport]);

  const getSupportStatusColor = (status: string) => {
    const colors = {
      idle: 'bg-white/[0.06] text-white/40',
      requested: 'bg-orange-500/20 text-orange-400',
      in_progress: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
    };
    return colors[status as keyof typeof colors] || colors.idle;
  };

  const getCategoryBadgeColor = (category: ProductCategory) => {
    const colors = {
      beat: 'bg-red-500/20 text-red-400',
      track: 'bg-purple-500/20 text-purple-400',
      remix: 'bg-pink-500/20 text-pink-400',
      edit: 'bg-blue-500/20 text-blue-400',
      art: 'bg-yellow-500/20 text-yellow-400',
      merchandise: 'bg-green-500/20 text-green-400',
      service: 'bg-cyan-500/20 text-cyan-400',
    };
    return colors[category];
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Product Management</h1>
          <p className="text-white/40 mt-2">Manage customer purchases and downloads</p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-2 flex-1">
            <Search size={18} className="text-white/40" />
            <input
              type="text"
              placeholder="Search by title, artist, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-white/30 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as ProductCategory | 'all')}
              className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
            >
              <option value="all">All Categories</option>
              <option value="beat">Beats</option>
              <option value="track">Tracks</option>
              <option value="remix">Remixes</option>
              <option value="edit">Edits</option>
              <option value="art">Art</option>
              <option value="merchandise">Merchandise</option>
              <option value="service">Services</option>
            </select>

            <select
              value={filterArtist}
              onChange={(e) => setFilterArtist(e.target.value)}
              className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
            >
              <option value="all">All Artists</option>
              {artists.map((artist) => (
                <option key={artist} value={artist}>
                  {artist}
                </option>
              ))}
            </select>

            <select
              value={filterSupport}
              onChange={(e) => setFilterSupport(e.target.value as any)}
              className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
            >
              <option value="all">All Support Status</option>
              <option value="idle">No Support Request</option>
              <option value="requested">Support Requested</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Support</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                      Loading products...
                    </td>
                  </tr>
                ) : filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-white/[0.06]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {purchase.coverImage && (
                            <img
                              src={purchase.coverImage}
                              alt={purchase.productTitle}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-medium text-white">{purchase.productTitle}</p>
                            <p className="text-xs text-white/40">{purchase.productArtist}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-white">{purchase.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryBadgeColor(purchase.productType)}`}>
                          {purchase.productType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">€{purchase.price.toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getSupportStatusColor(purchase.supportStatus)}`}>
                          {purchase.supportStatus === 'requested' ? 'Requested' :
                           purchase.supportStatus === 'in_progress' ? 'In Progress' :
                           purchase.supportStatus === 'completed' ? 'Completed' : 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          purchase.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : purchase.status === 'expired'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-white/[0.06] text-white/40'
                        }`}>
                          {purchase.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button className="p-2 text-white/40 hover:text-blue-400 transition-colors" title="View details">
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductManagementPage;
