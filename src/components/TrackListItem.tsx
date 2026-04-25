import React, { useState, useEffect } from 'react';
import { Music, Play, Pause, Download } from 'lucide-react';
import { getCurrentTrack, getIsPlaying, setCurrentTrack, togglePlayPause, subscribeToPlayerState } from './GlobalAudioPlayer';
import { getRowHighlightClass } from '../lib/utils/buttonStyles';

interface TrackListItemProps {
  track: any;
  onClickTrack?: (track: any) => void;
  onPlay?: (track: any) => void;
  onTogglePlay?: (track: any) => void;
  onBuy?: (track: any) => void;
  onDownload?: (track: any) => void;
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
  allTracks = [],
  showType = true,
  showYear = true,
  showGenre = true,
  showBPM = true,
  showMetadata = false,
  isAlbumTrack = false,
  trackNumber,
  isPlaying = false,
  showDownload = false,
  showCover = true,
  showPlayButton = true,
  showAlbumPlayButton = true,
}: TrackListItemProps) {
  // Force re-render when global player state changes
  const [, setPlayerState] = useState({});

  useEffect(() => {
    const unsubscribe = subscribeToPlayerState(() => {
      setPlayerState({});
    });
    return unsubscribe;
  }, []);

  const currentTrack = getCurrentTrack();
  const isCurrentTrack = currentTrack?.id === track.id;
  const globalIsPlaying = getIsPlaying();

  // Use global playing state if this is current track, otherwise use props
  const actualIsPlaying = isCurrentTrack ? globalIsPlaying : isPlaying;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If this track is already playing, toggle play/pause
    if (isCurrentTrack) {
      togglePlayPause();
    } else {
      // Otherwise, set as current track and start playing
      if (onTogglePlay) {
        onTogglePlay(track);
      } else if (allTracks && allTracks.length > 0) {
        setCurrentTrack(track, allTracks);
      } else {
        setCurrentTrack(track, [track]);
      }
    }
  };

  return (
    <div
      className={`rounded-xl ${isAlbumTrack ? 'p-2' : 'p-4'} flex items-center ${isAlbumTrack ? 'gap-2' : 'gap-4'} hover:bg-white/[0.06] transition-all duration-300 border backdrop-blur-md ${
        isCurrentTrack ? 'border-red-500/50 bg-white/[0.08]' : 'bg-white/[0.04] border-white/[0.06]'
      } ${getRowHighlightClass(isCurrentTrack)}`}
    >
      {/* Cover Art */}
      {showCover && (
        <div
          onClick={() => onClickTrack?.(track)}
          className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600/40 to-red-900/20 border border-white/[0.08] flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
        >
          {track.coverArt ? (
            <img
              src={track.coverArt}
              alt={track.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <Music size={20} className="text-white/30" />
          )}
        </div>
      )}

      {/* Play/Pause Button for Album Tracks */}
      {isAlbumTrack && showPlayButton && showAlbumPlayButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePlayClick();
          }}
          className="flex-shrink-0 p-1 hover:bg-white/[0.1] rounded-lg transition-all"
          title={isCurrentTrack && getIsPlaying() ? 'Pause' : 'Play'}
        >
          {isCurrentTrack && getIsPlaying() ? (
            <Pause size={14} className="text-red-600" fill="currentColor" />
          ) : (
            <Play size={14} className="text-white/60 hover:text-white" fill="currentColor" />
          )}
        </button>
      )}

      {/* Track Info */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onClickTrack?.(track)}
      >
        {isAlbumTrack ? (
          // Album Track Layout: Number + Title together, Artist name - more compact
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-white text-xs truncate">
              {trackNumber && `${trackNumber}. `}{track.title}
            </span>
            <span className="text-white/40 text-xs truncate">
              {track.artist}
            </span>
            {showType && (
              <span className="px-1.5 py-0.5 bg-red-600/20 border border-red-500/30 rounded-full text-[8px] font-bold text-red-400 uppercase tracking-wider flex-shrink-0">
                {track.type}
              </span>
            )}
          </div>
        ) : (
          // Regular Track Layout: Artist bold, Title normal
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm md:text-base truncate">
              {track.artist}
            </span>
            <span className="text-white/40 text-sm md:text-base truncate">
              {track.title}
            </span>
            {showType && (
              <span className="px-2 py-1 bg-red-600/20 border border-red-500/30 rounded-full text-[10px] font-bold text-red-400 uppercase tracking-wider flex-shrink-0">
                {track.type}
              </span>
            )}
          </div>
        )}

        {/* Metadata Row 2 - Additional Beat/Track Info */}
        <div className={`flex flex-wrap ${isAlbumTrack ? 'gap-1.5 text-[8px] mt-0' : 'gap-3 text-[10px] mt-1'} text-white/50 uppercase tracking-wider`}>
          {showYear && track.year && (
            <span className="inline-flex items-center gap-1">
              <span className="text-white/30">•</span>
              <span>{track.year}</span>
            </span>
          )}
          {showGenre && track.genre && (
            <span className="inline-flex items-center gap-1">
              <span className="text-white/30">•</span>
              <span className="text-purple-300 font-semibold">{track.genre}</span>
            </span>
          )}
          {showBPM && track.bpm && (
            <span className="inline-flex items-center gap-1">
              <span className="text-white/30">•</span>
              <span className="text-cyan-300 font-semibold">{track.bpm} BPM</span>
            </span>
          )}
          {track.key && (
            <span className="inline-flex items-center gap-1">
              <span className="text-white/30">•</span>
              <span className="text-amber-300 font-semibold">{track.key}</span>
            </span>
          )}
          {track.duration && (
            <span className="inline-flex items-center gap-1">
              <span className="text-white/30">•</span>
              <span>{track.duration}</span>
            </span>
          )}
          {track.remixType && (
            <span className="inline-flex items-center gap-1 ml-auto">
              <span className="text-red-400 font-bold bg-red-500/20 px-2 py-0.5 rounded">
                {track.remixType}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Download Button */}
      {showDownload && track.audioUrl && (
        <a
          href={track.audioUrl}
          download
          className="flex-shrink-0 flex items-center justify-center text-white/40 hover:text-red-400 transition-colors duration-200"
          style={{ width: '16px', height: '16px' }}
          title="Download track"
          aria-label="Download track"
          onClick={(e) => {
            e.stopPropagation();
            if (onDownload) {
              onDownload(track);
            }
          }}
        >
          <Download size={14} />
        </a>
      )}

      {/* Play/Pause Button - hide if album track with its own button */}
      {!isAlbumTrack && (
        <button
          onClick={handlePlayClick}
          className="flex-shrink-0 flex items-center justify-center text-white/40 hover:text-white/60 transition-colors duration-200"
          style={{ width: '16px', height: '16px' }}
          title={isCurrentTrack && actualIsPlaying ? 'Pause' : 'Play'}
          aria-label={isCurrentTrack && actualIsPlaying ? 'Pause track' : 'Play track'}
        >
          {isCurrentTrack && actualIsPlaying ? (
            <Pause size={12} fill="currentColor" />
          ) : (
            <Play size={12} fill="currentColor" />
          )}
        </button>
      )}
    </div>
  );
}
