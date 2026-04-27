import React, { useRef, useState, useEffect } from 'react';
import { SkipBack, Play, Pause, SkipForward, Shuffle, Repeat, Volume2, VolumeX, X } from 'lucide-react';
import { useTrackDetail } from '../contexts/TrackDetailContext';
import { useBeatDetail } from '../contexts/BeatDetailContext';
import PlayerModal from './PlayerModal';
import { formatDuration } from '../lib/utils/audioMetadata';
import { trackService } from '../lib/firebase/services';
import './GlobalAudioPlayer.css';

interface Track {
  id: string;
  title: string;
  artist: string;
  audioUrl?: string;
  coverArt?: string;
}

interface PlayerStore {
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  isShuffleEnabled: boolean;
  originalQueue: Track[];
  isPlaying: boolean;
}

// Global player state
const playerStore: PlayerStore = {
  currentTrack: null,
  queue: [],
  currentIndex: 0,
  isShuffleEnabled: true, // Default: shuffle ON
  originalQueue: [],
  isPlaying: false,
};

let previewTrack: Track | null = null;

let setPlayerUI: ((store: PlayerStore) => void) | null = null;
let togglePlayerVisibility: (() => void) | null = null;
let isPlayerVisible = true;

// Subscribers for state changes (e.g., TrackListItem components)
const subscribers: ((store: PlayerStore) => void)[] = [];

export function subscribeToPlayerState(callback: (store: PlayerStore) => void) {
  subscribers.push(callback);
  return () => {
    const index = subscribers.indexOf(callback);
    if (index > -1) subscribers.splice(index, 1);
  };
}

function notifySubscribers() {
  subscribers.forEach(cb => cb({ ...playerStore }));
}

export function setCurrentTrack(track: Track, queue: Track[] = []) {
  playerStore.currentTrack = track;
  playerStore.queue = queue.length > 0 ? queue : [track];
  playerStore.originalQueue = [...playerStore.queue];
  playerStore.isPlaying = true;

  // Apply shuffle if enabled
  if (playerStore.isShuffleEnabled) {
    playerStore.queue = shuffleQueue(playerStore.queue);
  }

  playerStore.currentIndex = playerStore.queue.findIndex((t) => t.id === track.id);
  isPlayerVisible = true;
  if (setPlayerUI) setPlayerUI({ ...playerStore });
  notifySubscribers();
}

export function getCurrentTrack() {
  return playerStore.currentTrack;
}

export function getIsPlayerVisible() {
  return isPlayerVisible;
}

export function togglePlayerOpen() {
  isPlayerVisible = !isPlayerVisible;
  if (togglePlayerVisibility) togglePlayerVisibility();
}

export function openPlayer() {
  isPlayerVisible = true;
  if (togglePlayerVisibility) togglePlayerVisibility();
}

export function setPreviewTrack(track: Track) {
  previewTrack = track;
  if (setPlayerUI) setPlayerUI({ ...playerStore });
}

export function getPreviewTrack() {
  return previewTrack;
}

export function setIsPlaying(isPlaying: boolean) {
  playerStore.isPlaying = isPlaying;
  if (setPlayerUI) setPlayerUI({ ...playerStore });
  notifySubscribers();
}

export function getIsPlaying() {
  return playerStore.isPlaying;
}

// Shuffle a queue array
function shuffleQueue(queue: Track[]): Track[] {
  const shuffled = [...queue];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function toggleShuffle() {
  playerStore.isShuffleEnabled = !playerStore.isShuffleEnabled;

  if (playerStore.isShuffleEnabled) {
    // Turn shuffle ON - save original order and shuffle
    playerStore.originalQueue = [...playerStore.queue];
    playerStore.queue = shuffleQueue(playerStore.queue);
    // Update current index to point to the same track in shuffled queue
    const currentTrackId = playerStore.currentTrack?.id;
    playerStore.currentIndex = playerStore.queue.findIndex(t => t.id === currentTrackId);
  } else {
    // Turn shuffle OFF - restore original order
    playerStore.queue = [...playerStore.originalQueue];
    // Update current index to point to the same track in original queue
    const currentTrackId = playerStore.currentTrack?.id;
    playerStore.currentIndex = playerStore.queue.findIndex(t => t.id === currentTrackId);
  }

  if (setPlayerUI) setPlayerUI({ ...playerStore });
  notifySubscribers();
}

export function getIsShuffle() {
  return playerStore.isShuffleEnabled;
}

export function getQueue() {
  return playerStore.queue;
}

export function getCurrentIndex() {
  return playerStore.currentIndex;
}

export function togglePlayPause() {
  playerStore.isPlaying = !playerStore.isPlaying;
  if (setPlayerUI) setPlayerUI({ ...playerStore });
  notifySubscribers();
}

export default function GlobalAudioPlayer({ onCoverClick }: { onCoverClick?: () => void } = {}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playTrackedRef = useRef<Set<string>>(new Set()); // Track which songs have been tracked
  const [store, setStore] = useState<PlayerStore>(playerStore);
  const { setSelectedTrack, setIsModalOpen } = useTrackDetail();
  const { setSelectedBeat, setIsModalOpen: setBeatModalOpen } = useBeatDetail();
  const [isVisible, setIsVisible] = useState(isPlayerVisible);
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedVolume = localStorage.getItem('audioPlayerVolume');
      if (savedVolume) {
        const parsed = parseFloat(savedVolume);
        // Ensure volume is a valid number between 0 and 1
        if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0 && parsed <= 1) {
          return parsed;
        }
      }
    }
    return 0.5;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

  // Register UI updaters
  React.useEffect(() => {
    setPlayerUI = (newStore) => {
      setStore({ ...newStore });
    };
    togglePlayerVisibility = () => {
      setIsVisible(!isVisible);
    };
  }, [isVisible]);

  // Save volume to localStorage when it changes
  React.useEffect(() => {
    if (typeof window !== 'undefined' && isFinite(volume)) {
      localStorage.setItem('audioPlayerVolume', volume.toString());
    }
  }, [volume]);

  // Initialize audio element volume from saved state on mount
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, []);

  // Audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlayPause = () => {
      setIsPlaying(!audio.paused);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Track play after 15 seconds
      if (audio.currentTime >= 15 && store.currentTrack && !playTrackedRef.current.has(store.currentTrack.id)) {
        playTrackedRef.current.add(store.currentTrack.id);
        // Record play in Firebase
        trackService.updateTrack(store.currentTrack.id, {
          plays: (store.currentTrack as any).plays ? (store.currentTrack as any).plays + 1 : 1
        }).catch(err => console.error('Error recording play:', err));
      }
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (repeat === 'one') {
        // Repeat 1x: restart the same track and play it again
        audio.currentTime = 0;
        audio.play();
      } else if (repeat === 'all') {
        // Repeat ALL: move to next track, loop back to start when at end
        handleNext();
      } else {
        // No repeat: just move to next track
        handleNext();
      }
    };

    audio.addEventListener('play', handlePlayPause);
    audio.addEventListener('pause', handlePlayPause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlayPause);
      audio.removeEventListener('pause', handlePlayPause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeat, store.isPlaying, store.currentTrack]);

  // Sync with global player state (play/pause)
  useEffect(() => {
    setIsPlaying(store.isPlaying);
    if (audioRef.current) {
      if (store.isPlaying) {
        audioRef.current.play().catch(err => console.error('Play error:', err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [store.isPlaying]);

  // Sync when current track changes
  useEffect(() => {
    if (audioRef.current && store.currentTrack) {
      audioRef.current.src = store.currentTrack.audioUrl || '';
      if (store.isPlaying) {
        audioRef.current.play().catch(err => console.error('Play error:', err));
      }
    }
    // Clear tracked plays for previous track when new track loads
    if (store.currentTrack) {
      playTrackedRef.current.clear();
    }
  }, [store.currentTrack?.id]);

  const displayTrack = store.currentTrack || previewTrack;
  if (!displayTrack || !isVisible) {
    return null;
  }

  const handleNext = () => {
    if (store.queue.length === 0) return;

    if (store.isShuffleEnabled) {
      // Shuffle: play next random track (or reshuffle if at end)
      const nextIndex = (store.currentIndex + 1) % store.queue.length;
      const nextTrack = store.queue[nextIndex];
      if (nextTrack) {
        playerStore.currentIndex = nextIndex;
        playerStore.currentTrack = nextTrack;
        playerStore.isPlaying = true;
        if (setPlayerUI) setPlayerUI({ ...playerStore });
  notifySubscribers();
      }
    } else {
      // Sequential: play next track in original order
      const nextIndex = (store.currentIndex + 1) % store.queue.length;
      const nextTrack = store.queue[nextIndex];
      if (nextTrack) {
        playerStore.currentIndex = nextIndex;
        playerStore.currentTrack = nextTrack;
        playerStore.isPlaying = true;
        if (setPlayerUI) setPlayerUI({ ...playerStore });
  notifySubscribers();
      }
    }
  };

  const handlePrevious = () => {
    if (store.queue.length === 0) return;
    let prevIndex = store.currentIndex - 1;
    if (prevIndex < 0) prevIndex = store.queue.length - 1;
    const prevTrack = store.queue[prevIndex];
    if (prevTrack) {
      playerStore.currentIndex = prevIndex;
      playerStore.currentTrack = prevTrack;
      playerStore.isPlaying = true;
      if (setPlayerUI) setPlayerUI({ ...playerStore });
  notifySubscribers();
    }
  };

  const handleClose = () => {
    togglePlayerOpen();
  };

  const togglePlayPause = () => {
    // If in preview mode (no currentTrack), clicking play promotes the preview to current track
    if (!store.currentTrack && previewTrack) {
      setCurrentTrack(previewTrack, [previewTrack]);
      previewTrack = null;
      return;
    }
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        playerStore.isPlaying = false;
      } else {
        audioRef.current.play();
        playerStore.isPlaying = true;
      }
      if (setPlayerUI) setPlayerUI({ ...playerStore });
  notifySubscribers();
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setPreviousVolume(newVolume);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      // Unmute: restore previous volume
      setVolume(previousVolume);
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.volume = previousVolume;
      }
    } else {
      // Mute: save current volume and set to 0
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
    }
  };

  const handleRepeatToggle = () => {
    setRepeat((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const handleToggleShuffle = () => {
    toggleShuffle();
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePreviousClick = () => {
    handlePrevious();
  };

  const handleNextClick = () => {
    handleNext();
  };

  return (
    <>
      <PlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        audioRef={audioRef}
        isPlaying={isPlaying}
        onPlayPauseClick={togglePlayPause}
        currentTime={currentTime}
        duration={duration}
        onProgressChange={handleProgressChange}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isMuted={isMuted}
        onMuteToggle={handleMuteToggle}
        repeat={repeat}
        onRepeatToggle={handleRepeatToggle}
        onPreviousClick={handlePreviousClick}
        onNextClick={handleNextClick}
      />
      <audio
        ref={audioRef}
        src={store.currentTrack?.audioUrl || ''}
        autoPlay
        volume={isMuted ? 0 : volume}
      />
      <div className="fixed bottom-0 left-0 right-0 z-40 jonna-audio-player">
        {/* Progress Bar at Top - Spotify Style with Times */}
        <div className="jonna-progress-container">
          <span className="jonna-current-time">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
            className="jonna-progress-slider"
            title="Progress"
            aria-label="Progress"
          />
          <span className="jonna-total-time">{formatTime(duration)}</span>
        </div>

        {/* Main Player Content */}
        <div className="jonna-player-content">
          {/* LEFT: Cover Art + Title + Artist */}
          <div className="jonna-cover-section">
            {displayTrack.coverArt && (
              <div
                className="jonna-cover-wrapper"
                onClick={() => setIsPlayerModalOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setIsPlayerModalOpen(true);
                  }
                }}
              >
                <img
                  src={displayTrack.coverArt}
                  alt={displayTrack.title}
                  className="jonna-cover-image"
                />
              </div>
            )}
            <div className="jonna-track-info">
              <div className="jonna-track-title">{displayTrack.title}</div>
              <div className="jonna-track-artist">{displayTrack.artist}</div>
            </div>
          </div>

          {/* CENTER: Shuffle + Prev/Play/Next + Repeat */}
          <div className="jonna-center-section">
            <button
              className={`jonna-control-btn ${store.isShuffleEnabled ? 'jonna-active' : ''}`}
              onClick={handleToggleShuffle}
              title="Shuffle"
              aria-label="Shuffle"
            >
              <Shuffle size={20} />
            </button>

            <div className="jonna-play-controls">
              <button
                className="jonna-control-btn jonna-skip-btn"
                onClick={handlePrevious}
                title="Previous track"
                aria-label="Previous track"
              >
                <SkipBack size={20} />
              </button>
              <button
                className="jonna-play-pause-btn"
                onClick={togglePlayPause}
                title={isPlaying ? 'Pause' : 'Play'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {store.isPlaying ? <Pause size={32} /> : <Play size={32} />}
              </button>
              <button
                className="jonna-control-btn jonna-skip-btn"
                onClick={handleNext}
                title="Next track"
                aria-label="Next track"
              >
                <SkipForward size={20} />
              </button>
            </div>

            <button
              className={`jonna-control-btn ${repeat !== 'off' ? 'jonna-active' : ''}`}
              onClick={handleRepeatToggle}
              title={repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat 1x'}
              aria-label={repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat 1x'}
              style={{ position: 'relative' }}
            >
              <Repeat size={20} />
              {repeat === 'one' && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    color: 'rgb(220, 38, 38)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    lineHeight: '1',
                  }}
                >
                  1
                </span>
              )}
            </button>
          </div>

          {/* RIGHT: Controls (Mute, Volume, Close) */}
          <div className="jonna-right-controls">
            <button
              className={`jonna-control-btn ${isMuted ? 'jonna-active' : ''}`}
              onClick={handleMuteToggle}
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="jonna-volume-slider"
              title="Volume"
              aria-label="Volume"
              style={{ opacity: isMuted ? 0.5 : 1, cursor: 'pointer' }}
            />
            <button
              className="jonna-close-btn"
              onClick={handleClose}
              title="Close player"
              aria-label="Close player"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        body {
          padding-bottom: ${displayTrack ? '120px' : '0'};
        }
        @media (max-width: 768px) {
          body {
            padding-bottom: ${displayTrack ? '100px' : '0'} !important;
          }
        }
      `}</style>
    </>
  );
}
