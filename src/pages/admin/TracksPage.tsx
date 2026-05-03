import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import LinkInput from '../../components/admin/LinkInput';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTracks } from '../../hooks/useTracks';
import { useRemixes } from '../../hooks/useRemixes';
import { usePlaylists } from '../../hooks/usePlaylists';
import { trackService, remixService, playlistService, settingsService } from '../../lib/firebase/services';
import { Track, Remix, Playlist } from '../../lib/firebase/types';
import {
  Plus, Trash2, Play, Pause, ChevronDown, Music, Save,
  Globe, Lock, Star, Filter as FilterIcon, X, GripVertical,
  ArrowUp, ArrowDown, AlertCircle, Check
} from 'lucide-react';
import { toDirectUrl, detectUrlType, isValidUrl } from '../../lib/utils/urlUtils';

type CatalogueTab = 'tracks' | 'albums' | 'remixes' | 'playlists' | 'custom';
type EditingContext = 'track' | 'remix' | null;

const TracksPage: React.FC = () => {
  const { tracks, loading: tracksLoading, error } = useTracks();
  const { remixes, loading: remixesLoading } = useRemixes();
  const { playlists, loading: playlistsLoading } = usePlaylists();

  const [activeTab, setActiveTab] = useState<CatalogueTab>('tracks');
  const [showModal, setShowModal] = useState(false);
  const [editingContext, setEditingContext] = useState<EditingContext>(null);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editingRemix, setEditingRemix] = useState<Remix | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [expandedAlbums, setExpandedAlbums] = useState<Set<string>>(new Set());
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [showPlaylistEditModal, setShowPlaylistEditModal] = useState(false);
  const [playlistEditForm, setPlaylistEditForm] = useState({ name: '', description: '', isPublic: false, isFeatured: false });

  // Custom button track management
  const [showCustomTracksModal, setShowCustomTracksModal] = useState(false);
  const [customTracksButtonIndex, setCustomTracksButtonIndex] = useState<1 | 2>(1);

  // Track settings state
  const [trackSettings, setTrackSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingsService.getTrackSettings();
        if (data) setTrackSettings(data);
      } catch (error) {
        console.error('Failed to load track settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };
    loadSettings();
  }, []);

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

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

  const openTrackModal = (track: Track | null) => {
    setEditingTrack(track);
    setEditingContext('track');
    setShowModal(true);
  };

  const openRemixModal = (remix: Remix | null) => {
    setEditingRemix(remix);
    setEditingContext('remix');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTrack(null);
    setEditingRemix(null);
    setEditingContext(null);
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit track wilt verwijderen?')) return;
    try {
      await trackService.deleteTrack(id);
      closeModal();
      alert('Track verwijderd');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteAlbum = async (track: Track) => {
    const albumName = track.album || track.title;
    if (!confirm(`Weet je zeker dat je album "${albumName}" met alle tracks wilt verwijderen?`)) return;
    try {
      const albumTracks = tracks.filter(t => {
        const trackAlbumName = t.album || t.title;
        return trackAlbumName === albumName && (t.type === 'Album' || t.type === 'EP');
      });
      for (const t of albumTracks) {
        await trackService.deleteTrack(t.id);
      }
      closeModal();
      alert(`Album "${albumName}" en ${albumTracks.length} tracks verwijderd`);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteRemix = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze remix wilt verwijderen?')) return;
    try {
      await remixService.deleteRemix(id);
      closeModal();
      alert('Remix verwijderd');
    } catch (error: any) {
      alert(error.message);
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

  const handleEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setPlaylistEditForm({
      name: playlist.name,
      description: playlist.description || '',
      isPublic: playlist.isPublic || false,
      isFeatured: playlist.isFeatured || false,
    });
    setShowPlaylistEditModal(true);
  };

  const handleSavePlaylist = async () => {
    if (!playlistEditForm.name.trim()) {
      alert('Playlist naam is verplicht');
      return;
    }
    try {
      if (editingPlaylist) {
        await playlistService.updatePlaylist(editingPlaylist.id, {
          name: playlistEditForm.name.trim(),
          description: playlistEditForm.description,
          isPublic: playlistEditForm.isPublic,
          isFeatured: playlistEditForm.isFeatured,
        });
        alert('Playlist bijgewerkt');
      } else {
        const { user } = require('../../contexts/AuthContext');
        await playlistService.createPlaylist(playlistEditForm.name.trim(), user.uid, [], playlistEditForm.description);
        alert('Playlist aangemaakt');
      }
      setShowPlaylistEditModal(false);
      setEditingPlaylist(null);
      setPlaylistEditForm({ name: '', description: '', isPublic: false, isFeatured: false });
    } catch (error: any) {
      alert(error.message || 'Fout bij opslaan playlist');
    }
  };

  const handleSaveTrackSettings = async () => {
    if (!trackSettings) return;
    try {
      await settingsService.saveTrackSettings(trackSettings);
      alert('Custom instellingen opgeslagen!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Fout bij opslaan instellingen');
    }
  };

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

  const hasActiveFilters = selectedTypes.size > 0 || selectedYear !== null || selectedStatus !== null;

  const moveSingleTrackUp = async (trackId: string) => {
    try {
      const singleTracks = sortedTracks.filter(t => !t.album && (t.type === 'Single' || t.type === 'Exclusive'));
      const index = singleTracks.findIndex(t => t.id === trackId);
      if (index > 0) {
        const track = singleTracks[index];
        const prevTrack = singleTracks[index - 1];
        await trackService.updateTrack(prevTrack.id, { sortOrder: index * 10 });
        await trackService.updateTrack(track.id, { sortOrder: (index - 1) * 10 });
      }
    } catch (error) {
      console.error('Error moving track up:', error);
    }
  };

  const moveSingleTrackDown = async (trackId: string) => {
    try {
      const singleTracks = sortedTracks.filter(t => !t.album && (t.type === 'Single' || t.type === 'Exclusive'));
      const index = singleTracks.findIndex(t => t.id === trackId);
      if (index < singleTracks.length - 1) {
        const track = singleTracks[index];
        const nextTrack = singleTracks[index + 1];
        await trackService.updateTrack(track.id, { sortOrder: (index + 1) * 10 });
        await trackService.updateTrack(nextTrack.id, { sortOrder: index * 10 });
      }
    } catch (error) {
      console.error('Error moving track down:', error);
    }
  };

  const moveAlbumUp = async (albumName: string) => {
    try {
      const albumTracks = tracks.filter(t => (t.album || t.title) === albumName);
      if (albumTracks.length === 0) return;
      const allAlbums = Array.from(new Set(sortedTracks.filter(t => t.type === 'Album' || t.type === 'EP').map(t => t.album || t.title)));
      const index = allAlbums.indexOf(albumName);
      if (index > 0) {
        const prevAlbumName = allAlbums[index - 1];
        const prevAlbumTracks = tracks.filter(t => (t.album || t.title) === prevAlbumName);
        for (const track of albumTracks) {
          await trackService.updateTrack(track.id, { sortOrder: (index - 1) * 10 });
        }
        for (const track of prevAlbumTracks) {
          await trackService.updateTrack(track.id, { sortOrder: index * 10 });
        }
      }
    } catch (error) {
      console.error('Error moving album up:', error);
    }
  };

  const moveAlbumDown = async (albumName: string) => {
    try {
      const albumTracks = tracks.filter(t => (t.album || t.title) === albumName);
      if (albumTracks.length === 0) return;
      const allAlbums = Array.from(new Set(sortedTracks.filter(t => t.type === 'Album' || t.type === 'EP').map(t => t.album || t.title)));
      const index = allAlbums.indexOf(albumName);
      if (index < allAlbums.length - 1) {
        const nextAlbumName = allAlbums[index + 1];
        const nextAlbumTracks = tracks.filter(t => (t.album || t.title) === nextAlbumName);
        for (const track of albumTracks) {
          await trackService.updateTrack(track.id, { sortOrder: (index + 1) * 10 });
        }
        for (const track of nextAlbumTracks) {
          await trackService.updateTrack(track.id, { sortOrder: index * 10 });
        }
      }
    } catch (error) {
      console.error('Error moving album down:', error);
    }
  };

  const sortedTracks = [...tracks].sort((a, b) => {
    const aSort = a.sortOrder ?? Number.MAX_VALUE;
    const bSort = b.sortOrder ?? Number.MAX_VALUE;
    return aSort - bSort;
  });

  // Only single/exclusive tracks for tracks tab
  const singleTracks = sortedTracks.filter(t => t.type === 'Single' || t.type === 'Exclusive');

  // Apply filters to single tracks
  const filteredSingleTracks = singleTracks.filter(track => {
    if (selectedTypes.size > 0 && !selectedTypes.has(track.type)) return false;
    if (selectedYear !== null && track.year !== selectedYear) return false;
    if (selectedStatus !== null && track.status !== selectedStatus) return false;
    return true;
  });

  // Only album/EP tracks for albums tab
  const albumTracks = sortedTracks.filter(t => t.type === 'Album' || t.type === 'EP');

  // Group album tracks
  const groupedAlbums = albumTracks.reduce((acc, track) => {
    const albumName = track.album || track.title;
    const albumKey = `${track.type}:${albumName}`;
    if (!acc[albumKey]) {
      acc[albumKey] = {
        albumName,
        type: track.type,
        artwork: track.artworkUrl,
        tracks: [],
        displayTrack: track,
      };
    }
    acc[albumKey].tracks.push(track);
    return acc;
  }, {} as Record<string, any>);

  const availableYears = Array.from(new Set(tracks.map(t => t.year))).sort((a, b) => b - a);

  const tabLabels: Record<CatalogueTab, string> = {
    tracks: 'TRACKS',
    albums: 'ALBUMS & EP',
    remixes: 'REMIXES',
    playlists: 'PLAYLISTS',
    custom: 'CUSTOM',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Catalogus Management</h1>
          <p className="text-white/40 mt-1 text-sm">Beheer je tracks, albums, remixes, playlists en custom instellingen</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-white/[0.1] overflow-x-auto">
          {(['tracks', 'albums', 'remixes', 'playlists', 'custom'] as CatalogueTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-semibold text-sm transition-all relative group whitespace-nowrap ${
                  isActive ? 'text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                <span>{tabLabels[tab]}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            {activeTab === 'tracks' && (
              <button
                onClick={() => openTrackModal(null)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Track</span>
              </button>
            )}
            {activeTab === 'albums' && (
              <button
                onClick={() => openTrackModal(null)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Album / EP</span>
              </button>
            )}
            {activeTab === 'remixes' && (
              <button
                onClick={() => openRemixModal(null)}
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Remix</span>
              </button>
            )}
            {activeTab === 'playlists' && (
              <button
                onClick={() => {
                  setEditingPlaylist(null);
                  setPlaylistEditForm({ name: '', description: '', isPublic: false, isFeatured: false });
                  setShowPlaylistEditModal(true);
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Playlist</span>
              </button>
            )}
            {(activeTab === 'tracks' || activeTab === 'remixes') && (
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={`p-3 rounded-lg border transition-all ${
                    hasActiveFilters
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-white/[0.06] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.12]'
                  }`}
                  title={showFilters ? 'Verberg filters' : 'Toon filters'}
                >
                  <FilterIcon size={20} />
                </button>

                {showFilters && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-black/90 backdrop-blur-xl border border-white/[0.08] rounded-xl p-4 shadow-2xl z-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white">Filters</h3>
                      {hasActiveFilters && (
                        <button onClick={clearAllFilters} className="text-xs text-red-400 hover:text-red-300 transition">
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Type</p>
                        <div className="flex flex-wrap gap-1.5">
                          {['Singles', 'Exclusive'].map((type) => {
                            const actualType = type === 'Singles' ? 'Single' : type;
                            const isActive = selectedTypes.has(actualType);
                            return (
                              <button
                                key={type}
                                onClick={() => toggleTypeFilter(actualType)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  isActive ? 'bg-red-600 text-white' : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.12]'
                                }`}
                              >
                                {type}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Jaar</p>
                        <select
                          value={selectedYear ?? ''}
                          onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-white/[0.06] text-white/60 focus:outline-none"
                        >
                          <option value="">Alle jaren</option>
                          {availableYears.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Status</p>
                        <select
                          value={selectedStatus ?? ''}
                          onChange={(e) => setSelectedStatus(e.target.value || null)}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-white/[0.06] text-white/60 focus:outline-none"
                        >
                          <option value="">Alle statussen</option>
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── TRACKS TAB ── */}
        {activeTab === 'tracks' && (
          <div className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm font-semibold">⚠️ {error}</p>
              </div>
            )}
            <div className="space-y-2">
              {tracksLoading ? (
                <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-12">
                  <LoadingSpinner text="Tracks laden..." />
                </div>
              ) : filteredSingleTracks.length === 0 ? (
                <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-12 text-center text-white/40">
                  Geen tracks gevonden.
                </div>
              ) : (
                filteredSingleTracks.map((track, index) => (
                  <div
                    key={track.id}
                    onClick={() => openTrackModal(track)}
                    className="bg-white/[0.05] border border-white/[0.06] rounded-lg p-4 hover:bg-white/[0.10] transition-all flex items-center gap-3 cursor-pointer"
                  >
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveSingleTrackUp(track.id); }}
                        disabled={index === 0}
                        className="p-0.5 text-white/20 hover:text-white disabled:opacity-0 transition-colors"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveSingleTrackDown(track.id); }}
                        disabled={index === filteredSingleTracks.length - 1}
                        className="p-0.5 text-white/20 hover:text-white disabled:opacity-0 transition-colors"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                    <img
                      src={track.artworkUrl}
                      alt={track.title}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{track.title}</p>
                      <p className="text-xs text-white/40 truncate">{track.artist}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-white/[0.06] text-white/60 rounded flex-shrink-0">
                      {track.type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                      track.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      track.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-white/[0.06] text-white/40'
                    }`}>
                      {track.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── ALBUMS & EP TAB ── */}
        {activeTab === 'albums' && (
          <div className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm font-semibold">⚠️ {error}</p>
              </div>
            )}
            <div className="space-y-3">
              {tracksLoading ? (
                <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-12">
                  <LoadingSpinner text="Albums laden..." />
                </div>
              ) : Object.keys(groupedAlbums).length === 0 ? (
                <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-12 text-center text-white/40">
                  Geen albums of EP's gevonden.
                </div>
              ) : (
                Object.entries(groupedAlbums).map(([albumKey, group], index) => {
                  const isExpanded = expandedAlbums.has(albumKey);
                  const allAlbumNames = Object.keys(groupedAlbums);

                  return (
                    <div key={albumKey} className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden">
                      {/* Album Header */}
                      <div
                        className="px-4 py-4 flex items-center gap-3 hover:bg-white/[0.06] transition-all cursor-pointer"
                        onClick={() => openTrackModal(group.displayTrack)}
                      >
                        {/* Reorder buttons */}
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveAlbumUp(group.albumName); }}
                            disabled={index === 0}
                            className="p-0.5 text-white/20 hover:text-white disabled:opacity-0 transition-colors"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveAlbumDown(group.albumName); }}
                            disabled={index === allAlbumNames.length - 1}
                            className="p-0.5 text-white/20 hover:text-white disabled:opacity-0 transition-colors"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>

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
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleAlbumExpand(albumKey); }}
                          className="p-1 text-white/40 hover:text-white transition-colors flex-shrink-0"
                        >
                          <ChevronDown
                            size={20}
                            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </div>

                      {/* Expanded Track List */}
                      {isExpanded && (
                        <div className="border-t border-white/[0.06]">
                          <table className="w-full">
                            <tbody className="divide-y divide-white/[0.06]">
                              {group.tracks
                                .sort((a: Track, b: Track) => (a.trackNumber || 0) - (b.trackNumber || 0))
                                .map((track: Track, trackIndex: number) => (
                                  <tr
                                    key={track.id}
                                    className="hover:bg-white/[0.06] cursor-pointer"
                                    onClick={() => openTrackModal(track)}
                                  >
                                    <td className="px-6 py-3">
                                      <div className="flex items-center gap-3">
                                        <span className="text-white/40 font-mono w-5 text-right text-sm">{trackIndex + 1}</span>
                                        <div>
                                          <p className="font-medium text-white text-sm">{track.title}</p>
                                          <p className="text-xs text-white/40">{track.artist}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-3">
                                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                        {track.genre}
                                      </span>
                                    </td>
                                    <td className="px-6 py-3">
                                      <span className={`px-2 py-1 rounded text-xs ${
                                        track.status === 'published' ? 'bg-green-500/20 text-green-400' :
                                        track.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-white/[0.06] text-white/40'
                                      }`}>
                                        {track.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── REMIXES TAB ── */}
        {activeTab === 'remixes' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">Remixes</h2>
              <p className="text-white/40 text-sm mt-1">{remixes.length} remix(es)</p>
            </div>
            {remixesLoading ? (
              <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-8">
                <LoadingSpinner text="Remixes laden..." />
              </div>
            ) : remixes.length === 0 ? (
              <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-8 text-center text-white/40">
                Geen remixes gevonden
              </div>
            ) : (
              <div className="space-y-2">
                {remixes.map((remix) => (
                  <div
                    key={remix.id}
                    onClick={() => openRemixModal(remix)}
                    className="bg-white/[0.05] border border-white/[0.06] rounded-lg p-4 hover:bg-white/[0.10] transition-all flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                      <Music size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{remix.title}</p>
                      <p className="text-xs text-white/40 truncate">{remix.originalArtist || 'Unknown Artist'}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-white/[0.06] text-white/60 rounded flex-shrink-0">
                      {remix.remixType}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                      remix.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      remix.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-white/[0.06] text-white/40'
                    }`}>
                      {remix.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PLAYLISTS TAB ── */}
        {activeTab === 'playlists' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">Playlists</h2>
              <p className="text-white/40 text-sm mt-1">{playlists.length} playlist(s)</p>
            </div>
            {playlistsLoading ? (
              <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-8">
                <LoadingSpinner text="Playlists laden..." />
              </div>
            ) : playlists.length === 0 ? (
              <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-8 text-center text-white/40">
                Geen playlists gevonden
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {playlists.map((playlist) => (
                  <div key={playlist.id} className="bg-white/[0.05] border border-white/[0.06] rounded-lg p-4 hover:bg-white/[0.08] transition-all flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm line-clamp-2">{playlist.name}</p>
                        <p className="text-xs text-white/40 mt-1">{playlist.trackIds?.length || 0} tracks</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 line-clamp-2 mb-3">{playlist.description || 'Geen beschrijving'}</p>
                    <div className="flex items-center gap-1 mb-3 flex-wrap">
                      {playlist.isPublic ? (
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded flex items-center gap-1">
                          <Globe size={12} /> Publiek
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-white/[0.06] text-white/60 rounded flex items-center gap-1">
                          <Lock size={12} /> Privé
                        </span>
                      )}
                      {playlist.isFeatured && (
                        <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded flex items-center gap-1">
                          <Star size={12} /> Featured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                      <button
                        onClick={() => handleEditPlaylist(playlist)}
                        className="flex-1 px-2 py-1.5 bg-white/[0.06] text-white/60 hover:text-white text-xs rounded transition-colors"
                      >
                        Bewerken
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Weet je zeker dat je deze playlist wilt verwijderen?')) return;
                          try {
                            await playlistService.deletePlaylist(playlist.id);
                            alert('Playlist verwijderd');
                          } catch (error: any) {
                            alert(error.message);
                          }
                        }}
                        className="px-2 py-1.5 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CUSTOM TAB ── */}
        {activeTab === 'custom' && (
          <div className="space-y-4" id="custom-settings">
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-4">
              {loadingSettings ? (
                <LoadingSpinner text="Instellingen laden..." />
              ) : trackSettings ? (
                <div className="space-y-4">
                  {/* Custom Button 1 */}
                  <div className="p-4 bg-white/[0.06] rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={trackSettings.customTab1Enabled}
                          onChange={(e) => setTrackSettings({ ...trackSettings, customTab1Enabled: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm font-semibold text-white">Custom Groep 1</span>
                      </label>
                      {trackSettings.customTab1Enabled && (
                        <button
                          onClick={() => { setCustomTracksButtonIndex(1); setShowCustomTracksModal(true); }}
                          className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Music size={12} />
                          Tracks beheren ({(trackSettings.customButton1?.trackIds || []).length})
                        </button>
                      )}
                    </div>
                    {trackSettings.customTab1Enabled && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">Label</label>
                          <input
                            type="text"
                            value={trackSettings.customTab1Label || ''}
                            onChange={(e) => setTrackSettings({ ...trackSettings, customTab1Label: e.target.value })}
                            placeholder="bv. Exclusief"
                            className="w-full px-2 py-1.5 rounded bg-white/[0.06] border border-white/[0.06] text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">URL (optioneel)</label>
                          <input
                            type="text"
                            value={trackSettings.customButton1?.url || ''}
                            onChange={(e) => setTrackSettings({
                              ...trackSettings,
                              customButton1: { ...(trackSettings.customButton1 || {}), url: e.target.value }
                            })}
                            placeholder="https://..."
                            className="w-full px-2 py-1.5 rounded bg-white/[0.06] border border-white/[0.06] text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Custom Button 2 */}
                  <div className="p-4 bg-white/[0.06] rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={trackSettings.customTab2Enabled}
                          onChange={(e) => setTrackSettings({ ...trackSettings, customTab2Enabled: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm font-semibold text-white">Custom Groep 2</span>
                      </label>
                      {trackSettings.customTab2Enabled && (
                        <button
                          onClick={() => { setCustomTracksButtonIndex(2); setShowCustomTracksModal(true); }}
                          className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Music size={12} />
                          Tracks beheren ({(trackSettings.customButton2?.trackIds || []).length})
                        </button>
                      )}
                    </div>
                    {trackSettings.customTab2Enabled && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">Label</label>
                          <input
                            type="text"
                            value={trackSettings.customTab2Label || ''}
                            onChange={(e) => setTrackSettings({ ...trackSettings, customTab2Label: e.target.value })}
                            placeholder="bv. Oud werk"
                            className="w-full px-2 py-1.5 rounded bg-white/[0.06] border border-white/[0.06] text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">URL (optioneel)</label>
                          <input
                            type="text"
                            value={trackSettings.customButton2?.url || ''}
                            onChange={(e) => setTrackSettings({
                              ...trackSettings,
                              customButton2: { ...(trackSettings.customButton2 || {}), url: e.target.value }
                            })}
                            placeholder="https://..."
                            className="w-full px-2 py-1.5 rounded bg-white/[0.06] border border-white/[0.06] text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveTrackSettings}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-all text-sm"
                    >
                      <Save size={14} />
                      Opslaan
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-3">
              <p className="text-xs text-blue-300">
                💡 Schakel custom groepen in, geef ze een naam en wijs tracks toe. Ze verschijnen als aparte groepen op de publieke "My Tracks" pagina.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Track/Album Form Modal ── */}
      {showModal && editingContext === 'track' && (
        <TrackFormModal
          key={editingTrack?.id ?? 'new-track'}
          track={editingTrack}
          onClose={closeModal}
          onSave={closeModal}
          onDelete={
            editingTrack
              ? (editingTrack.type === 'Album' || editingTrack.type === 'EP')
                ? () => handleDeleteAlbum(editingTrack)
                : () => handleDeleteTrack(editingTrack.id)
              : undefined
          }
        />
      )}

      {/* ── Remix Form Modal ── */}
      {showModal && editingContext === 'remix' && (
        <RemixFormModal
          key={editingRemix?.id ?? 'new-remix'}
          remix={editingRemix}
          onClose={closeModal}
          onSave={closeModal}
          onDelete={editingRemix ? () => handleDeleteRemix(editingRemix.id) : undefined}
        />
      )}

      {/* ── Playlist Edit Modal ── */}
      {showPlaylistEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPlaylistEditModal(false)} />
          <div className="relative bg-black border border-white/[0.06] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-white/[0.06] px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-white">{editingPlaylist ? 'Playlist bewerken' : 'Playlist aanmaken'}</h2>
              <button onClick={() => setShowPlaylistEditModal(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase mb-2">Naam</label>
                <input value={playlistEditForm.name} onChange={(e) => setPlaylistEditForm({ ...playlistEditForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.08] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase mb-2">Beschrijving</label>
                <textarea value={playlistEditForm.description} onChange={(e) => setPlaylistEditForm({ ...playlistEditForm, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.08] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-purple-500 resize-none" rows={3} />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={playlistEditForm.isPublic} onChange={(e) => setPlaylistEditForm({ ...playlistEditForm, isPublic: e.target.checked })} className="rounded" />
                  <span className="text-xs font-semibold text-white/60">Publiek maken</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={playlistEditForm.isFeatured} onChange={(e) => setPlaylistEditForm({ ...playlistEditForm, isFeatured: e.target.checked })} className="rounded" />
                  <span className="text-xs font-semibold text-white/60">Featured</span>
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={() => setShowPlaylistEditModal(false)} className="flex-1 py-2 rounded-lg bg-white/[0.06] text-white hover:bg-white/[0.12] text-sm font-medium">Annuleren</button>
                <button onClick={handleSavePlaylist} className="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium">Opslaan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Button Tracks Modal ── */}
      {showCustomTracksModal && trackSettings && (
        <CustomButtonTracksModal
          buttonIndex={customTracksButtonIndex}
          buttonLabel={customTracksButtonIndex === 1 ? (trackSettings.customTab1Label || `Groep ${customTracksButtonIndex}`) : (trackSettings.customTab2Label || `Groep ${customTracksButtonIndex}`)}
          allTracks={tracks}
          currentTrackIds={(customTracksButtonIndex === 1 ? trackSettings.customButton1?.trackIds : trackSettings.customButton2?.trackIds) || []}
          onClose={() => setShowCustomTracksModal(false)}
          onSave={(newTrackIds) => {
            const buttonKey = `customButton${customTracksButtonIndex}` as 'customButton1' | 'customButton2';
            const existingButton = trackSettings[buttonKey] || {};
            const newSettings = {
              ...trackSettings,
              [buttonKey]: { ...existingButton, trackIds: newTrackIds },
            };
            setTrackSettings(newSettings);
            settingsService.saveTrackSettings(newSettings)
              .then(() => { setShowCustomTracksModal(false); })
              .catch((err: any) => alert(err.message || 'Fout bij opslaan'));
          }}
        />
      )}
    </AdminLayout>
  );
};

// ============================================================
// Custom Button Tracks Modal
// ============================================================
interface CustomButtonTracksModalProps {
  buttonIndex: 1 | 2;
  buttonLabel: string;
  allTracks: Track[];
  currentTrackIds: string[];
  onClose: () => void;
  onSave: (trackIds: string[]) => void;
}

const CustomButtonTracksModal: React.FC<CustomButtonTracksModalProps> = ({
  buttonLabel, allTracks, currentTrackIds, onClose, onSave
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentTrackIds));
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredTracks = allTracks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.artist.toLowerCase().includes(search.toLowerCase())
  );

  const toggleTrack = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSave = async () => {
    setSaving(true);
    onSave(Array.from(selectedIds));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-black border border-white/[0.08] rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Tracks beheren</h2>
            <p className="text-xs text-white/40 mt-0.5">Groep: {buttonLabel} · {selectedIds.size} geselecteerd</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        <div className="px-5 py-3 border-b border-white/[0.06] flex-shrink-0">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek tracks..."
            className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-blue-500 placeholder-white/30"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
          {filteredTracks.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">Geen tracks gevonden</p>
          ) : (
            filteredTracks.map((track) => {
              const isSelected = selectedIds.has(track.id);
              return (
                <div
                  key={track.id}
                  onClick={() => toggleTrack(track.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-white/[0.04] border border-transparent hover:bg-white/[0.08]'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? 'bg-blue-600' : 'bg-white/[0.08] border border-white/[0.12]'
                  }`}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <img
                    src={track.artworkUrl}
                    alt={track.title}
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{track.title}</p>
                    <p className="text-xs text-white/40 truncate">{track.artist} · {track.type}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/[0.06] flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-white/[0.06] text-white hover:bg-white/[0.12] text-sm font-medium transition-colors">
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Opslaan...' : `Opslaan (${selectedIds.size} tracks)`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Track Form Modal
// ============================================================
interface TrackFormModalProps {
  track: Track | null;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

interface TracklistItem {
  id: string;
  title: string;
  audioUrl: string;
}

const TrackFormModal: React.FC<TrackFormModalProps> = ({ track, onClose, onSave, onDelete }) => {
  const currentYear = new Date().getFullYear();
  const isEditing = !!track;
  const isEditingAlbum = isEditing && (track?.type === 'Album' || track?.type === 'EP');

  const [formData, setFormData] = useState({
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
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { tracks: allTracks } = useTracks();

  useEffect(() => {
    if (isEditingAlbum && track) {
      const albumName = track.album || track.title;
      const albumTracks = allTracks
        .filter(t => t.album === albumName && (t.type === 'Album' || t.type === 'EP'))
        .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0))
        .map((t) => ({ id: t.id, title: t.title, audioUrl: t.audioUrl }));
      setTracklist(albumTracks);
    }
  }, [isEditingAlbum, track?.album, track?.title, allTracks]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePreview = () => {
    const url = formData.audioUrl;
    if (!url) return;

    if (previewPlaying && audioRef.current) {
      audioRef.current.pause();
      setPreviewPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => {});
    audio.onended = () => setPreviewPlaying(false);
    setPreviewPlaying(true);
  };

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
          basic: { type: 'basic' as const, price: 9, features: ['MP3 Download', 'Non-exclusive rights', 'Personal use'], downloads: 1, streams: 10000, videos: 1, distribution: false },
          premium: { type: 'premium' as const, price: 19, features: ['WAV + MP3', 'Non-exclusive rights', 'Commercial use', 'Unlimited streams'], downloads: 5, streams: 1000000, videos: 5, distribution: true },
          exclusive: { type: 'exclusive' as const, price: 99, features: ['All files', 'Exclusive rights', 'Full ownership', 'Unlimited use'], downloads: -1, streams: -1, videos: -1, distribution: true },
        },
      };

      if ((formData.type === 'Album' || formData.type === 'EP') && tracklist.length > 0) {
        const albumName = formData.title.trim();
        if (!albumName) throw new Error('Album naam is verplicht');

        if (isEditingAlbum) {
          const existingTrackIds = allTracks
            .filter(t => t.album === track?.album)
            .map(t => t.id);

          for (let i = 0; i < tracklist.length; i++) {
            const item = tracklist[i];
            const trackData = { ...baseTrackData, title: item.title, audioUrl: item.audioUrl, album: albumName, trackNumber: i + 1 };
            if (item.id && existingTrackIds.includes(item.id)) {
              await trackService.updateTrack(item.id, trackData);
              existingTrackIds.splice(existingTrackIds.indexOf(item.id), 1);
            } else {
              await trackService.createTrack(trackData);
            }
          }
          for (const deletedId of existingTrackIds) {
            await trackService.deleteTrack(deletedId);
          }
          alert(`${formData.type} bijgewerkt met ${tracklist.length} tracks`);
        } else {
          for (let i = 0; i < tracklist.length; i++) {
            const item = tracklist[i];
            await trackService.createTrack({ ...baseTrackData, title: item.title, audioUrl: item.audioUrl, album: albumName, trackNumber: i + 1 });
          }
          alert(`${tracklist.length} tracks aangemaakt in "${albumName}"`);
        }
      } else if (track) {
        await trackService.updateTrack(track.id, { ...baseTrackData, audioUrl: formData.audioUrl });
        alert('Track bijgewerkt');
      } else {
        await trackService.createTrack({ ...baseTrackData, audioUrl: formData.audioUrl });
        alert('Track aangemaakt');
      }

      onSave();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const addTrackToList = () => {
    setTracklist([...tracklist, { id: Date.now().toString(), title: '', audioUrl: '' }]);
  };

  const removeTrackFromList = (id: string) => {
    setTracklist(tracklist.filter((t) => t.id !== id));
  };

  const updateTrackInList = (id: string, field: string, value: string) => {
    if (field === 'audioUrl') value = toDirectUrl(value);
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

  const isAlbumOrEP = formData.type === 'Album' || formData.type === 'EP';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto p-4">
      <div className="bg-white/[0.10] backdrop-blur-2xl border border-white/[0.10] rounded-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {isEditing
              ? isEditingAlbum ? 'Album / EP bewerken' : 'Track bewerken'
              : isAlbumOrEP ? 'Nieuw Album / EP' : 'Nieuw Track'}
          </h2>
          <div className="flex items-center gap-2">
            {/* Play preview button - only for single tracks with audio url */}
            {!isAlbumOrEP && formData.audioUrl && (
              <button
                type="button"
                onClick={togglePreview}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  previewPlaying ? 'bg-purple-600 text-white' : 'bg-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                {previewPlaying ? <Pause size={14} /> : <Play size={14} />}
                {previewPlaying ? 'Stop' : 'Preview'}
              </button>
            )}
            {/* Delete button */}
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-all"
              >
                <Trash2 size={14} />
                Verwijderen
              </button>
            )}
            <button type="button" onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                {isAlbumOrEP ? 'Album Naam' : 'Titel'} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                placeholder={isAlbumOrEP ? 'bv. "IF Album"' : 'Track titel'}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Artiest <span className="text-red-400">*</span></label>
              <input type="text" value={formData.artist} onChange={(e) => setFormData({ ...formData, artist: e.target.value })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Type <span className="text-red-400">*</span></label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as Track['type'] })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" required>
                <option value="Single">Single</option>
                <option value="EP">EP</option>
                <option value="Album">Album</option>
                <option value="Exclusive">Exclusive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Jaar <span className="text-red-400">*</span></label>
              <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Collab <span className="text-red-400">*</span></label>
              <select value={formData.collab} onChange={(e) => setFormData({ ...formData, collab: e.target.value as 'Solo' | 'Collab' })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" required>
                <option value="Solo">Solo</option>
                <option value="Collab">Collab</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Genre <span className="text-red-400">*</span></label>
              <input type="text" value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Duur</label>
              <input type="text" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" placeholder="bv. 3:45" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Track['status'] })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Tags (komma-gescheiden)</label>
            <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" placeholder="electronic, remix, bootleg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Slug</label>
            <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" placeholder="auto-gegenereerd van titel" />
          </div>

          {/* Audio + Artwork for single tracks */}
          {!isAlbumOrEP && (
            <div className="grid grid-cols-2 gap-4">
              <LinkInput label="Audio URL" name="audioUrl" type="audio" onChange={(url) => setFormData({ ...formData, audioUrl: url })} defaultValue={formData.audioUrl} placeholder="https://nextcloud.example.com/..." />
              <LinkInput label="Artwork URL" name="artworkUrl" type="image" onChange={(url) => setFormData({ ...formData, artworkUrl: url })} defaultValue={formData.artworkUrl} placeholder="https://example.com/image.jpg" />
            </div>
          )}

          {/* Artwork for albums */}
          {isAlbumOrEP && (
            <LinkInput label="Album Cover URL" name="artworkUrl" type="image" onChange={(url) => setFormData({ ...formData, artworkUrl: url })} defaultValue={formData.artworkUrl} placeholder="https://example.com/image.jpg" />
          )}

          {/* Tracklist for albums */}
          {isAlbumOrEP && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white/60">Tracks</label>
                <button
                  type="button"
                  onClick={addTrackToList}
                  disabled={!formData.title.trim()}
                  className="px-3 py-1 bg-white/[0.10] hover:bg-white/[0.15] disabled:opacity-50 text-white/70 text-sm rounded transition-all"
                >
                  + Track toevoegen
                </button>
              </div>
              {!formData.title.trim() && (
                <p className="text-xs text-red-400/60">Voer eerst de album naam in</p>
              )}
              <div className="space-y-3 bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                {tracklist.length === 0 ? (
                  <p className="text-white/40 text-sm">Nog geen tracks toegevoegd</p>
                ) : (
                  tracklist.map((item, index) => {
                    const transformedUrl = toDirectUrl(item.audioUrl);
                    const wasTransformed = item.audioUrl && item.audioUrl !== transformedUrl;
                    const isValidAudioUrl = !item.audioUrl || isValidUrl(item.audioUrl);
                    const urlType = detectUrlType(item.audioUrl);

                    const getUrlTypeLabel = () => {
                      if (!item.audioUrl) return '';
                      switch (urlType) {
                        case 'nextcloud': return 'Nextcloud/ownCloud';
                        case 'firebase': return 'Firebase Storage';
                        default: return 'Direct URL';
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
                            <button type="button" onClick={() => moveTrackUp(item.id)} disabled={index === 0} className="p-1 text-white/40 hover:text-white disabled:opacity-30 transition-colors"><ArrowUp size={16} /></button>
                            <button type="button" onClick={() => moveTrackDown(item.id)} disabled={index === tracklist.length - 1} className="p-1 text-white/40 hover:text-white disabled:opacity-30 transition-colors"><ArrowDown size={16} /></button>
                            <button type="button" onClick={() => removeTrackFromList(item.id)} className="p-1 text-red-400 hover:text-red-300 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </div>
                        <input
                          type="text"
                          placeholder="Track Titel"
                          value={item.title}
                          onChange={(e) => updateTrackInList(item.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded text-white text-sm"
                        />
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Audio URL"
                            value={item.audioUrl}
                            onChange={(e) => updateTrackInList(item.id, 'audioUrl', e.target.value)}
                            className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded text-white text-sm"
                          />
                          {item.audioUrl && isValidAudioUrl && (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-white/40">Type:</span>
                                <span className="text-xs bg-white/[0.08] text-white/60 px-2 py-1 rounded">{getUrlTypeLabel()}</span>
                              </div>
                              {wasTransformed && (
                                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2">
                                  <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-amber-400">
                                    Ontbrekende <code className="bg-black/30 px-1 rounded">/download</code> — wordt automatisch toegevoegd
                                  </p>
                                </div>
                              )}
                              <div className="bg-white/[0.04] border border-white/[0.08] rounded px-3 py-2">
                                <p className="text-xs text-white/40 mb-1">Uiteindelijke URL:</p>
                                <p className="text-xs text-white break-all font-mono">{transformedUrl}</p>
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
            <label className="block text-sm font-medium text-white/60 mb-2">Beschrijving (optioneel)</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/[0.2]" rows={3} placeholder="Beschrijving..." />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm text-white/60">Featured</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={formData.isFree} onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm text-white/60">Gratis download</span>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/[0.06]">
            <button type="button" onClick={onClose} className="px-6 py-2 text-white/40 hover:text-white transition-colors">
              Annuleren
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                (isAlbumOrEP && (tracklist.length === 0 || tracklist.some((t) => !t.title || !t.audioUrl)))
              }
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Opslaan...' : isEditing ? 'Bijwerken' : isAlbumOrEP ? `${formData.type} aanmaken` : 'Track aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// Remix Form Modal
// ============================================================
interface RemixFormModalProps {
  remix: Remix | null;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

const RemixFormModal: React.FC<RemixFormModalProps> = ({ remix, onClose, onSave, onDelete }) => {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    title: remix?.title || '',
    remixArtist: remix?.remixArtist || 'Jonna Rincon',
    originalArtist: remix?.originalArtist || '',
    originalTrackTitle: remix?.originalTrackTitle || '',
    genre: remix?.genre || '',
    remixType: remix?.remixType || 'Remix',
    year: remix?.year || currentYear,
    collab: remix?.collab || 'Solo',
    duration: remix?.duration || '0:00',
    tags: remix?.tags?.join(', ') || '',
    audioUrl: remix?.audioUrl || '',
    artworkUrl: remix?.artworkUrl || '',
    slug: remix?.slug || '',
    status: remix?.status || 'draft',
    featured: remix?.featured || false,
    isFree: remix?.isFree || false,
  });
  const [saving, setSaving] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePreview = () => {
    const url = formData.audioUrl;
    if (!url) return;
    if (previewPlaying && audioRef.current) {
      audioRef.current.pause();
      setPreviewPlaying(false);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => {});
    audio.onended = () => setPreviewPlaying(false);
    setPreviewPlaying(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const remixData: any = {
        title: formData.title,
        remixArtist: formData.remixArtist,
        originalArtist: formData.originalArtist,
        originalTrackTitle: formData.originalTrackTitle,
        genre: formData.genre,
        remixType: formData.remixType,
        year: formData.year,
        collab: formData.collab,
        duration: formData.duration,
        tags: formData.tags.split(',').map((t) => t.trim()),
        audioUrl: formData.audioUrl,
        artworkUrl: formData.artworkUrl,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        status: formData.status,
        featured: formData.featured,
        isFree: formData.isFree,
        licenses: {
          basic: { type: 'basic' as const, price: 9, features: ['MP3 Download', 'Non-exclusive rights', 'Personal use'], downloads: 1, streams: 10000, videos: 1, distribution: false },
          premium: { type: 'premium' as const, price: 19, features: ['WAV + MP3', 'Non-exclusive rights', 'Commercial use', 'Unlimited streams'], downloads: 5, streams: 1000000, videos: 5, distribution: true },
          exclusive: { type: 'exclusive' as const, price: 99, features: ['All files', 'Exclusive rights', 'Full ownership', 'Unlimited use'], downloads: -1, streams: -1, videos: -1, distribution: true },
        },
      };

      if (remix) {
        await remixService.updateRemix(remix.id, remixData);
        alert('Remix bijgewerkt');
      } else {
        await remixService.createRemix(remixData);
        alert('Remix aangemaakt');
      }
      onSave();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto p-4">
      <div className="bg-white/[0.10] backdrop-blur-2xl border border-white/[0.10] rounded-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {remix ? 'Remix bewerken' : 'Nieuwe Remix'}
          </h2>
          <div className="flex items-center gap-2">
            {formData.audioUrl && (
              <button
                type="button"
                onClick={togglePreview}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  previewPlaying ? 'bg-purple-600 text-white' : 'bg-white/[0.08] text-white/60 hover:text-white'
                }`}
              >
                {previewPlaying ? <Pause size={14} /> : <Play size={14} />}
                {previewPlaying ? 'Stop' : 'Preview'}
              </button>
            )}
            {remix && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-all"
              >
                <Trash2 size={14} />
                Verwijderen
              </button>
            )}
            <button type="button" onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Titel <span className="text-red-400">*</span></label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Remix Artiest <span className="text-red-400">*</span></label>
              <input type="text" value={formData.remixArtist} onChange={(e) => setFormData({ ...formData, remixArtist: e.target.value })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Originele Artiest <span className="text-red-400">*</span></label>
              <input type="text" value={formData.originalArtist} onChange={(e) => setFormData({ ...formData, originalArtist: e.target.value })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Originele Track Titel</label>
              <input type="text" value={formData.originalTrackTitle} onChange={(e) => setFormData({ ...formData, originalTrackTitle: e.target.value })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Type <span className="text-red-400">*</span></label>
              <select value={formData.remixType} onChange={(e) => setFormData({ ...formData, remixType: e.target.value as 'Remix' | 'Edit' | 'Bootleg' })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" required>
                <option value="Remix">Remix</option>
                <option value="Edit">Edit</option>
                <option value="Bootleg">Bootleg</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Jaar <span className="text-red-400">*</span></label>
              <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Collab <span className="text-red-400">*</span></label>
              <select value={formData.collab} onChange={(e) => setFormData({ ...formData, collab: e.target.value as 'Solo' | 'Collab' })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" required>
                <option value="Solo">Solo</option>
                <option value="Collab">Collab</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Genre <span className="text-red-400">*</span></label>
              <input type="text" value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Duur</label>
              <input type="text" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" placeholder="bv. 3:45" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Remix['status'] })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Tags (komma-gescheiden)</label>
            <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" placeholder="electronic, remix, bootleg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Slug</label>
            <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" placeholder="auto-gegenereerd van titel" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LinkInput label="Audio URL" name="audioUrl" type="audio" onChange={(url) => setFormData({ ...formData, audioUrl: url })} defaultValue={formData.audioUrl} placeholder="https://nextcloud.example.com/..." />
            <LinkInput label="Artwork URL" name="artworkUrl" type="image" onChange={(url) => setFormData({ ...formData, artworkUrl: url })} defaultValue={formData.artworkUrl} placeholder="https://example.com/image.jpg" />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm text-white/60">Featured</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={formData.isFree} onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm text-white/60">Gratis download</span>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/[0.06]">
            <button type="button" onClick={onClose} className="px-6 py-2 text-white/40 hover:text-white transition-colors">
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Opslaan...' : remix ? 'Remix bijwerken' : 'Remix aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TracksPage;
