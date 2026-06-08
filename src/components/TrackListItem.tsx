import React, { useState, useEffect } from 'react';
import { Music, Play, Pause, Download } from 'lucide-react';
import { getCurrentTrack, getIsPlaying, setCurrentTrack, togglePlayPause, subscribeToPlayerState } from './GlobalAudioPlayer';

interface TrackListItemProps {
  track: any;
  onClickTrack?: (track: any) => void;
  onPlay?: (track: any) => void;
  onTogglePlay?: (track: any) => void;
  onBuy?: (track: any) => void;
  onDownload?: (track: any) => void;
  onCoverClick?: (track: any) => void;
  allTracks?: any[];
  showType?: boolean;
  showYear?: boolean;
  showGenre?: boolean;
  showBPM?: boolean;
  showMetadata?: boolean;
  isAlbumTrack?: boolean;
  trackNumber?: number;
  isPlaying?: boolean;
  showDownload?: boolean;
  showCover?: boolean;
  showPlayButton?: boolean;
  showAlbumPlayButton?: boolean;
}

export default function TrackListItem({
  track,
  onClickTrack,
  onPlay,
  onTogglePlay,
  onBuy,
  onDownload,
  onCoverClick,
  allTracks = [],
  showType = true,
  showMetadata = false,
  isAlbumTrack = false,
  trackNumber,
  isPlaying = false,
  showDownload = false,
  showCover = true,
  showPlayButton = true,
  showAlbumPlayButton = true,
}: TrackListItemProps) {
  const [, setPlayerState] = useState({});
  const [hovered, setHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToPlayerState(() => setPlayerState({}));
    return unsubscribe;
  }, []);

  const currentTrack = getCurrentTrack();
  const isCurrentTrack = currentTrack?.id === track.id;
  const globalIsPlaying = getIsPlaying();
  const actualIsPlaying = isCurrentTrack ? globalIsPlaying : false;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentTrack) {
      togglePlayPause();
    } else if (onTogglePlay) {
      onTogglePlay(track);
    } else if (allTracks && allTracks.length > 0) {
      setCurrentTrack(track, allTracks);
    } else {
      setCurrentTrack(track, [track]);
    }
  };

  const handleCoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCoverClick) {
      onCoverClick(track);
    } else {
      handlePlayClick(e);
    }
  };

  const metaItems: { label: string; value: string; color?: string }[] = [];
  if (track.genre) metaItems.push({ label: 'genre', value: track.genre, color: 'text-purple-300' });
  if (track.year) metaItems.push({ label: 'year', value: String(track.year) });
  if (showType && track.type) metaItems.push({ label: 'type', value: track.type, color: isCurrentTrack ? 'text-red-400' : undefined });

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-default group ${
        isCurrentTrack
          ? 'bg-white/[0.06]'
          : 'hover:bg-white/[0.05]'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Track number / play toggle — desktop hover shows play, mobile hidden */}
      {!isAlbumTrack && (
        <div className="w-7 flex-shrink-0 flex items-center justify-center">
          {/* Desktop: show number normally, play on hover */}
          <span className="hidden md:flex items-center justify-center w-full h-full">
            {(hovered || (isCurrentTrack && actualIsPlaying)) ? (
              <button
                onClick={handlePlayClick}
                className="text-white hover:text-red-400 transition-colors"
                title={actualIsPlaying ? 'Pause' : 'Play'}
              >
                {isCurrentTrack && actualIsPlaying ? (
                  <Pause size={14} fill="currentColor" />
                ) : (
                  <Play size={14} fill="currentColor" />
                )}
              </button>
            ) : (
              <span className={`text-xs font-mono ${isCurrentTrack ? 'text-red-400' : 'text-white/30'}`}>
                {trackNumber ?? ''}
              </span>
            )}
          </span>
          {/* Mobile: always show number */}
          <span className="md:hidden text-xs font-mono text-white/30">
            {trackNumber ?? ''}
          </span>
        </div>
      )}

      {/* Cover art */}
      {showCover && (
        <div
          className="relative flex-shrink-0 w-10 h-10 rounded bg-white/[0.08] overflow-hidden cursor-pointer"
          onClick={handleCoverClick}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Music size={16} className="text-white/30" />
          </div>
          {track.coverArt && (
            <img
              src={track.coverArt}
              alt={track.title}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
          {/* Mobile play overlay on cover */}
          <div className="md:hidden absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 active:opacity-100 transition-opacity">
            {isCurrentTrack && actualIsPlaying ? (
              <Pause size={14} className="text-white" fill="currentColor" />
            ) : (
              <Play size={14} className="text-white ml-0.5" fill="currentColor" />
            )}
          </div>
        </div>
      )}

      {/* Album track: play button left of info */}
      {isAlbumTrack && showPlayButton && showAlbumPlayButton && (
        <button
          onClick={handlePlayClick}
          className="flex-shrink-0 p-1 rounded hover:bg-white/[0.1] transition-all text-white/50 hover:text-white"
          title={isCurrentTrack && actualIsPlaying ? 'Pause' : 'Play'}
        >
          {isCurrentTrack && actualIsPlaying ? (
            <Pause size={13} fill="currentColor" className="text-red-400" />
          ) : (
            <Play size={13} fill="currentColor" />
          )}
        </button>
      )}

      {/* Title + Artist stacked */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onClickTrack?.(track)}
      >
        <p className={`text-sm font-semibold truncate leading-tight ${isCurrentTrack ? 'text-red-400' : 'text-white'}`}>
          {isAlbumTrack && trackNumber ? `${trackNumber}. ` : ''}{track.title}
        </p>
        <p className="text-xs text-white/40 truncate leading-tight mt-0.5">{track.artist}</p>
      </div>

      {/* Right metadata — desktop: genre · year · type, mobile: only duration */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Desktop metadata */}
        {showMetadata && metaItems.length > 0 && (
          <div className="hidden md:flex items-center gap-2">
            {metaItems.map((m, i) => (
              <span
                key={i}
                className={`text-[10px] uppercase tracking-wide font-medium ${m.color ?? 'text-white/30'}`}
              >
                {m.value}
              </span>
            ))}
          </div>
        )}

        {/* Remix type badge */}
        {track.remixType && (
          <span className={`hidden md:inline text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
            isCurrentTrack ? 'bg-red-500/20 text-red-400' : 'bg-white/[0.08] text-white/40'
          }`}>
            {track.remixType}
          </span>
        )}

        {/* Duration — always visible */}
        {track.duration && (
          <span className="text-[11px] text-white/30 tabular-nums">{track.duration}</span>
        )}

        {/* Download */}
        {showDownload && track.audioUrl && (
          <button
            className="text-white/30 hover:text-red-400 transition-colors"
            title="Download"
            onClick={e => { e.stopPropagation(); onDownload?.(track); }}
          >
            <Download size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
