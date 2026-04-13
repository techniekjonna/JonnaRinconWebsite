import React, { createContext, useContext, useEffect, useState } from 'react';
import { SiteBackground } from '../lib/firebase/types';
import { settingsService } from '../lib/firebase/services';

interface BackgroundContextType {
  activeBackground: SiteBackground | null;
  loading: boolean;
  error: string | null;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBackground, setActiveBackground] = useState<SiteBackground | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to real-time background updates
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

        setActiveBackground(active);
        setError(null);
      } catch (err: any) {
        console.error('Error processing backgrounds:', err);
        setError(err.message || 'Failed to load background');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <BackgroundContext.Provider value={{ activeBackground, loading, error }}>
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
