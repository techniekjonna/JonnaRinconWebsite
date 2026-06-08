import React, { useState, useEffect, useRef } from 'react';
import { Music, Disc3, Headphones, Plus, ListMusic, ChevronDown, Library, Sliders, Shuffle, Layers } from 'lucide-react';
import { playlistService } from '../lib/firebase/services';
import { Playlist } from '../lib/firebase/types';
import { useAuth } from '../hooks/useAuth';

interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface CatalogueSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreatePlaylist?: () => void;
  onPlaylistSelect?: (playlist: Playlist) => void;
  onFilterClick?: () => void;
  onShuffleClick?: () => void;
  isShuffleActive?: boolean;
}

const coreItems: SidebarNavItem[] = [
  { id: 'all', label: 'All', icon: <ListMusic size={15} /> },
  { id: 'tracks', label: 'Tracks', icon: <Music size={15} /> },
  { id: 'albums', label: "Albums/EP's", icon: <Layers size={15} /> },
  { id: 'remixes', label: 'Remixes', icon: <Disc3 size={15} /> },
  { id: 'djsets', label: 'DJ Sets', icon: <Headphones size={15} /> },
];

export default function CatalogueNavBar({
  activeTab,
  onTabChange,
  onCreatePlaylist,
  onPlaylistSelect,
  onFilterClick,
  onShuffleClick,
  isShuffleActive = false,
}: CatalogueSidebarProps) {
  const { user, isAuthenticated } = useAuth();
  const [adminPlaylists, setAdminPlaylists] = useState<Playlist[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [playlistDropdownOpen, setPlaylistDropdownOpen] = useState(false);
  const [musicDropdownOpen, setMusicDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const musicDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    playlistService.getPublicPlaylists().then(setAdminPlaylists).catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      playlistService.getPlaylistsByUserId(user.uid).then(setUserPlaylists).catch(() => {});
    } else {
      setUserPlaylists([]);
    }
  }, [isAuthenticated, user?.uid]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPlaylistDropdownOpen(false);
      }
      if (musicDropdownRef.current && !musicDropdownRef.current.contains(e.target as Node)) {
        setMusicDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeItem = coreItems.find(i => i.id === activeTab) || coreItems[0];
  const hasPlaylists = adminPlaylists.length > 0 || (isAuthenticated && userPlaylists.length > 0);
  const showFilterShuffle = activeTab !== 'djsets';

  return (
    <div className="w-full px-4 sm:px-6 md:px-12 mb-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl px-3 py-2.5 shadow-lg shadow-black/30">

          {/* ── Mobile: compact music dropdown ── */}
          <div className="sm:hidden flex-1" ref={musicDropdownRef}>
            <div className="relative">
              <button
                onClick={() => setMusicDropdownOpen(o => !o)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  musicDropdownOpen ? 'bg-white/[0.10] text-white' : 'text-white/70 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <span className="text-red-400">{activeItem.icon}</span>
                <span className="text-white">{activeItem.label}</span>
                <ChevronDown size={12} className={`text-white/40 transition-transform ${musicDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {musicDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-44 bg-gray-900/95 backdrop-blur-2xl border border-white/[0.10] rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden p-1.5">
                  {coreItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { onTabChange(item.id); setMusicDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                        activeTab === item.id
                          ? 'bg-red-600 text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Desktop: all tabs visible ── */}
          <div className="hidden sm:flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none">
            {coreItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/40'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-white/50'}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/[0.08] flex-shrink-0 mx-0.5" />

          {/* Filter + Shuffle group */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {onFilterClick && (
              <button
                onClick={showFilterShuffle ? onFilterClick : undefined}
                title={showFilterShuffle ? 'Filters' : undefined}
                disabled={!showFilterShuffle}
                className={`flex items-center justify-center w-9 h-9 bg-white/[0.05] border border-white/[0.08] rounded-xl transition-all ${
                  showFilterShuffle
                    ? 'text-white/50 hover:text-white hover:bg-white/[0.10] cursor-pointer'
                    : 'text-white/20 opacity-25 cursor-default'
                }`}
              >
                <Sliders size={14} />
              </button>
            )}
            {onShuffleClick && (
              <button
                onClick={showFilterShuffle ? onShuffleClick : undefined}
                title={showFilterShuffle ? 'Shuffle' : undefined}
                disabled={!showFilterShuffle}
                className={`flex items-center justify-center w-9 h-9 border rounded-xl transition-all ${
                  !showFilterShuffle
                    ? 'bg-white/[0.05] border-white/[0.08] text-white/20 opacity-25 cursor-default'
                    : isShuffleActive
                      ? 'bg-red-600/20 border-red-500/40 text-red-400 hover:bg-red-600/30 cursor-pointer'
                      : 'bg-white/[0.05] border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.10] cursor-pointer'
                }`}
              >
                <Shuffle size={14} />
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/[0.08] flex-shrink-0 mx-0.5" />

          {/* Library + Create */}
          <div className="flex items-center gap-1 flex-shrink-0" ref={dropdownRef}>
            {hasPlaylists && (
              <div className="relative">
                <button
                  onClick={() => setPlaylistDropdownOpen(o => !o)}
                  title="Bibliotheek"
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    playlistDropdownOpen
                      ? 'bg-white/[0.10] text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <Library size={14} />
                  <span className="hidden sm:inline text-[10px]">Bibliotheek</span>
                  <ChevronDown size={11} className={`transition-transform ${playlistDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {playlistDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900/90 backdrop-blur-2xl border border-white/[0.10] rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
                    {adminPlaylists.length > 0 && (
                      <div className="p-2">
                        <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 font-bold px-2 py-1.5">Aanbevolen</p>
                        {adminPlaylists.map(pl => (
                          <button
                            key={pl.id}
                            onClick={() => { onPlaylistSelect?.(pl); setPlaylistDropdownOpen(false); }}
                            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.08] transition-all text-left"
                          >
                            {pl.coverImage ? (
                              <img src={pl.coverImage} alt={pl.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                                <Music size={14} className="text-white/30" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate text-white/90">{pl.name}</p>
                              <p className="text-[10px] text-white/30">Playlist</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {adminPlaylists.length > 0 && isAuthenticated && userPlaylists.length > 0 && (
                      <div className="mx-3 border-t border-white/[0.06]" />
                    )}

                    {isAuthenticated && userPlaylists.length > 0 && (
                      <div className="p-2">
                        <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 font-bold px-2 py-1.5">Mijn Playlists</p>
                        {userPlaylists.map(pl => (
                          <button
                            key={pl.id}
                            onClick={() => { onPlaylistSelect?.(pl); setPlaylistDropdownOpen(false); }}
                            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.08] transition-all text-left"
                          >
                            {pl.coverImage ? (
                              <img src={pl.coverImage} alt={pl.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                                <Music size={14} className="text-red-400/60" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate text-white/90">{pl.name}</p>
                              <p className="text-[10px] text-white/30">Jouw playlist</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isAuthenticated && (
              <button
                onClick={onCreatePlaylist}
                title="Playlist aanmaken"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white/50 hover:text-white hover:bg-white/[0.08] transition-all border border-white/[0.06] hover:border-red-500/30"
              >
                <Plus size={14} />
                <span className="hidden sm:inline text-[10px]">Aanmaken</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
