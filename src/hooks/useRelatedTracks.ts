import { useMemo } from 'react';
import { Track } from '../lib/firebase/types';
import { useTracks } from './useTracks';
import { useRemixes } from './useRemixes';
import { useBeats } from './useBeats';

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
  const { tracks } = useTracks({ status: 'published' });
  const { remixes } = useRemixes({ status: 'published' });
  const { beats } = useBeats({ status: 'published' });

  // Convert excludeIds array to a Set for faster lookups and stable reference
  const excludeIdsStr = excludeIds.join(',');

  const relatedTracks = useMemo(() => {
    if (!track) return [];

    const excludeSet = new Set(excludeIds);

    // Combine all published content from different sources
    const allContent: Track[] = [
      ...(tracks || []),
      ...(remixes?.map(r => ({
        ...r,
        artist: r.remixArtist || r.artist,
        title: r.title,
      } as Track)) || []),
      ...(beats?.map(b => ({
        ...b,
        artist: b.producer || b.artist || 'Unknown',
        title: b.title,
      } as Track)) || []),
    ];

    // Score each content based on matches
    const scored: ScoredTrack[] = [];

    for (const content of allContent) {
      // Exclude current track and specified IDs
      if (content.id === track.id) continue;
      if (excludeSet.has(content.id)) continue;

      let score = 0;

      // Genre match: +2 points (higher priority)
      if (content.genre === track.genre) {
        score += 2;
      }

      // Artist match: +1 point
      // Check against artist, originalArtist (for remixes), or remixArtist/producer (for beats)
      const trackArtists = [
        track.artist,
        (track as any).originalArtist,
        (track as any).remixArtist,
      ].filter(Boolean);

      const currentArtists = [
        content.artist,
        (content as any).originalArtist,
        (content as any).remixArtist,
        (content as any).producer,
      ].filter(Boolean);

      if (trackArtists.some((artist) => currentArtists.includes(artist))) {
        score += 1;
      }

      // If no genre or artist match, still include some content (randomize)
      if (score === 0) {
        score = 0.5;
      }

      scored.push({ track: content, score });
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

    // Return top 6 tracks/content
    return scored.slice(0, 6).map((item) => item.track);
  }, [track, tracks, remixes, beats, excludeIdsStr]);

  return relatedTracks;
};
