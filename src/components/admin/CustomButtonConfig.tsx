import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, X } from 'lucide-react';
import { useTrackSettings } from '../../hooks/useTrackSettings';
import { CustomButton, TrackSettings } from '../../lib/firebase/services/settingsService';
import { useTracks } from '../../hooks/useTracks';
import { Track } from '../../lib/firebase/types';

interface CustomButtonConfigProps {
  isExpanded?: boolean;
}

const colorOptions = [
  { value: 'bg-blue-600 hover:bg-blue-700', label: 'Blue', displayColor: 'bg-blue-600' },
  { value: 'bg-purple-600 hover:bg-purple-700', label: 'Purple', displayColor: 'bg-purple-600' },
  { value: 'bg-pink-600 hover:bg-pink-700', label: 'Pink', displayColor: 'bg-pink-600' },
  { value: 'bg-red-600 hover:bg-red-700', label: 'Red', displayColor: 'bg-red-600' },
  { value: 'bg-green-600 hover:bg-green-700', label: 'Green', displayColor: 'bg-green-600' },
  { value: 'bg-cyan-600 hover:bg-cyan-700', label: 'Cyan', displayColor: 'bg-cyan-600' },
  { value: 'bg-yellow-600 hover:bg-yellow-700', label: 'Yellow', displayColor: 'bg-yellow-600' },
  { value: 'bg-indigo-600 hover:bg-indigo-700', label: 'Indigo', displayColor: 'bg-indigo-600' },
];

const CustomButtonConfig: React.FC<CustomButtonConfigProps> = ({ isExpanded: initialExpanded = true }) => {
  const { settings, loading, error, updateSettings } = useTrackSettings();
  const { tracks: allTracks = [], loading: tracksLoading } = useTracks({ status: 'published' });
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [button1, setButton1] = useState<CustomButton | undefined>(settings?.customButton1);
  const [button2, setButton2] = useState<CustomButton | undefined>(settings?.customButton2);

  const [isTrackModalOpen, setIsTrackModalOpen] = useState<1 | 2 | null>(null);
  const [trackSearchQuery, setTrackSearchQuery] = useState('');

  React.useEffect(() => {
    if (settings) {
      setButton1(settings.customButton1);
      setButton2(settings.customButton2);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);

      const updatedSettings: TrackSettings = {
        ...settings!,
        ...(button1 && { customButton1: button1 }),
        ...(button2 && { customButton2: button2 }),
      };

      await updateSettings(updatedSettings);
      setSaveMessage({ type: 'success', text: 'Custom buttons saved successfully!' });

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateButton = (
    buttonNum: 1 | 2,
    field: keyof CustomButton,
    value: string | string[]
  ) => {
    if (buttonNum === 1) {
      setButton1({
        ...button1!,
        [field]: value,
      } as CustomButton);
    } else {
      setButton2({
        ...button2!,
        [field]: value,
      } as CustomButton);
    }
  };

  const toggleTrackSelection = (buttonNum: 1 | 2, trackId: string) => {
    const button = buttonNum === 1 ? button1 : button2;
    const currentTrackIds = button?.trackIds || [];
    const newTrackIds = currentTrackIds.includes(trackId)
      ? currentTrackIds.filter(id => id !== trackId)
      : [...currentTrackIds, trackId];

    updateButton(buttonNum, 'trackIds', newTrackIds);
  };

  const clearTrackSelection = (buttonNum: 1 | 2) => {
    updateButton(buttonNum, 'trackIds', []);
  };

  const filteredTracks = allTracks.filter(track =>
    track.title.toLowerCase().includes(trackSearchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(trackSearchQuery.toLowerCase())
  );

  const toggleButtonEnabled = (buttonNum: 1 | 2, enabled: boolean) => {
    if (buttonNum === 1) {
      if (enabled) {
        setButton1({ label: 'Custom Button 1', url: '', color: 'bg-blue-600 hover:bg-blue-700' });
      } else {
        setButton1(undefined);
      }
    } else {
      if (enabled) {
        setButton2({ label: 'Custom Button 2', url: '', color: 'bg-blue-600 hover:bg-blue-700' });
      } else {
        setButton2(undefined);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-4">
        <p className="text-white/60">Loading custom button settings...</p>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center gap-2 text-yellow-400">
          <AlertCircle size={18} />
          <p className="text-sm">Unable to load settings. Please refresh.</p>
        </div>
      </div>
    );
  }

  const renderButtonConfig = (
    buttonNum: 1 | 2,
    button: CustomButton | undefined,
    label: string
  ) => {
    const isEnabled = button !== undefined;
    const selectedTrackCount = button?.trackIds?.length || 0;

    return (
      <div className="space-y-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => toggleButtonEnabled(buttonNum, e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer"
          />
          <span className="text-white font-medium">{label}</span>
        </div>

        {isEnabled && button && (
          <div className="space-y-3 ml-7">
            {/* Label Input */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Button Label</label>
              <input
                type="text"
                value={button.label}
                onChange={(e) => updateButton(buttonNum, 'label', e.target.value)}
                placeholder="e.g., Download, Learn More, Shop"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.12] text-white placeholder-white/30 focus:outline-none focus:border-white/[0.25] transition-colors"
              />
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm text-white/60 mb-2">URL/Link</label>
              <input
                type="url"
                value={button.url}
                onChange={(e) => updateButton(buttonNum, 'url', e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.12] text-white placeholder-white/30 focus:outline-none focus:border-white/[0.25] transition-colors"
              />
            </div>

            {/* Track Selection */}
            <div>
              <label className="block text-sm text-white/60 mb-2">
                Filter Tracks {selectedTrackCount > 0 && <span className="text-white font-medium">({selectedTrackCount} selected)</span>}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsTrackModalOpen(buttonNum)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/[0.1] border border-white/[0.2] text-white/80 hover:text-white hover:bg-white/[0.15] transition-colors text-sm font-medium"
                >
                  {selectedTrackCount > 0 ? `${selectedTrackCount} Tracks Selected` : 'Select Tracks...'}
                </button>
                {selectedTrackCount > 0 && (
                  <button
                    onClick={() => clearTrackSelection(buttonNum)}
                    className="px-3 py-2 rounded-lg bg-white/[0.1] border border-white/[0.2] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-white/40 mt-1">Leave empty to show all tracks</p>
            </div>

            {/* Color Selector */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Button Color</label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateButton(buttonNum, 'color', option.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      button.color === option.value
                        ? `${option.displayColor} text-white border-2 border-white`
                        : `${option.displayColor} text-white/80 border border-white/[0.12]`
                    }`}
                    title={option.label}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Preview</label>
              <button
                disabled
                className={`px-4 py-2 rounded-lg text-white font-medium ${button.color}`}
              >
                {button.label} {selectedTrackCount > 0 && `(${selectedTrackCount} tracks)`}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTrackSelectionModal = (buttonNum: 1 | 2) => {
    if (isTrackModalOpen !== buttonNum) return null;

    const button = buttonNum === 1 ? button1 : button2;
    const selectedTrackIds = button?.trackIds || [];

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsTrackModalOpen(null)}
        />

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.08] bg-white/[0.04]">
              <div>
                <h2 className="text-lg font-bold text-white">Select Tracks</h2>
                <p className="text-xs text-white/40 mt-1">
                  {selectedTrackIds.length} of {allTracks.length} tracks selected
                </p>
              </div>
              <button
                onClick={() => setIsTrackModalOpen(null)}
                className="p-2 hover:bg-white/[0.1] rounded-lg transition-colors text-white/60 hover:text-white"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-4 border-b border-white/[0.08]">
              <input
                type="text"
                placeholder="Search tracks by title or artist..."
                value={trackSearchQuery}
                onChange={(e) => setTrackSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.12] text-white placeholder-white/30 focus:outline-none focus:border-white/[0.25] transition-colors"
              />
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {tracksLoading ? (
                <div className="text-center py-8 text-white/60">Loading tracks...</div>
              ) : filteredTracks.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  {trackSearchQuery ? 'No tracks match your search' : 'No tracks available'}
                </div>
              ) : (
                filteredTracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => toggleTrackSelection(buttonNum, track.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      selectedTrackIds.includes(track.id)
                        ? 'bg-blue-500/20 border-blue-500/40 text-white'
                        : 'bg-white/[0.06] border-white/[0.12] text-white/80 hover:bg-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{track.title}</p>
                        <p className="text-xs text-white/60 truncate">{track.artist}</p>
                      </div>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                        selectedTrackIds.includes(track.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-white/[0.25]'
                      }`}>
                        {selectedTrackIds.includes(track.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-white/[0.08] bg-white/[0.04]">
              <button
                onClick={() => clearTrackSelection(buttonNum)}
                disabled={selectedTrackIds.length === 0}
                className="px-4 py-2.5 bg-white/[0.08] border border-white/[0.15] rounded-lg font-bold uppercase tracking-wider text-xs text-white/60 hover:text-white hover:bg-white/[0.12] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsTrackModalOpen(null)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold uppercase tracking-wider text-xs hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Done ({selectedTrackIds.length})
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.06] transition-all"
        >
          <h3 className="text-lg font-semibold text-white">Custom Track Buttons</h3>
          {isExpanded ? (
            <ChevronUp size={20} className="text-white/40" />
          ) : (
            <ChevronDown size={20} className="text-white/40" />
          )}
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="px-6 py-4 space-y-4 border-t border-white/[0.06]">
            {/* Info Text */}
            <p className="text-sm text-white/60">
              Configure up to 2 custom buttons that will appear on track cards and in modals. Optionally filter which tracks are displayed when the button is selected.
            </p>

            {/* Button Configs */}
            {renderButtonConfig(1, button1, 'Custom Button 1')}
            {renderButtonConfig(2, button2, 'Custom Button 2')}

            {/* Save Messages */}
            {saveMessage && (
              <div
                className={`p-3 rounded-lg text-sm font-medium ${
                  saveMessage.type === 'success'
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                    : 'bg-red-500/20 border border-red-500/30 text-red-400'
                }`}
              >
                {saveMessage.text}
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSaving ? 'Saving...' : 'Save Custom Buttons'}
            </button>
          </div>
        )}
      </div>

      {/* Track Selection Modals */}
      {renderTrackSelectionModal(1)}
      {renderTrackSelectionModal(2)}
    </>
  );
};

export default CustomButtonConfig;
