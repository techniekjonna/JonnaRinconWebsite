import { useState, useEffect } from 'react';
import { Remix } from '../lib/firebase/types';
import { remixService } from '../lib/firebase/services';

export const useRemixes = (filters?: {
  status?: Remix['status'];
  featured?: boolean;
  genre?: string;
}) => {
  const [remixes, setRemixes] = useState<Remix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = remixService.subscribeToRemixes(
      (remixesData) => {
        setRemixes(remixesData);
        setLoading(false);
      },
      filters
    );

    return () => unsubscribe();
  }, [JSON.stringify(filters)]);

  return { remixes, loading, error, setError };
};

export const useFeaturedRemixes = () => {
  const [remixes, setRemixes] = useState<Remix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const featuredRemixes = await remixService.getFeaturedRemixes();
        setRemixes(featuredRemixes);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return { remixes, loading, error };
};

export const useRemixGenres = () => {
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      const genresList = await remixService.getGenres();
      setGenres(genresList);
      setLoading(false);
    };

    fetchGenres();
  }, []);

  return { genres, loading };
};
