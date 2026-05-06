import React, { useState, useEffect, useRef } from 'react';
import { Music, Disc3, Headphones, Plus, ListMusic, ChevronDown, Library } from 'lucide-react';
import { playlistService } from '../lib/firebase/services';
import { Playlist } from '../lib/firebase/types';
import { useAuth } from '../hooks/useAuth';

interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  cover?: string;
}

interface CatalogueSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  trackSettings: any;
  onCreatePlaylist?: () => void;
  onPlaylistSelect?: (playlist: Playlist) => void;
}

export default function CatalogueNavBar({
  activeTab,
  onTabChange,
  trackSettings,
  onCreatePlaylist,
  onPlaylistSelect,
}: CatalogueSidebarProps) {
  const { user, isAuthenticated } = useAuth();
  const [adminPlaylists, setAdminPlaylists] = useState<Playlist[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [playlistDropdownOpen, setPlaylistDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const coreItems: SidebarNavItem[] = [
    { id: 'tracks', label: 'Tracks', icon: <Music size={16} /> },
    { id: 'remixes', label: 'Remixes', icon: <Disc3 size={16} /> },
    { id: 'djsets', label: 'DJ Sets', icon: <Headphones size={16} /> },
  ];

  if (trackSettings?.customTab1Enabled) {
    coreItems.push({
      id: 'custom1',
      label: trackSettings.customTab1Label || 'Custom 1',
      icon: trackSettings.customButton1?.icon
        ? <img src={trackSettings.customButton1.icon} alt="" className="w-4 h-4 rounded object-cover" />
        : <ListMusic size={16} />,
      cover: trackSettings.customButton1?.coverImage,
    });
  }

  if (trackSettings?.customTab2Enabled) {
    coreItems.push({
      id: 'custom2',
      label: trackSettings.customTab2Label || 'Custom 2',
      icon: trackSettings.customButton2?.icon
        ? <img src={trackSettings.customButton2.icon} alt="" className="w-4 h-4 rounded object-cover" />
        : <ListMusic size={16} />,
      cover: trackSettings.customButton2?.coverImage,
    });
  }

  const hasPlaylists = adminPlaylists.length > 0 || (isAuthenticated && userPlaylists.length > 0);

  return (
    <div className="w-full px-6 md:px-12 mb-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 flex-wrap bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl px-3 py-2.5 shadow-lg shadow-black/30">

          {/* Core navigation tabs */}
          <div className="flex items-center gap-1 flex-1 flex-wrap">
            {coreItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/40'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {item.cover ? (
                    <img src={item.cover} alt={item.label} className="w-4 h-4 rounded object-cover" />
                  ) : (
                    <span className={isActive ? 'text-white' : 'text-white/50'}>{item.icon}</span>
                  )}
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/[0.08] flex-shrink-0" />

          {/* Right actions: playlists + create */}
          <div className="flex items-center gap-1.5 flex-shrink-0" ref={dropdownRef}>
            {/* Playlist dropdown */}
            {hasPlaylists && (
              <div className="relative">
                <button
                  onClick={() => setPlaylistDropdownOpen(o => !o)}
                  title="Bibliotheek"
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    playlistDropdownOpen
                      ? 'bg-white/[0.10] text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <Library size={15} />
                  <span className="hidden sm:inline">Bibliotheek</span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform ${playlistDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {playlistDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900/90 backdrop-blur-2xl border border-white/[0.10] rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
                    {/* Admin playlists */}
                    {adminPlaylists.length > 0 && (
                      <div className="p-2">
                        <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 font-bold px-2 py-1.5">
                          Aanbevolen
                        </p>
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

                    {/* Divider between sections */}
                    {adminPlaylists.length > 0 && isAuthenticated && userPlaylists.length > 0 && (
                      <div className="mx-3 border-t border-white/[0.06]" />
                    )}

                    {/* User playlists */}
                    {isAuthenticated && userPlaylists.length > 0 && (
                      <div className="p-2">
                        <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 font-bold px-2 py-1.5">
                          Mijn Playlists
                        </p>
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

            {/* Create playlist */}
            {isAuthenticated && (
              <button
                onClick={onCreatePlaylist}
                title="Playlist aanmaken"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white/50 hover:text-white hover:bg-white/[0.08] transition-all border border-white/[0.06] hover:border-red-500/30"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Aanmaken</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
