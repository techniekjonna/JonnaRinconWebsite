import React, { createContext, useContext, useState } from 'react';
import { Track } from '../lib/firebase/types';

interface TrackDetailContextType {
  selectedTrack: Track | null;
  setSelectedTrack: (track: Track | null) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const TrackDetailContext = createContext<TrackDetailContextType | undefined>(undefined);

export const TrackDetailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <TrackDetailContext.Provider value={{ selectedTrack, setSelectedTrack, isModalOpen, setIsModalOpen }}>
      {children}
    </TrackDetailContext.Provider>
  );
};

export const useTrackDetail = () => {
  const context = useContext(TrackDetailContext);
  if (!context) {
    throw new Error('useTrackDetail must be used within TrackDetailProvider');
  }
  return context;
};
