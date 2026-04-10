import { useState, useEffect } from 'react';

interface WikipediaInfo {
  content: string;
  loading: boolean;
  error: string | null;
}

// Cache to avoid repeated API calls
const genreCache = new Map<string, string>();

/**
 * Hook to fetch Wikipedia genre information
 * Returns the first 8 sentences max from Wikipedia
 * @param genre - The genre to fetch information for
 * @returns Object with content, loading state, and error
 */
export const useWikipediaGenre = (genre?: string): WikipediaInfo => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!genre) {
      setContent('');
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    if (genreCache.has(genre)) {
      setContent(genreCache.get(genre) || '');
      setLoading(false);
      setError(null);
      return;
    }

    const fetchWikipedia = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(genre)}_music`
        );

        if (!response.ok) {
          throw new Error('Genre not found');
        }

        const data = await response.json();
        let extract = data.extract || '';

        // Limit to 8 sentences
        const sentences = extract.match(/[^.!?]+[.!?]+/g) || [];
        const limitedContent = sentences.slice(0, 8).join('').trim();

        setContent(limitedContent);
        genreCache.set(genre, limitedContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch genre information');
        genreCache.set(genre, '');
      } finally {
        setLoading(false);
      }
    };

    fetchWikipedia();
  }, [genre]);

  return { content, loading, error };
};
