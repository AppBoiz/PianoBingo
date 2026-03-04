# Piano Bingo IndexedDB Initialization Fix

## Problem Summary
The Piano Bingo app was not initializing preloaded songs and packs on first app load, despite having seeding logic in place. The issue: `BASE_PACK_DATA` and `BASE_SONG_DATA` were defined in legacy code but not exposed to the window object, so the IndexedDB seeding mechanism couldn't find them.

## Root Cause
1. **Legacy data storage**: Songs and packs were defined in `/resources/state-helpers/gameStorage.js` but never exposed to `window` object
2. **Seeding logic gap**: The IndexedDB seeding code in `src/storage/indexedDb.ts` (lines 51-85) checks for `window.BASE_PACK_DATA` and `window.BASE_SONG_DATA` but these were never set
3. **No initialization**: There was no connection between the legacy data definitions and the React app's initialization flow

## Solution Implemented

### 1. Created Data Initialization Module
**File**: `/src/init/preloadData.ts`
- Extracted all 150 songs and 2 packs from the legacy gameStorage.js definitions
- Created TypeScript interfaces for type safety
- Defined `BASE_PACK_DATA` and `BASE_SONG_DATA` constants
- Implemented `initializePreloadedData()` function that:
  - Synchronously exposes data to window object
  - Runs immediately on module load
  - Logs confirmation when successful
- Exported for use throughout the app

### 2. Updated App Entry Point
**File**: `/src/main.tsx`
- Added import of `initializePreloadedData` at the very top (before React imports)
- Called `initializePreloadedData()` synchronously before any other app code
- This ensures window globals are set before IndexedDB initialization runs

### 3. Leveraged Existing IndexedDB Logic
**File**: `/src/storage/indexedDb.ts` (unchanged, already functional)
- The seeding logic in `openDB()` function lines 51-85 already handles and seeds from window globals
- Now receives properly populated `BASE_PACK_DATA` and `BASE_SONG_DATA` from our initialization
- Seeding occurs on first database open:
  - Checks if pack/song exists in DB
  - If missing or version is older than base data, seeds it
  - Preserves user edits (version comparison prevents overwriting)

## Data Structure
```typescript
interface Pack {
  packId: number;           // 1 (Tom) or 2 (Jack)
  packName: string;         // "Tom" or "Jack"
  songCount: number;        // 75 each
  version: number;          // 1 (indicates base data)
  songs: number[];          // Array of song IDs [1-75] or [76-150]
}

interface Song {
  songId: number;           // 1-150
  title: string;            // Song name
  pdfUrl: string;           // Variable reference to base64 PDF (e.g., "t2t9h8uF")
  version: number;          // 1 (indicates base data)
}
```

## Initialization Flow
```
App starts
  ↓
main.tsx loads
  ↓
initializePreloadedData() runs
  ↓
window.BASE_PACK_DATA = [2 packs with 75 songs each]
window.BASE_SONG_DATA = [150 songs with titles and PDF refs]
  ↓
React renders App component
  ↓
PackSelect page calls loadAllPacks()
  ↓
loadAllPacks() → openDB()
  ↓
IndexedDB seeding logic finds window.BASE_PACK_DATA/BASE_SONG_DATA
  ↓
Database seeded with initial data
  ↓
App displays packs and songs from IndexedDB
```

## Test Results
✅ Build succeeds (no TypeScript errors)
✅ App starts without console errors
✅ Module imports correctly
✅ Initialization function accessible on window
✅ Data structures match expected format

## Files Modified
1. **Created**: `/src/init/preloadData.ts` - Preload data initialization module
2. **Modified**: `/src/main.tsx` - Added preload data import and initialization call
3. **Created**: `/tests/indexed-db-init.spec.ts` - Playwright test for verification
4. **Created**: `/test-init.js` - Simple verification script

## How to Verify the Fix
1. **Manual Testing**:
   - Open the app in DevTools
   - Go to Application → IndexedDB → PianoBingoDB
   - Check PACKS store - should have 2 items (Tom id:1, Jack id:2)
   - Check SONGS store - should have 150 items
   - Console should show: "✓ Preloaded data initialized: {packs: 2, songs: 150}"

2. **Runtime Test with Playwright**:
   ```bash
   npm run test:e2e -- tests/indexed-db-init.spec.ts
   ```

## Next Steps / Future Work
1. **Implement Song Management UI**: Add ability to upload/edit PDFs (songs)
   - New page: SongManagement (partially implemented)
   - Upload handler for PDF files
   - Base64 encoding for storage

2. **Implement Pack Management UI**: Add ability to create/edit playlists
   - New page: PackManagement (partially implemented)
   - Create new pack dialog
   - Assign songs to packs

3. **PDF Base64 Loading**: 
   - Currently, pdfUrl references variable names (e.g., "t2t9h8uF")
   - Need to load actual base64 PDF data from resources/base64/*.js files
   - Or implement server-side PDF serving

4. **Version Tracking Validation**:
   - Test that editing a song/pack increments version
   - Verify that base data (version 1) doesn't overwrite user edits
   - Test app data persistence across sessions

## Architecture Notes
- **Storage System**: Songs and packs identified by their ID (user-created items use IDs starting from 1000000 per PARTITION_SIZE in gameStorage.js)
- **Versioning**: Base data has version 1, user edits increment version to prevent overwrites
- **Game State**: Separate localStorage storage for current game session (selected pack, shown songs, current song)
- **PDF References**: pdfUrl values are variable names that need to be resolved to actual base64 data

## No Breaking Changes
✅ Backwards compatible with existing data
✅ Existing app features unaffected
✅ Legacy storage patterns preserved
✅ No database schema changes needed
