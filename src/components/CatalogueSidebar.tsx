import React, { useState, useEffect } from 'react';
import { Music, Disc3, Headphones, Plus, ChevronRight, ChevronLeft, ListMusic } from 'lucide-react';
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

export default function CatalogueSidebar({
  activeTab,
  onTabChange,
  trackSettings,
  onCreatePlaylist,
  onPlaylistSelect,
}: CatalogueSidebarProps) {
  const { user, isAuthenticated } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [adminPlaylists, setAdminPlaylists] = useState<Playlist[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);

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

  const coreItems: SidebarNavItem[] = [
    { id: 'tracks', label: 'Tracks', icon: <Music size={18} /> },
    { id: 'remixes', label: 'Remixes', icon: <Disc3 size={18} /> },
    { id: 'djsets', label: 'DJ Sets', icon: <Headphones size={18} /> },
  ];

  if (trackSettings?.customTab1Enabled) {
    coreItems.push({
      id: 'custom1',
      label: trackSettings.customTab1Label || 'Custom 1',
      icon: trackSettings.customButton1?.icon
        ? <img src={trackSettings.customButton1.icon} alt="" className="w-5 h-5 rounded object-cover" />
        : <ListMusic size={18} />,
      cover: trackSettings.customButton1?.coverImage,
    });
  }

  if (trackSettings?.customTab2Enabled) {
    coreItems.push({
      id: 'custom2',
      label: trackSettings.customTab2Label || 'Custom 2',
      icon: trackSettings.customButton2?.icon
        ? <img src={trackSettings.customButton2.icon} alt="" className="w-5 h-5 rounded object-cover" />
        : <ListMusic size={18} />,
      cover: trackSettings.customButton2?.coverImage,
    });
  }

  const sidebarW = expanded ? 'w-56' : 'w-14';

  return (
    <div
      className={`fixed right-0 top-0 h-full z-40 flex flex-col bg-black/80 backdrop-blur-xl border-l border-white/[0.08] transition-all duration-300 ${sidebarW}`}
      style={{ paddingTop: '64px' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-2 py-3 border-b border-white/[0.06]">
        {expanded && (
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold pl-1 truncate">
            Bibliotheek
          </span>
        )}
        <div className={`flex items-center gap-1 ${expanded ? '' : 'w-full justify-center'}`}>
          {expanded && isAuthenticated && (
            <button
              onClick={onCreatePlaylist}
              title="Playlist aanmaken"
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <Plus size={15} />
            </button>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            title={expanded ? 'Samenvouwen' : 'Uitvouwen'}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            {expanded ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        {/* Core navigation items */}
        <div className="space-y-0.5 px-1.5">
          {coreItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all text-left ${
                  isActive
                    ? 'bg-red-600/20 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {item.cover ? (
                  <img src={item.cover} alt={item.label} className="w-5 h-5 rounded object-cover flex-shrink-0" />
                ) : (
                  <span className={`flex-shrink-0 ${isActive ? 'text-red-400' : ''}`}>{item.icon}</span>
                )}
                {expanded && (
                  <span className="text-xs font-semibold truncate uppercase tracking-wide">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Admin public playlists */}
        {adminPlaylists.length > 0 && (
          <div className="mt-4 px-1.5">
            {expanded && (
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-bold px-2 mb-1">Aanbevolen</p>
            )}
            <div className="space-y-0.5">
              {adminPlaylists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => onPlaylistSelect?.(pl)}
                  title={pl.name}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-all text-left"
                >
                  {pl.coverImage ? (
                    <img src={pl.coverImage} alt={pl.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                      <Music size={14} className="text-white/30" />
                    </div>
                  )}
                  {expanded && (
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-white/80">{pl.name}</p>
                      <p className="text-[10px] text-white/30 truncate">Playlist</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User playlists */}
        {isAuthenticated && userPlaylists.length > 0 && (
          <div className="mt-4 px-1.5">
            {expanded && (
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-bold px-2 mb-1">Mijn Playlists</p>
            )}
            <div className="space-y-0.5">
              {userPlaylists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => onPlaylistSelect?.(pl)}
                  title={pl.name}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-all text-left"
                >
                  {pl.coverImage ? (
                    <img src={pl.coverImage} alt={pl.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                      <Music size={14} className="text-white/30" />
                    </div>
                  )}
                  {expanded && (
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-white/80">{pl.name}</p>
                      <p className="text-[10px] text-white/30 truncate">Jouw playlist</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
