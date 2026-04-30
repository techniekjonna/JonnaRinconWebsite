import React, { createContext, useContext, useState } from 'react';
import { Beat } from '../lib/firebase/types';

interface BeatDetailContextType {
  selectedBeat: Beat | null;
  setSelectedBeat: (beat: Beat | null) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const BeatDetailContext = createContext<BeatDetailContextType | undefined>(undefined);

export const BeatDetailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <BeatDetailContext.Provider value={{ selectedBeat, setSelectedBeat, isModalOpen, setIsModalOpen }}>
      {children}
    </BeatDetailContext.Provider>
  );
};

export const useBeatDetail = () => {
  const context = useContext(BeatDetailContext);
  if (!context) {
    throw new Error('useBeatDetail must be used within BeatDetailProvider');
  }
  return context;
};
