import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import LinkInput from '../../components/admin/LinkInput';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTracks } from '../../hooks/useTracks';
import { trackService } from '../../lib/firebase/services';
import { Track } from '../../lib/firebase/types';
import { Plus, Edit, Trash2, Play, Pause, ChevronDown, GripVertical, ArrowUp, ArrowDown, Link as LinkIcon, AlertCircle, Filter as FilterIcon } from 'lucide-react';
import { toDirectUrl, detectUrlType, isValidUrl } from '../../lib/utils/urlUtils';

const TracksPage: React.FC = () => {
  const { tracks, loading, error } = useTracks();
  const [showModal, setShowModal] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [expandedAlbums, setExpandedAlbums] = useState<Set<string>>(new Set());

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close the filter dropdown when clicking outside
  useEffect(() => {
    if (!showFilters) return;
    const handleDocClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [showFilters]);

  const handleCreate = () => {
    setEditingTrack(null);
    setShowModal(true);
  };

  const handleEdit = (track: Track) => {
    setEditingTrack(track);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this track?')) return;
    try {
      await trackService.deleteTrack(id);
      alert('Track deleted successfully');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEditAlbum = (track: Track) => {
    // For album editing, set the track as the album reference
    setEditingTrack(track);
    setShowModal(true);
  };

  const handleDeleteAlbum = async (track: Track) => {
    const albumName = track.album || track.title;
    if (!confirm(`Are you sure you want to delete the entire album "${albumName}" with all its tracks?`)) return;
    try {
      // Get all tracks in this album and delete them
      // Filter by album name (use both album field and title as fallback)
      const albumTracks = tracks.filter(t => {
        const trackAlbumName = t.album || t.title;
        return trackAlbumName === albumName && (t.type === 'Album' || t.type === 'EP');
      });

      for (const t of albumTracks) {
        await trackService.deleteTrack(t.id);
      }
      alert(`Album "${albumName}" and all ${albumTracks.length} tracks deleted successfully`);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const togglePlay = (trackId: string) => {
    if (currentlyPlaying === trackId) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(trackId);
    }
  };

  const toggleAlbumExpand = (albumKey: string) => {
    const newExpanded = new Set(expandedAlbums);
    if (newExpanded.has(albumKey)) {
      newExpanded.delete(albumKey);
    } else {
      newExpanded.add(albumKey);
    }
    setExpandedAlbums(newExpanded);
  };

  // Filter toggle functions
  const toggleTypeFilter = (type: string) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
  };

  const clearAllFilters = () => {
    setSelectedTypes(new Set());
    setSelectedYear(null);
    setSelectedStatus(null);
  };

  // Check if any filter is active
  const hasActiveFilters = selectedTypes.size > 0 || selectedYear !== null || selectedStatus !== null;

  const moveSingleTrackUp = async (trackId: string) => {
    try {
      // Use sorted tracks to get the correct order
      const singleTracks = sortedTracks.filter(t => !t.album && (t.type === 'Single' || t.type === 'Exclusive'));
      const index = singleTracks.findIndex(t => t.id === trackId);
      console.log('Move up - index:', index, 'total:', singleTracks.length);
      console.log('Current singleTracks order:', singleTracks.map((t, i) => `${i}: ${t.title} (id:${t.id.slice(0,8)}, sort:${t.sortOrder})`));

      if (index > 0) {
        const track = singleTracks[index];
        const prevTrack = singleTracks[index - 1];

        console.log('Before update - track:', track.title, 'sortOrder:', track.sortOrder);
        console.log('Before update - prevTrack:', prevTrack.title, 'sortOrder:', prevTrack.sortOrder);

        // Assign explicit sortOrder based on position
        const newPrevSort = index * 10;
        const newTrackSort = (index - 1) * 10;

        console.log('After update - newPrevSort:', newPrevSort, 'newTrackSort:', newTrackSort);

        console.log('Swapping:', prevTrack.id, 'with', track.id);
        await trackService.updateTrack(prevTrack.id, { sortOrder: newPrevSort });
        console.log('Updated prevTrack with sortOrder:', newPrevSort);

        await trackService.updateTrack(track.id, { sortOrder: newTrackSort });
        console.log('Updated track with sortOrder:', newTrackSort);

        alert('Track moved up!');
      }
    } catch (error) {
      console.error('Error moving track up:', error);
      alert('Error moving track: ' + error);
    }
  };

  const moveSingleTrackDown = async (trackId: string) => {
    try {
      // Use sorted tracks to get the correct order
      const singleTracks = sortedTracks.filter(t => !t.album && (t.type === 'Single' || t.type === 'Exclusive'));
      const index = singleTracks.findIndex(t => t.id === trackId);
      console.log('Move down - index:', index, 'total:', singleTracks.length);

      if (index < singleTracks.length - 1) {
        const track = singleTracks[index];
        const nextTrack = singleTracks[index + 1];

        // Assign explicit sortOrder based on position
        const newNextSort = index * 10;
        const newTrackSort = (index + 1) * 10;

        console.log('Swapping:', track.id, 'with', nextTrack.id);
        await trackService.updateTrack(track.id, { sortOrder: newNextSort });
        await trackService.updateTrack(nextTrack.id, { sortOrder: newTrackSort });
        alert('Track moved down!');
      }
    } catch (error) {
      console.error('Error moving track down:', error);
      alert('Error moving track: ' + error);
    }
  };

  const moveAlbumUp = async (albumName: string) => {
    try {
      const albumTracks = tracks.filter(t => (t.album || t.title) === albumName);
      if (albumTracks.length === 0) return;

      // Get albums in sorted order (same as displayed)
      const allAlbums = Array.from(new Set(sortedTracks.filter(t => t.type === 'Album' || t.type === 'EP').map(t => t.album || t.title)));
      const index = allAlbums.indexOf(albumName);
      console.log('Album move up - index:', index, 'total albums:', allAlbums.length);

      if (index > 0) {
        const prevAlbumName = allAlbums[index - 1];
        const prevAlbumTracks = tracks.filter(t => (t.album || t.title) === prevAlbumName);

        const newPrevSort = index * 10;
        const newAlbumSort = (index - 1) * 10;

        for (const track of albumTracks) {
          await trackService.updateTrack(track.id, { sortOrder: newAlbumSort });
        }
        for (const track of prevAlbumTracks) {
          await trackService.updateTrack(track.id, { sortOrder: newPrevSort });
        }
        alert('Album moved up!');
      }
    } catch (error) {
      console.error('Error moving album up:', error);
      alert('Error moving album: ' + error);
    }
  };

  const moveAlbumDown = async (albumName: string) => {
    try {
      const albumTracks = tracks.filter(t => (t.album || t.title) === albumName);
      if (albumTracks.length === 0) return;

      // Get albums in sorted order (same as displayed)
      const allAlbums = Array.from(new Set(sortedTracks.filter(t => t.type === 'Album' || t.type === 'EP').map(t => t.album || t.title)));
      const index = allAlbums.indexOf(albumName);
      console.log('Album move down - index:', index, 'total albums:', allAlbums.length);

      if (index < allAlbums.length - 1) {
        const nextAlbumName = allAlbums[index + 1];
        const nextAlbumTracks = tracks.filter(t => (t.album || t.title) === nextAlbumName);

        const newNextSort = index * 10;
        const newAlbumSort = (index + 1) * 10;

        for (const track of albumTracks) {
          await trackService.updateTrack(track.id, { sortOrder: newAlbumSort });
        }
        for (const track of nextAlbumTracks) {
          await trackService.updateTrack(track.id, { sortOrder: newNextSort });
        }
        alert('Album moved down!');
      }
    } catch (error) {
      console.error('Error moving album down:', error);
      alert('Error moving album: ' + error);
    }
  };

  // Sort tracks by sortOrder (for albums and singles) before grouping
  const sortedTracks = [...tracks].sort((a, b) => {
    // Albums/EPs and singles should be sorted by sortOrder
    const aSort = a.sortOrder ?? Number.MAX_VALUE;
    const bSort = b.sortOrder ?? Number.MAX_VALUE;
    return aSort - bSort;
  });

  console.log('📊 TracksPage rendered - sortedTracks count:', sortedTracks.length);
  console.log('📊 Sorted order:', sortedTracks.filter(t => !t.album && (t.type === 'Single' || t.type === 'Exclusive')).map((t, i) => `${i}: ${t.title} (sort:${t.sortOrder})`));

  // Apply filters to tracks
  const filteredTracks = sortedTracks.filter(track => {
    // Type filter (AND logic - must match if filter is active)
    if (selectedTypes.size > 0 && !selectedTypes.has(track.type)) {
      return false;
    }

    // Year filter (AND logic)
    if (selectedYear !== null && track.year !== selectedYear) {
      return false;
    }

    // Status filter (AND logic)
    if (selectedStatus !== null && track.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  // Get unique years from all tracks for year filter dropdown
  const availableYears = Array.from(new Set(tracks.map(t => t.year))).sort((a, b) => b - a);

  // Group tracks by album for Album/EP types
  const groupedTracks = filteredTracks.reduce((acc, track) => {
    if (track.type === 'Album' || track.type === 'EP') {
      // Use album field, fallback to title for backward compatibility
      const albumName = track.album || track.title;
      const albumKey = `${track.type}:${albumName}`;

      if (!acc[albumKey]) {
        acc[albumKey] = {
          albumName: albumName,
          type: track.type,
          artwork: track.artworkUrl,
          tracks: [],
          displayTrack: track,
        };
      }
      acc[albumKey].tracks.push(track);
    } else {
      // Single tracks
      const singleKey = `single:${track.id}`;
      acc[singleKey] = {
        albumName: null,
        type: track.type,
        artwork: track.artworkUrl,
        tracks: [track],
        displayTrack: track,
      };
    }
    return acc;
  }, {} as Record<string, any>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Tracks Management</h1>
            <p className="text-white/40 mt-2">Manage your track catalog</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Track</span>
            </button>
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`p-3 rounded-lg border transition-all ${
                  hasActiveFilters
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-white/[0.06] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.12]'
                }`}
                title={showFilters ? 'Hide filters' : 'Show filters'}
                aria-label="Toggle filters"
                aria-expanded={showFilters}
              >
                <FilterIcon size={20} />
              </button>

              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-black/90 backdrop-blur-xl border border-white/[0.08] rounded-xl p-4 shadow-2xl z-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">Filters</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-xs text-red-400 hover:text-red-300 transition"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Type Buttons */}
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Type</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Singles', 'Albums', 'EPs'].map((type) => {
                          const actualType = type === 'Singles' ? 'Single' : type === 'EPs' ? 'EP' : 'Album';
                          const isActive = selectedTypes.has(actualType);
                          return (
                            <button
                              key={type}
                              onClick={() => toggleTypeFilter(actualType)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isActive
                                  ? 'bg-red-600 text-white'
                                  : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.12]'
                              }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Year */}
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Year</p>
                      <select
                        value={selectedYear ?? ''}
                        onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                        className={`w-full px-3 py-2 rounded-lg text-sm transition-all ${
                          selectedYear !== null
                            ? 'bg-red-600 text-white'
                            : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.12]'
                        } focus:outline-none`}
                      >
                        <option value="">All years</option>
                        {availableYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Status</p>
                      <select
                        value={selectedStatus ?? ''}
                        onChange={(e) => setSelectedStatus(e.target.value || null)}
                        className={`w-full px-3 py-2 rounded-lg text-sm transition-all ${
                          selectedStatus !== null
                            ? 'bg-red-600 text-white'
                            : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.12]'
                        } focus:outline-none`}
                      >
                        <option value="">All statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    {hasActiveFilters && (
                      <div className="text-xs text-white/60 pt-2 border-t border-white/[0.06]">
                        Showing{' '}
                        <span className="font-semibold text-white">
                          {Object.keys(groupedTracks).length}
                        </span>{' '}
                        of{' '}
                        <span className="font-semibold text-white">
                          {Object.keys(
                            sortedTracks.reduce((acc, track) => {
                              if (track.type === 'Album' || track.type === 'EP') {
                                const albumName = track.album || track.title;
                                const albumKey = `${track.type}:${albumName}`;
                                if (!acc[albumKey]) acc[albumKey] = true;
                              } else {
                                const singleKey = `single:${track.id}`;
                                if (!acc[singleKey]) acc[singleKey] = true;
                              }
                              return acc;
                            }, {} as Record<string, boolean>)
                          ).length}
                        </span>{' '}
                        items
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm font-semibold">
              ⚠️ {error}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-12">
              <LoadingSpinner text="Loading tracks..." />
            </div>
          ) : tracks.length === 0 ? (
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-12 text-center text-white/40">
              No tracks yet. Create your first track!
            </div>
          ) : (
            Object.entries(groupedTracks).map(([albumKey, group]) => {
              const isAlbum = group.albumName && (group.type === 'Album' || group.type === 'EP');
              const isExpanded = expandedAlbums.has(albumKey);

              return isAlbum ? (
                <div key={albumKey} className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden">
                  {/* Album Header */}
                  <div className="px-6 py-4 flex items-center gap-4 border-b border-white/[0.06] hover:bg-white/[0.06] transition-all">
                    <button
                      onClick={() => toggleAlbumExpand(albumKey)}
                      className="flex-1 flex items-center gap-4 text-left"
                    >
                      <img
                        src={group.artwork}
                        alt={group.albumName}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white">{group.albumName}</p>
                        <p className="text-sm text-white/40">{group.tracks.length} tracks</p>
                      </div>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm flex-shrink-0">
                        {group.type}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`flex-shrink-0 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Action Buttons - Album Level */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => moveAlbumUp(group.albumName)}
                        disabled={(() => {
                          const allAlbums = Array.from(new Set(sortedTracks.filter(t => t.type === 'Album' || t.type === 'EP').map(t => t.album || t.title)));
                          return allAlbums.indexOf(group.albumName) === 0;
                        })()}
                        className="p-2 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
                        title="Move album up"
                      >
                        <ArrowUp size={18} />
                      </button>
                      <button
                        onClick={() => moveAlbumDown(group.albumName)}
                        disabled={(() => {
                          const allAlbums = Array.from(new Set(sortedTracks.filter(t => t.type === 'Album' || t.type === 'EP').map(t => t.album || t.title)));
                          return allAlbums.indexOf(group.albumName) === allAlbums.length - 1;
                        })()}
                        className="p-2 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
                        title="Move album down"
                      >
                        <ArrowDown size={18} />
                      </button>
                      <button
                        onClick={() => handleEditAlbum(group.displayTrack)}
                        className="p-2 text-white/40 hover:text-blue-400 transition-colors"
                        title="Edit Album"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteAlbum(group.displayTrack)}
                        className="p-2 text-white/40 hover:text-red-400 transition-colors"
                        title="Delete Album"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Album Tracks - Expandible */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.06]">
                      <table className="w-full">
                        <tbody className="divide-y divide-white/[0.06]">
                          {group.tracks.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0)).map((track, index) => (
                            <tr key={track.id} className="hover:bg-white/[0.06]">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-white/40 font-mono w-6 text-right">{index + 1}</span>
                                  <div>
                                    <p className="font-medium text-white">{track.title}</p>
                                    <p className="text-sm text-white/40">{track.artist}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">
                                  {track.genre}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-white/60">
                                {track.bpm} BPM / {track.key}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2 py-1 rounded text-sm ${
                                    track.status === 'published'
                                      ? 'bg-green-500/20 text-green-400'
                                      : track.status === 'draft'
                                      ? 'bg-yellow-500/20 text-yellow-400'
                                      : 'bg-white/[0.06] text-white/40'
                                  }`}
                                >
                                  {track.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-white/60">{track.plays}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                // Single Track
                <div key={albumKey} className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <tbody>
                        <tr className="hover:bg-white/[0.06]">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={group.displayTrack.artworkUrl}
                                alt={group.displayTrack.title}
                                className="w-12 h-12 rounded object-cover"
                              />
                              <div>
                                <p className="font-medium text-white">{group.displayTrack.title}</p>
                                <p className="text-sm text-white/40">{group.displayTrack.artist}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">
                              {group.displayTrack.genre}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white/60">
                            {group.displayTrack.bpm} BPM / {group.displayTrack.key}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded text-sm ${
                                group.displayTrack.status === 'published'
                                  ? 'bg-green-500/20 text-green-400'
                                  : group.displayTrack.status === 'draft'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-white/[0.06] text-white/40'
                              }`}
                            >
                              {group.displayTrack.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white/60">{group.displayTrack.plays}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => moveSingleTrackUp(group.displayTrack.id)}
                                disabled={(() => {
                                  const singleTracks = sortedTracks.filter(t => !t.album && (t.type === 'Single' || t.type === 'Exclusive'));
                                  return singleTracks.findIndex(t => t.id === group.displayTrack.id) === 0;
                                })()}
                                className="p-2 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
                                title="Move up"
                              >
                                <ArrowUp size={18} />
                              </button>
                              <button
                                onClick={() => moveSingleTrackDown(group.displayTrack.id)}
                                disabled={(() => {
                                  const singleTracks = sortedTracks.filter(t => !t.album && (t.type === 'Single' || t.type === 'Exclusive'));
                                  return singleTracks.findIndex(t => t.id === group.displayTrack.id) === singleTracks.length - 1;
                                })()}
                                className="p-2 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
                                title="Move down"
                              >
                                <ArrowDown size={18} />
                              </button>
                              <button
                                onClick={() => togglePlay(group.displayTrack.id)}
                                className="p-2 text-white/40 hover:text-purple-400 transition-colors"
                                title="Play preview"
                              >
                                {currentlyPlaying === group.displayTrack.id ? <Pause size={18} /> : <Play size={18} />}
                              </button>
                              <button
                                onClick={() => handleEdit(group.displayTrack)}
                                className="p-2 text-white/40 hover:text-blue-400 transition-colors"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(group.displayTrack.id)}
                                className="p-2 text-white/40 hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showModal && (
        <TrackFormModal
          track={editingTrack}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            setEditingTrack(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

interface TrackFormModalProps {
  track: Track | null;
  onClose: () => void;
  onSave: () => void;
}

interface TracklistItem {
  id: string;
  title: string;
  audioUrl: string;
  duration?: string;
}

const TrackFormModal: React.FC<TrackFormModalProps> = ({ track, onClose, onSave }) => {
  const currentYear = new Date().getFullYear();
  const isEditing = !!track;

  // Determine if this is editing an album/EP (check type first, then album field)
  const isEditingAlbum = isEditing && (track?.type === 'Album' || track?.type === 'EP');

  const [formData, setFormData] = useState({
    // For albums/EPs: use album name. For single tracks: use track title
    title: isEditingAlbum ? (track?.album || track?.title || '') : (track?.title || ''),
    artist: track?.artist || 'Jonna Rincon',
    genre: track?.genre || '',
    type: track?.type || 'Single',
    year: track?.year || currentYear,
    collab: track?.collab || 'Solo',
    duration: track?.duration || '0:00',
    tags: track?.tags?.join(', ') || '',
    audioUrl: track?.audioUrl || '',
    artworkUrl: track?.artworkUrl || '',
    price: track?.price ?? '',
    slug: track?.slug || '',
    status: track?.status || 'draft',
    featured: track?.featured || false,
    isFree: track?.isFree || false,
    description: track?.description || '',
  });

  const [tracklist, setTracklist] = useState<TracklistItem[]>([]);
  const [saving, setSaving] = useState(false);
  const { tracks: allTracks } = useTracks();

  // Load album tracks when editing an album
  React.useEffect(() => {
    if (isEditingAlbum && track) {
      // Use album field to find all tracks of this album
      const albumName = track.album || track.title;
      const albumTracks = allTracks
        .filter(t => t.album === albumName && (t.type === 'Album' || t.type === 'EP'))
        .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0))
        .map((t) => ({
          id: t.id,
          title: t.title,
          audioUrl: t.audioUrl,
        }));
      setTracklist(albumTracks);
    }
  }, [isEditingAlbum, track?.album, track?.title, allTracks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const baseTrackData: any = {
        title: formData.title,
        artist: formData.artist,
        genre: formData.genre,
        type: formData.type,
        year: formData.year,
        collab: formData.collab,
        duration: formData.duration,
        tags: formData.tags.split(',').map((t) => t.trim()),
        artworkUrl: formData.artworkUrl,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        status: formData.status,
        featured: formData.featured,
        isFree: formData.isFree,
        description: formData.description || undefined,
        licenses: {
          basic: {
            type: 'basic' as const,
            price: 9,
            features: ['MP3 Download', 'Non-exclusive rights', 'Personal use'],
            downloads: 1,
            streams: 10000,
            videos: 1,
            distribution: false,
          },
          premium: {
            type: 'premium' as const,
            price: 19,
            features: ['WAV + MP3', 'Non-exclusive rights', 'Commercial use', 'Unlimited streams'],
            downloads: 5,
            streams: 1000000,
            videos: 5,
            distribution: true,
          },
          exclusive: {
            type: 'exclusive' as const,
            price: 99,
            features: ['All files', 'Exclusive rights', 'Full ownership', 'Unlimited use'],
            downloads: -1,
            streams: -1,
            videos: -1,
            distribution: true,
          },
        },
      };

      // For Album/EP with tracklist
      if ((formData.type === 'Album' || formData.type === 'EP') && tracklist.length > 0) {
        if (isEditingAlbum) {
          // Update existing album tracks
          const albumName = formData.title.trim();
          if (!albumName) {
            throw new Error('Album name cannot be empty');
          }

          const existingTrackIds = allTracks
            .filter(t => t.album === track?.album)
            .map(t => t.id);

          for (let i = 0; i < tracklist.length; i++) {
            const item = tracklist[i];
            const trackData = {
              ...baseTrackData,
              title: item.title,
              audioUrl: item.audioUrl,
              album: albumName,  // Use album name directly
              trackNumber: i + 1,
            };

            if (item.id && existingTrackIds.includes(item.id)) {
              // Update existing track
              await trackService.updateTrack(item.id, trackData);
              existingTrackIds.splice(existingTrackIds.indexOf(item.id), 1);
            } else {
              // Create new track
              console.log('📝 Creating track with data:', { album: trackData.album, title: trackData.title });
              await trackService.createTrack(trackData);
            }
          }

          // Delete tracks that were removed
          for (const deletedId of existingTrackIds) {
            await trackService.deleteTrack(deletedId);
          }
          alert(`Updated ${formData.type.toLowerCase()} with ${tracklist.length} tracks`);
        } else {
          // Create new album with tracks
          // DEBUG: Ensure album name is set
          const albumName = formData.title.trim();
          if (!albumName) {
            throw new Error('Album name cannot be empty');
          }

          for (let i = 0; i < tracklist.length; i++) {
            const item = tracklist[i];
            const trackData = {
              ...baseTrackData,
              title: item.title,
              audioUrl: item.audioUrl,
              album: albumName,  // Use album name directly
              trackNumber: i + 1,
            };
            console.log('📝 Creating track with data:', { album: trackData.album, title: trackData.title });
            await trackService.createTrack(trackData);
          }
          alert(`Created ${tracklist.length} tracks in "${albumName}" ${formData.type.toLowerCase()}`);
        }
      } else if (track) {
        // Update single track
        const trackData = {
          ...baseTrackData,
          audioUrl: formData.audioUrl,
        };
        await trackService.updateTrack(track.id, trackData);
        alert('Track updated successfully');
      } else {
        // Create single track
        const trackData = {
          ...baseTrackData,
          audioUrl: formData.audioUrl,
        };
        await trackService.createTrack(trackData);
        alert('Track created successfully');
      }

      onSave();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const addTrackToList = () => {
    setTracklist([
      ...tracklist,
      {
        id: Date.now().toString(),
        title: '',
        audioUrl: '',
      },
    ]);
  };

  const removeTrackFromList = (id: string) => {
    setTracklist(tracklist.filter((t) => t.id !== id));
  };

  const updateTrackInList = (id: string, field: string, value: string) => {
    if (field === 'audioUrl') {
      // Apply URL transformation for audio files (adds /download if needed)
      value = toDirectUrl(value);
    }
    setTracklist(tracklist.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const moveTrackUp = (id: string) => {
    const index = tracklist.findIndex((t) => t.id === id);
    if (index > 0) {
      const newList = [...tracklist];
      [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
      setTracklist(newList);
    }
  };

  const moveTrackDown = (id: string) => {
    const index = tracklist.findIndex((t) => t.id === id);
    if (index < tracklist.length - 1) {
      const newList = [...tracklist];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      setTracklist(newList);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto p-4">
      <div className="bg-white/[0.10] backdrop-blur-2xl border border-white/[0.10] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/[0.08]">
          <h2 className="text-2xl font-bold text-white">
            {track ? 'Edit Track' : 'Add New Track'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                {(formData.type === 'Album' || formData.type === 'EP') ? 'Album Name' : 'Title'} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                placeholder={(formData.type === 'Album' || formData.type === 'EP') ? 'e.g. "IF Album"' : 'Track title'}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Artist <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Type <span className="text-red-400">*</span></label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Album' | 'EP' | 'Single' | 'Exclusive' })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              >
                <option value="Single">Single</option>
                <option value="EP">EP</option>
                <option value="Album">Album</option>
                <option value="Exclusive">Exclusive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Year <span className="text-red-400">*</span></label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Collab <span className="text-red-400">*</span></label>
              <select
                value={formData.collab}
                onChange={(e) => setFormData({ ...formData, collab: e.target.value as 'Solo' | 'Collab' })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              >
                <option value="Solo">Solo</option>
                <option value="Collab">Collab</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Genre <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Duration</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                placeholder="e.g. 3:45"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Price (€) - Optional</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                placeholder="Leave empty for free tracks"
              />
              <p className="text-xs text-white/40 mt-1">Leave empty for free tracks</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Track['status'] })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              placeholder="electronic, remix, bootleg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              placeholder="auto-generated from title"
            />
          </div>

          {/* Show audio URL only for single tracks */}
          {!(formData.type === 'Album' || formData.type === 'EP') && (
            <div className="grid grid-cols-2 gap-4">
              <LinkInput
                label="Audio URL"
                name="audioUrl"
                type="audio"
                onChange={(url) => setFormData({ ...formData, audioUrl: url })}
                defaultValue={formData.audioUrl}
                placeholder="https://nextcloud.example.com/index.php/s/abc123"
              />
              <LinkInput
                label="Artwork URL"
                name="artworkUrl"
                type="image"
                onChange={(url) => setFormData({ ...formData, artworkUrl: url })}
                defaultValue={formData.artworkUrl}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          )}

          {/* Show artwork URL for album/EP */}
          {(formData.type === 'Album' || formData.type === 'EP') && (
            <div>
              <LinkInput
                label="Artwork URL (Album/EP Cover)"
                name="artworkUrl"
                type="image"
                onChange={(url) => setFormData({ ...formData, artworkUrl: url })}
                defaultValue={formData.artworkUrl}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          )}

          {/* Tracklist section for Album/EP */}
          {(formData.type === 'Album' || formData.type === 'EP') && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white/60">Tracks</label>
                  <button
                    type="button"
                    onClick={addTrackToList}
                    disabled={!formData.title.trim()}
                    className="px-3 py-1 bg-white/[0.10] hover:bg-white/[0.15] disabled:opacity-50 disabled:cursor-not-allowed text-white/70 text-sm rounded transition-all"
                    title={!formData.title.trim() ? 'Enter album name first' : 'Add track'}
                  >
                    + Add Track
                  </button>
                </div>
                <p className="text-xs text-red-400/60">
                  {!formData.title.trim()
                    ? 'Enter Album Name first, then add tracks'
                    : 'Album/EP requires at least one track with title and audio URL'}
                </p>
              </div>

              <div className="space-y-3 bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                {tracklist.length === 0 ? (
                  <p className="text-white/40 text-sm">No tracks added yet</p>
                ) : (
                  tracklist.map((item, index) => {
                    const transformedUrl = toDirectUrl(item.audioUrl);
                    const wasTransformed = item.audioUrl && item.audioUrl !== transformedUrl;
                    const isValidAudioUrl = !item.audioUrl || isValidUrl(item.audioUrl);
                    const urlType = detectUrlType(item.audioUrl);

                    const getUrlTypeLabel = () => {
                      if (!item.audioUrl) return '';
                      switch (urlType) {
                        case 'nextcloud':
                          return 'Nextcloud/ownCloud';
                        case 'firebase':
                          return 'Firebase Storage';
                        default:
                          return 'Direct URL';
                      }
                    };

                    return (
                    <div key={item.id} className="space-y-2 p-3 bg-white/[0.05] rounded border border-white/[0.06]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <GripVertical size={16} className="text-white/30 flex-shrink-0" />
                          <label className="text-sm text-white/40">Track {index + 1}</label>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveTrackUp(item.id)}
                            disabled={index === 0}
                            className="p-1 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
                            title="Move up"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveTrackDown(item.id)}
                            disabled={index === tracklist.length - 1}
                            className="p-1 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
                            title="Move down"
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeTrackFromList(item.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Track Title"
                        value={item.title}
                        onChange={(e) => updateTrackInList(item.id, 'title', e.target.value)}
                        className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded text-white text-sm"
                      />
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Audio URL"
                          value={item.audioUrl}
                          onChange={(e) => {
                            const url = e.target.value;
                            updateTrackInList(item.id, 'audioUrl', url);
                          }}
                          className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded text-white text-sm"
                        />

                        {/* URL Feedback Section */}
                        {item.audioUrl && isValidAudioUrl && (
                          <div className="flex flex-col gap-2">
                            {/* URL Type Badge */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-white/40">Type:</span>
                              <span className="text-xs bg-white/[0.08] text-white/60 px-2 py-1 rounded">
                                {getUrlTypeLabel()}
                              </span>
                            </div>

                            {/* Missing /download Notification */}
                            {wasTransformed && (
                              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2">
                                <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-400">
                                  Missing <code className="bg-black/30 px-1 rounded">/download</code> - will be added automatically
                                </p>
                              </div>
                            )}

                            {/* Final URL Display */}
                            <div className="bg-white/[0.04] border border-white/[0.08] rounded px-3 py-2">
                              <div>
                                <p className="text-xs text-white/40 mb-1">Final URL:</p>
                                <p className="text-xs text-white break-all font-mono">{transformedUrl}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          )}


          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add a description for this track..."
              className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/[0.2]"
              rows={3}
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-white/60">Featured Track</span>
            </label>
          </div>

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFree}
                onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                className="w-5 h-5 rounded bg-white/[0.06] border-white/[0.08] text-purple-500 focus:ring-purple-500"
              />
              <div>
                <span className="text-sm font-medium text-white/60">Free Download</span>
                <p className="text-xs text-white/30">Enable to offer this track as a free download</p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                ((formData.type === 'Album' || formData.type === 'EP') &&
                  (tracklist.length === 0 || tracklist.some((t) => !t.title || !t.audioUrl)))
              }
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : isEditing
                ? 'Update Track'
                : (formData.type === 'Album' || formData.type === 'EP')
                ? `Create ${formData.type}`
                : 'Create Track'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TracksPage;
