import { useEffect, useRef } from 'react';
import { Track } from '../lib/firebase/types';

interface UsePlayTrackingProps {
  track: Track | null;
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  onPlayRegistered: (track: Track) => void;
  minPlaySeconds?: number;
}

export function usePlayTracking({
  track,
  isPlaying,
  audioRef,
  onPlayRegistered,
  minPlaySeconds = 15,
}: UsePlayTrackingProps) {
  const trackedTracksRef = useRef<Set<string>>(new Set());
  const playStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!track || !isPlaying || !audioRef.current) return;

    // Reset tracking for new track
    if (!trackedTracksRef.current.has(track.id!)) {
      playStartTimeRef.current = audioRef.current.currentTime;
    }

    const checkPlayTime = () => {
      if (!audioRef.current || !track) return;

      const elapsedSeconds = audioRef.current.currentTime - playStartTimeRef.current;

      // Register play after minPlaySeconds
      if (elapsedSeconds >= minPlaySeconds && !trackedTracksRef.current.has(track.id!)) {
        trackedTracksRef.current.add(track.id!);
        onPlayRegistered(track);
      }
    };

    // Check play time every second
    const interval = setInterval(checkPlayTime, 1000);

    return () => clearInterval(interval);
  }, [track, isPlaying, audioRef, onPlayRegistered, minPlaySeconds]);

  // Clear tracking when track changes
  useEffect(() => {
    if (!track) {
      trackedTracksRef.current.clear();
    }
  }, [track?.id]);
}
