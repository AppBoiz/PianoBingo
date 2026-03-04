# PDF Loading Fix - Piano Bingo

## Problem
When viewing PDFs in the app, users encountered the error:
```
{
  "message": "Invalid PDF structure.",
  "name": "InvalidPDFException"
}
```

## Root Cause
The `pdfUrl` field in song data contained variable names (e.g., `"t2t9h8uF"`) rather than actual base64-encoded PDF content. These variable names referenced base64 PDFs defined in resource files (`/resources/base64/*.js`), but the PDFs were never being resolved to their actual content.

**The data flow gap:**
```
Songs have: pdfUrl = "t2t9h8uF" (just a variable name string)
           ↓
PDFViewer receives: base64 = "t2t9h8uF" (still just a string)
           ↓
PDF.js tries to decode "t2t9h8uF" as base64
           ↓
Fails because it's not valid base64, it's a variable name
```

## Solution Implemented

### 1. **Created PDF Loader Module**
**File:** `/src/init/preloadData.ts`

The module now:
- Loads all PDF resource files async: `all_pdfs.js`, `pack_jack.js`, `pack_tom.js`
- Extracts variable names and base64 content using regex: `/const\s+(\w+)\s*=\s*['"]([A-Za-z0-9+/=]+)['"]/g`
- Creates a mapping: `pdfMap = { "t2t9h8uF": "JVBERi0...", ... }`
- Exports `resolvePdfUrl()` function to convert variable names to actual base64 content
- Exposes on window for use by components: `window.resolvePdfUrl`

### 2. **Updated PDFViewer Component**
**File:** `/src/components/PDFViewer.tsx`

Now:
- Checks if `pdfUrl` is a variable name or already base64 content
- Calls `window.resolvePdfUrl(pdfUrl)` to resolve variable names to base64
- Falls back to legacy PDF loading if needed
- Logs warnings if PDF lookup fails

### 3. **Updated App Initialization**
**File:** `/src/main.tsx`

Now:
- Waits for `await initializePreloadedData()` to complete before rendering React
- Ensures PDFs are loaded and resolvePdfUrl is available before any components try to use it
- Maintains service worker registration and other initialization

## Data Flow (Fixed)
```
1. main.tsx loads module 
   ↓
2. initializePreloadedData() awaits
   ↓
3. Fetches /resources/base64/*.js files
   ↓
4. Extracts PDF data and creates pdfMap
   ↓
5. Exposes window.resolvePdfUrl function
   ↓
6. React mounts and renders
   ↓
7. User navigates to Song View
   ↓
8. SongView passes song.pdfUrl to PDFViewer
   ↓
9. PDFViewer calls window.resolvePdfUrl("t2t9h8uF")
   ↓
10. Returns actual base64: "JVBERi0xLjM..."
   ↓
11. PDF.js decodes and displays correctly ✓
```

## PDF Mapping
The regex extracts PDF variable mappings from base64 files:

```
From all_pdfs.js: { RGur3x5M: "JVBERi0...", S5GLu5JZ: "JVBERi0...", ... }
From pack_jack.js: { fPfBXGLP: "JVBERi0...", ... }
From pack_tom.js:  { t2t9h8uF: "JVBERi0...", ... }
```

Songs reference these variable names:
- Song 1: pdfUrl = "t2t9h8uF" → resolves to actual base64
- Song 2: pdfUrl = "vGmcIpQy" → resolves to actual base64
- etc.

## Testing & Verification

**Browser Console should show:**
```
✓ Loaded 75+ PDF resources
✓ Preloaded data initialized: {packs: 2, songs: 150, pdfs: 75}
```

**When viewing a PDF:**
- Look for: `✓ Resolved PDF: t2t9h8uF (19080 bytes)`
- PDF should render without "Invalid PDF structure" error

**Debug logging available:**
- `console.debug()` logs show each PDF resolution
- `console.warn()` logs show PDFs that couldn't be resolved

## Technical Details

### Regex for PDF Extraction
```javascript
const pdfRegex = /const\s+(\w+)\s*=\s*['"]([A-Za-z0-9+/=]+)['"]/g;
// Matches: const VARNAME = 'BASE64_CONTENT';
// Group 1: Variable name (e.g., "t2t9h8uF")
// Group 2: Base64 content (e.g., "JVBERi0xLjM...")
```

### Base64 PDF Detection
- Valid PDFs start with `JVBERi0` (base64 for PDF file signature `%PDF-1`)
- Used to distinguish actual base64 from variable names

### Async Initialization Timing
- `initializePreloadedData()` returns a Promise
- React rendering waits for this promise before mounting
- Prevents race condition where components try to access PDFs before they're loaded

## Files Modified
1. **Created:** `/src/init/preloadData.ts` - PDF loading and resolution
2. **Modified:** `/src/components/PDFViewer.tsx` - PDF URL resolution
3. **Modified:** `/src/main.tsx` - Async initialization bootstrap

## Backwards Compatibility
✅ Existing SQL/IndexedDB data unaffected
✅ Existing game state storage unaffected  
✅ Existing song data structure unaffected
✅ No breaking changes to component APIs

## Known Limitations
- Songs 76-150 (Jack pack) may use stub PDF data if PDF files aren't in resource directory
- Large PDF files (>200KB) may impact initial load time
- PDF resolution happens on-demand (first time viewed), not preloaded

## Future Improvements
1. Cache resolved PDFs in localStorage to speed up subsequent loads
2. Add service worker caching for PDF resource files
3. Implement PDF preloading for frequently-used songs
4. Add fallback/placeholder PDF for missing resources
