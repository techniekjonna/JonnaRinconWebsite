import { useState, useEffect } from 'react';
import { Playlist } from '../lib/firebase/types';
import { playlistService } from '../lib/firebase/services';

export const usePlaylists = (filters?: {
  isPublic?: boolean;
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setLoading(true);

    const unsubscribe = playlistService.subscribeToAdminPlaylists(
      (playlistsData) => {
        setPlaylists(playlistsData);
        setError(null);
        setLoading(false);
      },
      filters
    );

    return () => unsubscribe();
  }, [filters?.isPublic]);

  return { playlists, loading, error, setError };
};

export const useFeaturedPlaylists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const featuredPlaylists = await playlistService.getFeaturedPlaylists();
        setPlaylists(featuredPlaylists);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return { playlists, loading, error };
};
