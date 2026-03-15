/**
 * Preload legacy data into window for indexed DB seeding
 * This file provides BASE_PACK_DATA and BASE_SONG_DATA to the window
 * so that the indexed DB initialization can seed default packs and songs
 */

import type { Pack, Song } from '../shared/types/models'
import { PACK_SIZE } from '../shared/constants/game'

// Define BASE_PACK_DATA - all songs are split into two packs
const BASE_PACK_DATA: Pack[] = [
  {
    packId: 1,
    packName: 'Tom',
    songCount: PACK_SIZE,
    version: 1,
    songs: Array.from({ length: PACK_SIZE }, (_, i) => i + 1),
  },
  {
    packId: 2,
    packName: 'Jack',
    songCount: PACK_SIZE,
    version: 1,
    songs: Array.from({ length: PACK_SIZE }, (_, i) => i + PACK_SIZE + 1),
  },
];

// PDF base64 data will be loaded and made available globally
// These map variable names to actual base64 content
let pdfMap: Record<string, string> = {};

// Define BASE_SONG_DATA with all 150 songs
// The pdfUrl will be resolved at runtime to actual base64 content
const BASE_SONG_DATA: Song[] = [
  { songId: 1, title: 'Colours in her Hair', pdfUrl: 't2t9h8uF', version: 1 },
  { songId: 2, title: 'Angels', pdfUrl: 'vGmcIpQy', version: 1 },
  { songId: 3, title: 'I want it that way', pdfUrl: 'VQ84rjzX', version: 1 },
  { songId: 4, title: 'Tainted love', pdfUrl: 'vgZ6ZoA3', version: 1 },
  { songId: 5, title: 'I will survive', pdfUrl: 'gU0mVk24', version: 1 },
  { songId: 6, title: "Friday I'm in love", pdfUrl: 'JcBMzrvW', version: 1 },
  { songId: 7, title: 'Agadoo', pdfUrl: 'xuMfhMkZ', version: 1 },
  { songId: 8, title: 'Yellow', pdfUrl: 'NtZcTtk5', version: 1 },
  { songId: 9, title: 'Pinball wizard', pdfUrl: 'xUZXXHIn', version: 1 },
  { songId: 10, title: 'Shine', pdfUrl: 'IrVRcDwk', version: 1 },
  { songId: 11, title: '1999', pdfUrl: 'DFQE4IqG', version: 1 },
  { songId: 12, title: 'must be love', pdfUrl: 'JMnDEunX', version: 1 },
  { songId: 13, title: 'Zombie', pdfUrl: 'Ezvt7wcm', version: 1 },
  { songId: 14, title: 'Money for nothing', pdfUrl: 'iDT5t1TB', version: 1 },
  { songId: 15, title: 'Proud Mary', pdfUrl: 'sJOW6lrq', version: 1 },
  { songId: 16, title: 'Hi Ho Silver Lining', pdfUrl: 'HEAHizIm', version: 1 },
  { songId: 17, title: 'Tequila', pdfUrl: 'E97GuiGU', version: 1 },
  { songId: 18, title: 'Fast car', pdfUrl: 'S2oBbnww', version: 1 },
  { songId: 19, title: 'Viva la Vida', pdfUrl: 'hsSZacsv', version: 1 },
  { songId: 20, title: 'Iris', pdfUrl: 'IaN1Z9S0', version: 1 },
  { songId: 21, title: 'Levitating', pdfUrl: 'pgZlDppE', version: 1 },
  { songId: 22, title: "What's up", pdfUrl: 'dzYDM7gq', version: 1 },
  { songId: 23, title: 'Babylon', pdfUrl: 'iRw8USST', version: 1 },
  { songId: 24, title: "I don't wanna talk about it", pdfUrl: 'kYCtYhkn', version: 1 },
  { songId: 25, title: 'Stand by me', pdfUrl: 'Y1aj6VHJ', version: 1 },
  { songId: 26, title: 'Suspicious minds', pdfUrl: 'XHAJmOKz', version: 1 },
  { songId: 27, title: 'Where is the love', pdfUrl: 'vqdWTl68', version: 1 },
  { songId: 28, title: 'Seven Nation Army', pdfUrl: 'Me49goYY', version: 1 },
  { songId: 29, title: 'My Sharona', pdfUrl: 'eixmZi0l', version: 1 },
  { songId: 30, title: 'Karma chameleon', pdfUrl: 'DHlxjgyF', version: 1 },
  { songId: 31, title: 'Complicated', pdfUrl: 'T00KGZAQ', version: 1 },
  { songId: 32, title: 'Stick season', pdfUrl: 'Q0q1j30C', version: 1 },
  { songId: 33, title: 'Escape (The Pina Colada Song)', pdfUrl: '_Oam7mS6', version: 1 },
  { songId: 34, title: 'Break my stride', pdfUrl: 'BbOgFuyA', version: 1 },
  { songId: 35, title: 'Empire state of mind', pdfUrl: 'Xc8Kr1bu', version: 1 },
  { songId: 36, title: 'Black velvet', pdfUrl: '_0LErfZN', version: 1 },
  { songId: 37, title: 'American pie', pdfUrl: 'zdcnwoe5', version: 1 },
  { songId: 38, title: 'YMCA', pdfUrl: 'q5DaFqXE', version: 1 },
  { songId: 39, title: 'Thunderstruck', pdfUrl: 'AAHmBOjZ', version: 1 },
  { songId: 40, title: 'Take me home, Country roads', pdfUrl: 'd9cAYgi6', version: 1 },
  { songId: 41, title: 'Never gonna give you up', pdfUrl: 'uawcQiWP', version: 1 },
  { songId: 42, title: '9 to 5', pdfUrl: 'P7I7EB6X', version: 1 },
  { songId: 43, title: 'Gold', pdfUrl: 'Ncur1AOv', version: 1 },
  { songId: 44, title: 'Amarillo', pdfUrl: 't11tVAv4', version: 1 },
  { songId: 45, title: 'Just can\'t get enough', pdfUrl: 'cyepfP14', version: 1 },
  { songId: 46, title: 'Fat bottomed girls', pdfUrl: 'f1B9TYH0', version: 1 },
  { songId: 47, title: 'Let it be', pdfUrl: 'PU6VJusG', version: 1 },
  { songId: 48, title: "Don't look back in anger", pdfUrl: 'PVk3Fio6', version: 1 },
  { songId: 49, title: "I don't like Mondays", pdfUrl: 'nrgopxsT', version: 1 },
  { songId: 50, title: 'Piano man', pdfUrl: 'wQWj94Tj', version: 1 },
  { songId: 51, title: "Don't wanna miss a thing", pdfUrl: 'ApwzLpnZ', version: 1 },
  { songId: 52, title: 'Love story', pdfUrl: 'dS640cJd', version: 1 },
  { songId: 53, title: 'Breakeven', pdfUrl: 'DNn97Szc', version: 1 },
  { songId: 54, title: 'Take on me', pdfUrl: 'fUQyhmmg', version: 1 },
  { songId: 55, title: 'Somebody to love', pdfUrl: 'yt0FUbWR', version: 1 },
  { songId: 56, title: 'Let me entertain you', pdfUrl: 'FY72NFyP', version: 1 },
  { songId: 57, title: 'Rockin\' all over the world', pdfUrl: 'TnZd1nDE', version: 1 },
  { songId: 58, title: "I'm gonna be", pdfUrl: 'mxh9CirY', version: 1 },
  { songId: 59, title: 'Werewolves of London', pdfUrl: 'gYouwW3Z', version: 1 },
  { songId: 60, title: 'Crocodile rock', pdfUrl: 'pXwZOHkz', version: 1 },
  { songId: 61, title: 'Delilah', pdfUrl: 'pfafrhMg', version: 1 },
  { songId: 62, title: 'Half the world away', pdfUrl: 'L8unoJPJ', version: 1 },
  { songId: 63, title: "Annie's song", pdfUrl: 'iB6k7yTQ', version: 1 },
  { songId: 64, title: 'Wild rover', pdfUrl: 'QqQX0odt', version: 1 },
  { songId: 65, title: 'Ruby', pdfUrl: 't2KtKHvb', version: 1 },
  { songId: 66, title: 'Enter sandman', pdfUrl: 'yh9jgen8', version: 1 },
  { songId: 67, title: 'Freedom', pdfUrl: 'XBjZh0YA', version: 1 },
  { songId: 68, title: 'Everybody needs somebody to love', pdfUrl: 'pDINKolg', version: 1 },
  { songId: 69, title: 'Summer of 69', pdfUrl: 'KbW7Slzv', version: 1 },
  { songId: 70, title: "Livin' La Vida Loca", pdfUrl: 'B0ynHpJZ', version: 1 },
  { songId: 71, title: "Don't you want me", pdfUrl: 'ehMIoT9C', version: 1 },
  { songId: 72, title: 'Chasing cars', pdfUrl: 'kDXFMaMI', version: 1 },
  { songId: 73, title: 'A little respect', pdfUrl: 'bu4B94it', version: 1 },
  { songId: 74, title: 'Bat out of hell', pdfUrl: 'uD7wWIHf', version: 1 },
  { songId: 75, title: "She's always a woman", pdfUrl: 'WmC0m7H7', version: 1 },
  { songId: 76, title: 'Jack.', pdfUrl: 'fPfBXGLP', version: 1 },
  { songId: 77, title: 'Jack.', pdfUrl: 'CmC3vxGU', version: 1 },
  { songId: 78, title: 'Jack.', pdfUrl: 'bkA8OMsM', version: 1 },
  { songId: 79, title: 'Jack.', pdfUrl: 'zsdzs0SZ', version: 1 },
  { songId: 80, title: 'Jack.', pdfUrl: 'WIjz1hLv', version: 1 },
  { songId: 81, title: 'Jack.', pdfUrl: 'k5HRjnfW', version: 1 },
  { songId: 82, title: 'Jack.', pdfUrl: 'GvzjkMLL', version: 1 },
  { songId: 83, title: 'Jack.', pdfUrl: 'VUUd6mhn', version: 1 },
  { songId: 84, title: 'Jack.', pdfUrl: 'cjqL3lhO', version: 1 },
  { songId: 85, title: 'Jack.', pdfUrl: 'JmytEVsm', version: 1 },
  { songId: 86, title: 'Jack.', pdfUrl: 'j05TLqFJ', version: 1 },
  { songId: 87, title: 'Jack.', pdfUrl: 'fczvkUQa', version: 1 },
  { songId: 88, title: 'Jack.', pdfUrl: 'lqpVmJuJ', version: 1 },
  { songId: 89, title: 'Jack.', pdfUrl: 'UFeKNQot', version: 1 },
  { songId: 90, title: 'Jack.', pdfUrl: 'OW7106u9', version: 1 },
  { songId: 91, title: 'Jack.', pdfUrl: 'BanWQsmO', version: 1 },
  { songId: 92, title: 'Jack.', pdfUrl: 'r7BPFnSn', version: 1 },
  { songId: 93, title: 'Jack.', pdfUrl: 'ksKbNbwB', version: 1 },
  { songId: 94, title: 'Jack.', pdfUrl: 'PFbps3JJ', version: 1 },
  { songId: 95, title: 'Jack.', pdfUrl: 'ru9HOcSJ', version: 1 },
  { songId: 96, title: 'Jack.', pdfUrl: 'Mgc96C0j', version: 1 },
  { songId: 97, title: 'Jack.', pdfUrl: 'nNAvty21', version: 1 },
  { songId: 98, title: 'Jack.', pdfUrl: 'Q5a08YVh', version: 1 },
  { songId: 99, title: 'Jack.', pdfUrl: 'H0rZVSCW', version: 1 },
  { songId: 100, title: 'Jack.', pdfUrl: 'Wm5Cs4kB', version: 1 },
  { songId: 101, title: 'Jack.', pdfUrl: 'IG7zhyr9', version: 1 },
  { songId: 102, title: 'Jack.', pdfUrl: 'mv5VjHU2', version: 1 },
  { songId: 103, title: 'Jack.', pdfUrl: 'W7sKX8DQ', version: 1 },
  { songId: 104, title: 'Jack.', pdfUrl: 'fnCb8MBU', version: 1 },
  { songId: 105, title: 'Jack.', pdfUrl: 'z8RhHbH1', version: 1 },
  { songId: 106, title: 'Jack.', pdfUrl: 'cWctTnK4', version: 1 },
  { songId: 107, title: 'Jack.', pdfUrl: 'znACq7Ia', version: 1 },
  { songId: 108, title: 'Jack.', pdfUrl: 'sWnnhg66', version: 1 },
  { songId: 109, title: 'Jack.', pdfUrl: 'GggfiKOw', version: 1 },
  { songId: 110, title: 'Jack.', pdfUrl: 'DYWO9h4p', version: 1 },
  { songId: 111, title: 'Jack.', pdfUrl: 'axQyzObr', version: 1 },
  { songId: 112, title: 'Jack.', pdfUrl: 'Xu4jSCnJ', version: 1 },
  { songId: 113, title: 'Jack.', pdfUrl: 'N1JpCAWl', version: 1 },
  { songId: 114, title: 'Jack.', pdfUrl: 'GAx7TmjT', version: 1 },
  { songId: 115, title: 'Jack.', pdfUrl: 'brL0lepF', version: 1 },
  { songId: 116, title: 'Jack.', pdfUrl: '_Qroiyh8', version: 1 },
  { songId: 117, title: 'Jack.', pdfUrl: 'iNOshzSq', version: 1 },
  { songId: 118, title: 'Jack.', pdfUrl: 't4CEdDDH', version: 1 },
  { songId: 119, title: 'Jack.', pdfUrl: 'hEgbFPY1', version: 1 },
  { songId: 120, title: 'Jack.', pdfUrl: 'lv3Qd43h', version: 1 },
  { songId: 121, title: 'Jack.', pdfUrl: 'a9e7Poyt', version: 1 },
  { songId: 122, title: 'Jack.', pdfUrl: 'PBUA77rz', version: 1 },
  { songId: 123, title: 'Jack.', pdfUrl: 'hUylbVAC', version: 1 },
  { songId: 124, title: 'Jack.', pdfUrl: 'Y0CbTFre', version: 1 },
  { songId: 125, title: 'Jack.', pdfUrl: 'y2P8jxvD', version: 1 },
  { songId: 126, title: 'Jack.', pdfUrl: 'mXTkt8ki', version: 1 },
  { songId: 127, title: 'Jack.', pdfUrl: 'W4aCSHJ6', version: 1 },
  { songId: 128, title: 'Jack.', pdfUrl: 'PDhH1wGY', version: 1 },
  { songId: 129, title: 'Jack.', pdfUrl: 'mqisy5Q4', version: 1 },
  { songId: 130, title: 'Jack.', pdfUrl: 'NxB8QQZW', version: 1 },
  { songId: 131, title: 'Jack.', pdfUrl: 'THZ2rCH5', version: 1 },
  { songId: 132, title: 'Jack.', pdfUrl: 'HcZm90bq', version: 1 },
  { songId: 133, title: 'Jack.', pdfUrl: 'LVhu2alN', version: 1 },
  { songId: 134, title: 'Jack.', pdfUrl: 'Bv9L8e9b', version: 1 },
  { songId: 135, title: 'Jack.', pdfUrl: 'DxsYvk8O', version: 1 },
  { songId: 136, title: 'Jack.', pdfUrl: 's8O9rOP1', version: 1 },
  { songId: 137, title: 'Jack.', pdfUrl: 'qwPxXA6r', version: 1 },
  { songId: 138, title: 'Jack.', pdfUrl: 'x4AfvzV6', version: 1 },
  { songId: 139, title: 'Jack.', pdfUrl: 'yDSb2r49', version: 1 },
  { songId: 140, title: 'Jack.', pdfUrl: 'SDO69ctw', version: 1 },
  { songId: 141, title: 'Jack.', pdfUrl: 'IGeYRc38', version: 1 },
  { songId: 142, title: 'Jack.', pdfUrl: 'jb8iJPYa', version: 1 },
  { songId: 143, title: 'Jack.', pdfUrl: 'chkxfLJa', version: 1 },
  { songId: 144, title: 'Jack.', pdfUrl: 'CSFgpwTQ', version: 1 },
  { songId: 145, title: 'Jack.', pdfUrl: 'NJnndijl', version: 1 },
  { songId: 146, title: 'Jack.', pdfUrl: 'XfekGGLS', version: 1 },
  { songId: 147, title: 'Jack.', pdfUrl: 'JoAH9HEs', version: 1 },
  { songId: 148, title: 'Jack.', pdfUrl: 'ZWAqzjPV', version: 1 },
  { songId: 149, title: 'Jack.', pdfUrl: 'ShnVrzBd', version: 1 },
  { songId: 150, title: 'Jack.', pdfUrl: 'cp9jpjZK', version: 1 },
];

// Export them for use in the app
export { BASE_PACK_DATA, BASE_SONG_DATA };

/**
 * Load base64 PDFs from resource files
 * This resolves variable names in pdfUrl to actual base64 content
 */
async function loadPdfData() {
  try {
    // Load all PDF data files
    const [allPdfs, packJack, packTom] = await Promise.all([
      fetch('/resources/base64/all_pdfs.js').then(r => r.text()),
      fetch('/resources/base64/pack_jack.js').then(r => r.text()),
      fetch('/resources/base64/pack_tom.js').then(r => r.text()),
    ]);

    // Extract all base64 PDFs from the files using regex
    // Pattern: const VARIABLE_NAME = 'BASE64_CONTENT...';
    // Regex matches base64 + whitespace to handle newlines in middle of strings
    const pdfRegex = /const\s+(\w+)\s*=\s*['"]([A-Za-z0-9+/=\s]+)['"]/g;
    
    for (const content of [allPdfs, packJack, packTom]) {
      let match;
      while ((match = pdfRegex.exec(content)) !== null) {
        const [, variableName, base64Data] = match;
        // Remove all whitespace from base64 data before storing
        const cleanedBase64 = base64Data.replace(/\s/g, '');
        pdfMap[variableName] = cleanedBase64;
      }
    }

    console.log(`✓ Loaded ${Object.keys(pdfMap).length} PDF resources`);
    return pdfMap;
  } catch (error) {
    console.warn('Failed to load PDF resources:', error);
    return {};
  }
}

/**
 * Resolve PDF URL to actual base64 content
 * If pdfUrl is a variable name, looks it up in the pdfMap
 */
export function resolvePdfUrl(pdfUrl: string): string | null {
  if (!pdfUrl) return null;
  
  // If it's already valid base64 (starts with PDF signature), return as-is
  if (pdfUrl.startsWith('JVBERi0')) {
    return pdfUrl;
  }
  
  // Otherwise, try to resolve from pdfMap
  if (pdfMap[pdfUrl]) {
    console.debug(`✓ Resolved PDF: ${pdfUrl} (${pdfMap[pdfUrl].length} bytes)`);
    return pdfMap[pdfUrl];
  }
  
  // If it's on window object (fallback for dynamic resolution)
  const dynamicWindow = window as unknown as Record<string, unknown>
  if (typeof window !== 'undefined' && typeof dynamicWindow[pdfUrl] === 'string') {
    const resolved = dynamicWindow[pdfUrl] as string
    console.debug(`✓ Resolved PDF from window: ${pdfUrl}`);
    return resolved;
  }
  
  // Log available PDFs for debugging on first failure
  if (Object.keys(pdfMap).length > 0) {
    console.warn(`✗ PDF not found: "${pdfUrl}". Available PDFs: ${Object.keys(pdfMap).slice(0, 5).join(', ')}... (total: ${Object.keys(pdfMap).length})`);
  } else {
    console.warn(`✗ PDF not found: "${pdfUrl}". No PDFs loaded yet.`);
  }
  return null;
}

/**
 * Initialize preloaded data on the window object
 * This must be called SYNCHRONOUSLY before the React app initializes IndexedDB
 */
export async function initializePreloadedData() {
  try {
    // Load PDF data first
    await loadPdfData();
    
    // Set the data on the window object for IndexedDB to access
    window.BASE_PACK_DATA = BASE_PACK_DATA;
    window.BASE_SONG_DATA = BASE_SONG_DATA;
    
    // Store PDF resolution function on window for use by PDFViewer
    window.resolvePdfUrl = resolvePdfUrl;
    
    console.log('✓ Preloaded data initialized:', {
      packs: BASE_PACK_DATA.length,
      songs: BASE_SONG_DATA.length,
      pdfs: Object.keys(pdfMap).length
    });
  } catch (error) {
    console.error('Failed to initialize preloaded data:', error);
  }
}

// Execute initialization immediately on module load
if (typeof window !== 'undefined') {
  initializePreloadedData().catch(err => 
    console.error('Async initialization failed:', err)
  );
}
