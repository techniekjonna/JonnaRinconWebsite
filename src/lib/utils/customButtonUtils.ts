import { CustomButton } from '../firebase/services/settingsService';
import { Track } from '../firebase/types';

export interface CustomButtonData {
  button1?: CustomButton;
  button2?: CustomButton;
}

/**
 * Renders custom buttons in track cards or modals
 */
export const getCustomButtonsHTML = (
  buttons: CustomButtonData,
  className: string = 'flex gap-2'
) => {
  const customButtons = [];
  if (buttons.button1) {
    customButtons.push(buttons.button1);
  }
  if (buttons.button2) {
    customButtons.push(buttons.button2);
  }
  return { buttons: customButtons, className };
};

/**
 * Gets the CSS classes for a button color value
 */
export const getButtonColorClasses = (color: string): string => {
  return color || 'bg-blue-600 hover:bg-blue-700';
};

/**
 * Validates a custom button configuration
 */
export const isValidCustomButton = (button: CustomButton | undefined): boolean => {
  if (!button) return false;
  return !!(button.label && button.url && button.color);
};

/**
 * Opens a URL in a new tab safely
 */
export const openCustomButtonUrl = (url: string): void => {
  try {
    const validUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(validUrl, '_blank', 'noopener,noreferrer');
  } catch (error) {
    console.error('Error opening URL:', error);
  }
};

/**
 * Filters tracks based on a custom button's trackIds
 * If no trackIds are specified, returns all tracks (backward compatible)
 */
export const filterTracksByButton = (tracks: Track[], button: CustomButton | undefined): Track[] => {
  if (!button) return tracks;

  // If no trackIds are specified, show all tracks (backward compatible)
  if (!button.trackIds || button.trackIds.length === 0) {
    return tracks;
  }

  // Filter to only show tracks in the button's trackIds array
  return tracks.filter(track => button.trackIds!.includes(track.id));
};
