import React from 'react';
import { useBeatDetail } from '../contexts/BeatDetailContext';
import BeatDetailModal from './BeatDetailModal';
import { getCurrentTrack } from './GlobalAudioPlayer';
import { beatService } from '../lib/firebase/services';

export default function GlobalBeatDetailModal() {
  const { selectedBeat, isModalOpen, setIsModalOpen, setSelectedBeat } = useBeatDetail();
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Update playing state when track changes
  React.useEffect(() => {
    const currentTrack = getCurrentTrack();
    setIsPlaying(selectedBeat ? currentTrack?.id === selectedBeat.id : false);
  }, [selectedBeat]);

  const handlePlayBeat = async (beat: any) => {
    // This callback is passed to BeatDetailModal
    // The actual play handling should be done by the caller
    // For now, we'll just increment plays
    if (beat.id) {
      await beatService.incrementPlays(beat.id).catch((error) => {
        console.error('Failed to increment beat plays:', error);
      });
    }
  };

  if (!isModalOpen || !selectedBeat) return null;

  return (
    <BeatDetailModal
      beat={selectedBeat}
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
        setSelectedBeat(null);
      }}
      onAddToCart={() => {
        // Add to cart logic would go here
        console.log('Add to cart:', selectedBeat);
      }}
      isPlaying={isPlaying}
      onPlay={handlePlayBeat}
      cartCount={0}
    />
  );
}
