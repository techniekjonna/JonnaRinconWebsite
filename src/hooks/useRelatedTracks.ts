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

  // Convert excludeIds array to a Set for faster lookups and stable reference
  const excludeIdsStr = excludeIds.join(',');

  const relatedTracks = useMemo(() => {
    if (!track || !tracks.length) return [];

    const excludeSet = new Set(excludeIds);

    // Score each track based on matches
    const scored: ScoredTrack[] = [];

    for (const t of tracks) {
      // Exclude current track and specified IDs
      if (t.id === track.id) continue;
      if (excludeSet.has(t.id)) continue;
      // Only include published tracks
      if (t.status !== 'published') continue;

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

      if (trackArtists.some((artist) => currentArtists.includes(artist))) {
        score += 1;
      }

      if (score > 0) {
        scored.push({ track: t, score });
      }
    }

    // Sort by score descending, then by creation date descending
    scored.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      const aDate = a.track.createdAt?.toMillis?.() || 0;
      const bDate = b.track.createdAt?.toMillis?.() || 0;
      return bDate - aDate;
    });

    // Return top 6 tracks
    return scored.slice(0, 6).map((item) => item.track);
  }, [track, tracks, excludeIdsStr]);

  return relatedTracks;
};
