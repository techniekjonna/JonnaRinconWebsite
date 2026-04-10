import { useMemo } from 'react';
import { Track } from '../lib/firebase/types';
import { useTracks } from './useTracks';

interface ScoredTrack {
  track: Track;
  score: number;
}

/**
 * Hook to find related tracks based on genre and artist matches
 * @param track - The current track to find related tracks for
 * @param excludeIds - Array of track IDs to exclude from results (default: [])
 * @returns Array of up to 6 related tracks sorted by relevance
 */
export const useRelatedTracks = (
  track: Track | null,
  excludeIds: string[] = []
): Track[] => {
  const { tracks } = useTracks();

  const relatedTracks = useMemo(() => {
    if (!track || !tracks.length) return [];

    // Score each track based on matches
    const scored: ScoredTrack[] = tracks
      .filter((t) => {
        // Exclude current track and specified IDs
        if (t.id === track.id) return false;
        if (excludeIds.includes(t.id)) return false;
        // Only include published tracks
        if (t.status !== 'published') return false;
        return true;
      })
      .map((t) => {
        let score = 0;

        // Genre match: +2 points (higher priority)
        if (t.genre === track.genre) {
          score += 2;
        }

        // Artist match: +1 point
        // Check against artist, originalArtist (for remixes), or remixArtist
        const trackArtists = [
          track.artist,
          (track as any).originalArtist,
          (track as any).remixArtist,
        ].filter(Boolean);

        const currentArtists = [
          t.artist,
          (t as any).originalArtist,
          (t as any).remixArtist,
        ].filter(Boolean);

        if (
          trackArtists.some((artist) => currentArtists.includes(artist))
        ) {
          score += 1;
        }

        return { track: t, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        // Sort by score descending
        if (a.score !== b.score) {
          return b.score - a.score;
        }
        // Then by creation date descending (newer first)
        const aDate = a.track.createdAt?.toMillis?.() || 0;
        const bDate = b.track.createdAt?.toMillis?.() || 0;
        return bDate - aDate;
      })
      .slice(0, 6)
      .map((item) => item.track);

    return relatedTracks;
  }, [track, tracks, JSON.stringify(excludeIds)]);

  return relatedTracks;
};
