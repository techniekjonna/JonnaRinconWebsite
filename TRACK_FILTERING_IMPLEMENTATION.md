# Custom Button Track Filtering Implementation

## Overview

Custom buttons now support optional track filtering. Admins can select specific tracks to display when a custom button is active, or leave the selection empty to show all tracks (default, backward compatible behavior).

## Features Implemented

### 1. Updated CustomButton Type
- Added optional `trackIds?: string[]` field to `CustomButton` interface in `settingsService.ts`
- Stores an array of track IDs that should be displayed when the button is selected

### 2. Track Selection UI in CustomButtonConfig
- Modal dialog for selecting tracks (similar to album selection patterns in the codebase)
- Search functionality to filter tracks by title or artist
- Checkbox selection with visual feedback
- Display of selected track count
- Clear selection button
- Preview shows track count when tracks are selected

### 3. Track Filtering Utilities
- `filterTracksByButton()` function in `customButtonUtils.ts` that:
  - Returns all tracks if `trackIds` is empty or undefined (backward compatible)
  - Returns only selected tracks if `trackIds` array is populated
- `useCustomButtonTracks()` and `useCustomButtonTracksForButton()` hooks for easy integration

### 4. CustomButtonGroup Updates
- Added optional `showTrackCount` prop to display track count on buttons
- Button text can show "(X tracks)" when tracks are selected

## File Changes

### Modified Files:
1. **src/lib/firebase/services/settingsService.ts**
   - Added `trackIds?: string[]` to `CustomButton` interface

2. **src/components/admin/CustomButtonConfig.tsx**
   - Added track selection modal with search
   - Added track filtering UI in button configuration
   - Shows selected track count in preview

3. **src/lib/utils/customButtonUtils.ts**
   - Added `filterTracksByButton()` function
   - Imports Track type from firebase/types

4. **src/components/CustomButtonGroup.tsx**
   - Added `showTrackCount` prop
   - Displays track count in button label when relevant

### New Files:
1. **src/hooks/useCustomButtonTracks.ts**
   - `useCustomButtonTracks()` hook for filtering tracks
   - `useCustomButtonTracksForButton()` hook for convenience

## Usage Examples

### In a Component Using Custom Buttons

```typescript
import { useTracks } from '../hooks/useTracks';
import { useTrackSettings } from '../hooks/useTrackSettings';
import { useCustomButtonTracks } from '../hooks/useCustomButtonTracks';
import CustomButtonGroup from '../components/CustomButtonGroup';

function MyTracksComponent() {
  const { tracks } = useTracks({ status: 'published' });
  const { settings } = useTrackSettings();

  // Filter tracks based on custom button selection
  const button1Tracks = useCustomButtonTracks(tracks, settings?.customButton1);

  // Alternatively, use this for more details:
  const { tracks: filteredTracks, selectedTrackCount } = useCustomButtonTracksForButton(
    tracks,
    settings?.customButton1,
    1
  );

  return (
    <div>
      <CustomButtonGroup
        button1={settings?.customButton1}
        button2={settings?.customButton2}
        showTrackCount={true}
      />
      
      {/* Display the filtered tracks */}
      <div>
        {filteredTracks.map(track => (
          <TrackCard key={track.id} track={track} />
        ))}
      </div>
    </div>
  );
}
```

### In TrackDetailModal or Similar Components

```typescript
import { filterTracksByButton } from '../lib/utils/customButtonUtils';

function TrackDetailModal({ track, allTracks, customButton }) {
  // Filter tracks to show in modal based on button selection
  const displayedTracks = filterTracksByButton(allTracks, customButton);

  return (
    <Modal>
      {/* Track details */}
      {/* Show related tracks - only those in the custom button selection if set */}
      <div>
        {displayedTracks.map(t => (
          <TrackItem key={t.id} track={t} />
        ))}
      </div>
    </Modal>
  );
}
```

## Backward Compatibility

The implementation is fully backward compatible:
- Existing custom buttons without `trackIds` or with empty `trackIds` array will show all tracks
- No changes needed to existing code that uses custom buttons
- The feature is opt-in via the admin UI

## How It Works

1. **Admin Configuration**: Admin navigates to Custom Track Buttons section in settings
2. **Select Tracks**: Clicks "Select Tracks..." button to open a modal
3. **Choose Tracks**: Admin can search and select specific tracks via checkboxes
4. **Save**: Changes are saved to Firestore with the `trackIds` array
5. **Usage**: When components use the custom button, they filter tracks using `filterTracksByButton()`

## Database Storage

The `trackIds` are stored in Firestore as part of the custom button configuration:

```javascript
{
  label: "Featured Tracks",
  url: "https://example.com",
  color: "bg-blue-600 hover:bg-blue-700",
  trackIds: ["track-id-1", "track-id-2", "track-id-3"]
}
```

## Integration Points

When implementing this feature in pages/modals:

1. Get all tracks using `useTracks()` hook
2. Get track settings using `useTrackSettings()` hook
3. Use `filterTracksByButton()` or the custom hooks to filter
4. Render the filtered track list
5. Pass custom buttons to `CustomButtonGroup` with `showTrackCount={true}` for better UX

This keeps the component logic clean and separates concerns between UI configuration and track display.
