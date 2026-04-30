import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { beatService } from '../../lib/firebase/services/beatService';
import { Beat } from '../../lib/firebase/types';
import CustomerLayout from '../../components/customer/CustomerLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Music, Play, Heart, Download } from 'lucide-react';
import { extractUniqueGenres, createGenreFilter } from '../../lib/utils/genreExtractor';

const CustomerShop: React.FC = () => {
  const [allBeats, setAllBeats] = useState<Beat[]>([]);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    genre?: string;
    search?: string;
    sortBy: 'newest' | 'popular' | 'price_low' | 'price_high';
  }>({
    sortBy: 'newest',
  });

  // Load all beats on mount
  useEffect(() => {
    const loadAllBeats = async () => {
      try {
        const published = await beatService.getPublishedBeats();
        setAllBeats(published);
      } catch (error) {
        console.error('Failed to load beats:', error);
      }
    };
    loadAllBeats();
  }, []);

  // Filter beats when filter changes or allBeats updates
  useEffect(() => {
    filterAndSortBeats();
  }, [filter, allBeats]);

  const filterAndSortBeats = () => {
    try {
      setLoading(true);
      // Filter beats
      let filtered = allBeats;

      if (filter.genre) {
        // Handle comma-separated genres in the genre field
        filtered = filtered.filter((b) => {
          if (!b.genre) return false;
          const genres = b.genre.split(',').map(g => g.trim());
          return genres.includes(filter.genre!);
        });
      }

      if (filter.search) {
        const search = filter.search.toLowerCase();
        filtered = filtered.filter(
          (b) =>
            b.title.toLowerCase().includes(search) ||
            b.artist.toLowerCase().includes(search) ||
            b.tags.some((tag) => tag.toLowerCase().includes(search))
        );
      }

      // Sort beats
      filtered.sort((a, b) => {
        switch (filter.sortBy) {
          case 'newest':
            return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
          case 'popular':
            return b.plays - a.plays;
          case 'price_low':
            return (a.licenses.basic?.price || 0) - (b.licenses.basic?.price || 0);
          case 'price_high':
            return (b.licenses.basic?.price || 0) - (a.licenses.basic?.price || 0);
          default:
            return 0;
        }
      });

      setBeats(filtered);
    } finally {
      setLoading(false);
    }
  };

  // Extract dynamic genres from all beats
  const genres = useMemo(() => {
    return extractUniqueGenres(allBeats, { sort: true });
  }, [allBeats]);

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Shop Premium Beats</h1>
          <p className="text-white/40 mt-2">Browse and purchase high-quality beats by Jonna Rincon</p>
        </div>

        {/* Filters */}
        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search beats..."
              value={filter.search || ''}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />

            {/* Genre Filter */}
            <select
              value={filter.genre || ''}
              onChange={(e) => setFilter({ ...filter, genre: e.target.value || undefined })}
              className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={filter.sortBy}
              onChange={(e) =>
                setFilter({ ...filter, sortBy: e.target.value as typeof filter.sortBy })
              }
              className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>

            {/* Clear Filters */}
            {(filter.genre || filter.search) && (
              <button
                onClick={() => setFilter({ sortBy: 'newest' })}
                className="bg-white/[0.06] hover:bg-white/[0.08] rounded-lg px-4 py-2 text-white transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Beats Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner text="Loading beats..." />
          </div>
        ) : beats.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.08] border border-white/[0.06] rounded-xl">
            <Music size={64} className="mx-auto mb-4 text-white/20" />
            <p className="text-xl text-white mb-2">No beats found</p>
            <p className="text-white/40">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beats.map((beat) => (
              <div
                key={beat.id}
                className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden hover:border-blue-500/50 transition-all hover:transform hover:scale-105"
              >
                {/* Beat Artwork */}
                <div className="relative">
                  <img
                    src={beat.artworkUrl || '/placeholder-beat.png'}
                    alt={beat.title}
                    className="w-full h-48 object-cover"
                  />
                  {beat.featured && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                      FEATURED
                    </div>
                  )}
                  {beat.trending && (
                    <div className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded text-xs font-bold">
                      🔥 TRENDING
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-blue-600 hover:bg-blue-700 rounded-full p-4 transition-all hover:scale-110">
                      <Play size={32} className="text-white" />
                    </button>
                  </div>
                </div>

                {/* Beat Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 text-white">{beat.title}</h3>
                  <div className="text-sm text-white/40 mb-3">{beat.artist}</div>

                  {/* Beat Details */}
                  <div className="flex items-center gap-3 text-xs text-white/40 mb-3">
                    <span>{beat.bpm} BPM</span>
                    <span>•</span>
                    <span>{beat.key}</span>
                    <span>•</span>
                    <span>{beat.genre}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-white/40 mb-4">
                    <span className="flex items-center gap-1">
                      <Play size={12} /> {beat.plays.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {beat.likes.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download size={12} /> {beat.downloads.toLocaleString()}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex justify-between items-center pt-3 border-t border-white/[0.06]">
                    <div>
                      <div className="text-xs text-white/40">Starting at</div>
                      <div className="font-bold text-lg text-white">
                        €{beat.licenses.basic?.price.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <Link
                      to={`/customer/shop/${beat.id}`}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-4 py-2 rounded-lg text-white font-medium transition-all"
                    >
                      View Beat
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!loading && beats.length > 0 && (
          <div className="text-center text-white/40">
            Showing {beats.length} beat{beats.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerShop;
