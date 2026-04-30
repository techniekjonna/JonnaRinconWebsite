import { useMemo } from 'react';
import { Track } from '../lib/firebase/types';
import { CustomButton } from '../lib/firebase/services/settingsService';
import { filterTracksByButton } from '../lib/utils/customButtonUtils';

/**
 * Hook to filter tracks based on a custom button's track selection
 * Automatically handles backward compatibility - if no trackIds are set, returns all tracks
 */
export const useCustomButtonTracks = (
  allTracks: Track[],
  button: CustomButton | undefined
): Track[] => {
  return useMemo(() => {
    return filterTracksByButton(allTracks, button);
  }, [allTracks, button?.trackIds]);
};

/**
 * Hook to get tracks for a specific button number from track settings
 */
export const useCustomButtonTracksForButton = (
  allTracks: Track[],
  button: CustomButton | undefined,
  buttonNumber: 1 | 2
): { tracks: Track[]; selectedTrackCount: number } => {
  const filteredTracks = useCustomButtonTracks(allTracks, button);

  return {
    tracks: filteredTracks,
    selectedTrackCount: button?.trackIds?.length || 0,
  };
};
