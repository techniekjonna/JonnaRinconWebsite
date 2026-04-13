import React, { createContext, useContext, useEffect, useState } from 'react';
import { SiteBackground } from '../lib/firebase/types';
import { settingsService } from '../lib/firebase/services';

interface CachedBackground {
  imageUrl: string;
  id: string;
  timestamp: number;
}

interface BackgroundContextType {
  activeBackground: SiteBackground | null;
  loading: boolean;
  error: string | null;
  firebaseLoading: boolean;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

const CACHE_KEY = 'cachedBackground';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Utility functions for localStorage
const loadCachedBackground = (): CachedBackground | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as CachedBackground;
    const now = Date.now();

    // Check if cache is still valid
    if (now - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn('Failed to load cached background:', err);
    return null;
  }
};

const saveCachedBackground = (imageUrl: string, id: string): void => {
  try {
    const cached: CachedBackground = {
      imageUrl,
      id,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (err) {
    console.warn('Failed to save cached background:', err);
  }
};

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBackground, setActiveBackground] = useState<SiteBackground | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cached background on mount
  useEffect(() => {
    const cached = loadCachedBackground();
    if (cached) {
      // Create a minimal SiteBackground from cache
      const cachedBg: SiteBackground = {
        id: cached.id,
        imageUrl: cached.imageUrl,
        name: 'Cached Background',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SiteBackground;

      setActiveBackground(cachedBg);
      // Mark cached data as loaded, but still fetch fresh data
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time background updates
  useEffect(() => {
    const unsubscribe = settingsService.subscribeToBackgrounds((backgrounds) => {
      try {
        // Find active background, or use the first one, or set a default
        let active = backgrounds.find((bg) => bg.isActive);

        if (!active && backgrounds.length > 0) {
          // If no background is marked as active but we have backgrounds, use the first one
          active = backgrounds[0];
        }

        // If still no background, create a default with JEIGHTENESIS
        if (!active) {
          active = {
            id: 'default',
            imageUrl: '/JEIGHTENESIS.jpg',
            name: 'Default Background',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as SiteBackground;
        }

        // CRITICAL: Always set Firebase data immediately - this takes priority over cache
        // This ensures that when the user changes the background in the admin panel,
        // the new background displays on all pages, overriding any stale cache
        setActiveBackground(active);
        saveCachedBackground(active.imageUrl, active.id);
        setError(null);
        setLoading(false); // Mark loading complete once we have Firebase data
      } catch (err: any) {
        console.error('Error processing backgrounds:', err);
        setError(err.message || 'Failed to load background');
        setLoading(false);
      } finally {
        setFirebaseLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <BackgroundContext.Provider value={{ activeBackground, loading, error, firebaseLoading }}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
};
