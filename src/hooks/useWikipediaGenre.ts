import { useState, useEffect } from 'react';

interface WikipediaInfo {
  content: string;
  loading: boolean;
}

// Cache to avoid repeated API calls and failed attempts
const genreCache = new Map<string, string>();
const failedGenres = new Set<string>();

/**
 * Hook to fetch Wikipedia genre information
 * Returns the first 8 sentences max from Wikipedia
 * Silently handles errors without logging to console
 * @param genre - The genre to fetch information for
 * @returns Object with content and loading state
 */
export const useWikipediaGenre = (genre?: string): WikipediaInfo => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!genre) {
      setContent('');
      setLoading(false);
      return;
    }

    // Extract primary genre (handle comma-separated genres)
    const primaryGenre = genre.split(',')[0].trim().toLowerCase();

    // Skip if already failed before
    if (failedGenres.has(primaryGenre)) {
      setContent('');
      setLoading(false);
      return;
    }

    // Check cache first
    if (genreCache.has(primaryGenre)) {
      setContent(genreCache.get(primaryGenre) || '');
      setLoading(false);
      return;
    }

    const fetchWikipedia = async () => {
      setLoading(true);
      try {
        // Try multiple variations of the genre name
        const searchVariations = [
          `${primaryGenre}_music`,
          `${primaryGenre}_(music)`,
          primaryGenre,
        ];

        let found = false;
        for (const variation of searchVariations) {
          try {
            const response = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(variation)}`,
              { signal: AbortSignal.timeout(5000) } // 5 second timeout
            );

            if (response.ok) {
              const data = await response.json();
              let extract = data.extract || '';

              if (extract) {
                // Limit to 8 sentences
                const sentences = extract.match(/[^.!?]+[.!?]+/g) || [];
                const limitedContent = sentences.slice(0, 8).join('').trim();

                if (limitedContent) {
                  setContent(limitedContent);
                  genreCache.set(primaryGenre, limitedContent);
                  found = true;
                  break;
                }
              }
            }
          } catch {
            // Try next variation silently
            continue;
          }
        }

        // If nothing found, cache as failed
        if (!found) {
          failedGenres.add(primaryGenre);
          genreCache.set(primaryGenre, '');
          setContent('');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWikipedia();
  }, [genre]);

  return { content, loading };
};
