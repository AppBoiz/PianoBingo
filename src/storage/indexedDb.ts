// TypeScript port (incremental) of resources/state-helpers/gameStorage.js
// Preserves DB name, object stores and public API. Seeding only runs
// when legacy BASE_PACK_DATA / BASE_SONG_DATA are present to avoid
// overwriting user data during migration.

export const INDEXED_BD_CONFIG = {
  DB_NAME: 'PianoBingoDB',
  DB_VERSION: 1,
  PARTITION_SIZE: 1000000,
  SCHEMAS: {
    PACKS: 'packs',
    SONGS: 'songs'
  }
} as const;

export const DB_TRANSACTION_TYPES = {
  READ_WRITE: 'readwrite',
  READ: 'readonly'
} as const;

type Pack = any;
type Song = any;

let firstTimeOpeningDB = true;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXED_BD_CONFIG.DB_NAME, INDEXED_BD_CONFIG.DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(INDEXED_BD_CONFIG.SCHEMAS.PACKS)) {
        db.createObjectStore(INDEXED_BD_CONFIG.SCHEMAS.PACKS, { keyPath: 'packId' });
      }
      if (!db.objectStoreNames.contains(INDEXED_BD_CONFIG.SCHEMAS.SONGS)) {
        db.createObjectStore(INDEXED_BD_CONFIG.SCHEMAS.SONGS, { keyPath: 'songId' });
      }
    };

    request.onsuccess = async () => {
      const db = request.result;

      if (firstTimeOpeningDB) {
        firstTimeOpeningDB = false;

        // Try to seed with legacy globals if available (migration safe)
        try {
          const packs = await loadAllPacks();

          // @ts-ignore - may be provided by legacy file during migration
          if (typeof (window as any).BASE_PACK_DATA !== 'undefined') {
            // @ts-ignore
            for (const BASE_PACK of (window as any).BASE_PACK_DATA) {
              const existing = packs.find((p: any) => p.packId === BASE_PACK.packId);
              if (!existing || existing.version < BASE_PACK.version) {
                await savePack(BASE_PACK);
              }
            }
          }

          const songs = await loadAllSongs();
          // @ts-ignore - may be provided by legacy file during migration
          if (typeof (window as any).BASE_SONG_DATA !== 'undefined') {
            // @ts-ignore
            for (const BASE_SONG of (window as any).BASE_SONG_DATA) {
              const existing = songs.find((s: any) => s.songId === BASE_SONG.songId);
              if (!existing || existing.version < BASE_SONG.version) {
                await saveSong(BASE_SONG);
              }
            }
          }
        } catch (err) {
          // If seeding fails, don't block opening DB
          console.warn('Seeding skipped or failed:', err);
        }
      }

      resolve(db);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function savePack(pack: Pack): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(INDEXED_BD_CONFIG.SCHEMAS.PACKS, DB_TRANSACTION_TYPES.READ_WRITE as IDBTransactionMode);
  const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.PACKS);
  try {
    pack.version = (pack.version || 0) + 1;
    store.put(pack);
    await (tx as any).complete?.();
  } finally {
    db.close();
  }
}

export async function loadPack(packId: number): Promise<Pack | null> {
  const db = await openDB();
  const tx = db.transaction(INDEXED_BD_CONFIG.SCHEMAS.PACKS, DB_TRANSACTION_TYPES.READ as IDBTransactionMode);
  const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.PACKS);
  const request = store.get(packId);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result || null);
      db.close();
    };
    request.onerror = () => {
      reject(request.error);
      db.close();
    };
  });
}

export async function loadAllPacks(): Promise<Pack[]> {
  const db = await openDB();
  const tx = db.transaction(INDEXED_BD_CONFIG.SCHEMAS.PACKS, DB_TRANSACTION_TYPES.READ as IDBTransactionMode);
  const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.PACKS);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result || []);
      db.close();
    };
    request.onerror = () => {
      reject(request.error);
      db.close();
    };
  });
}

export async function deletePack(packId: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(INDEXED_BD_CONFIG.SCHEMAS.PACKS, DB_TRANSACTION_TYPES.READ_WRITE as IDBTransactionMode);
  const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.PACKS);
  const request = store.delete(packId);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve();
      db.close();
    };
    request.onerror = () => {
      reject(request.error);
      db.close();
    };
  });
}

export async function saveSong(song: Song): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(INDEXED_BD_CONFIG.SCHEMAS.SONGS, DB_TRANSACTION_TYPES.READ_WRITE as IDBTransactionMode);
  const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.SONGS);
  try {
    song.version = (song.version || 0) + 1;
    store.put(song);
    await (tx as any).complete?.();
  } finally {
    db.close();
  }
}

export async function loadSong(songId: number): Promise<Song | null> {
  const db = await openDB();
  const tx = db.transaction(INDEXED_BD_CONFIG.SCHEMAS.SONGS, DB_TRANSACTION_TYPES.READ as IDBTransactionMode);
  const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.SONGS);
  const request = store.get(songId);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result || null);
      db.close();
    };
    request.onerror = () => {
      reject(request.error);
      db.close();
    };
  });
}

export async function loadAllSongs(): Promise<Song[]> {
  const db = await openDB();
  const tx = db.transaction(INDEXED_BD_CONFIG.SCHEMAS.SONGS, DB_TRANSACTION_TYPES.READ as IDBTransactionMode);
  const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.SONGS);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result || []);
      db.close();
    };
    request.onerror = () => {
      reject(request.error);
      db.close();
    };
  });
}

export async function deleteSong(songId: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(INDEXED_BD_CONFIG.SCHEMAS.SONGS, DB_TRANSACTION_TYPES.READ_WRITE as IDBTransactionMode);
  const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.SONGS);
  const request = store.delete(songId);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve();
      db.close();
    };
    request.onerror = () => {
      reject(request.error);
      db.close();
    };
  });
}

// Simple localStorage-backed game state (mirrors original)
const defaultGameState = {
  selectedSongPackId: 1,
  shownSongIds: [],
  currentSong: { songId: null, title: '', pdfUrl: '', version: 0 }
};

export function saveGameState(gameState: any) {
  const gameStateString = JSON.stringify(gameState);
  localStorage.setItem('gameState', gameStateString);
}

export function loadGameState() {
  const gameStateString = localStorage.getItem('gameState');
  if (gameStateString) return JSON.parse(gameStateString);
  return null;
}

export function clearGameState() {
  localStorage.removeItem('gameState');
}

export function startNewGame() {
  saveGameState(defaultGameState);
  return defaultGameState;
}

export function selectPack(packId: number) {
  const tmpState = { ...(loadGameState() || {}) };
  tmpState.selectedSongPackId = packId;
  saveGameState(tmpState);
}

export function getCurrentSong() {
  const gameState = loadGameState();
  return gameState ? gameState.currentSong : null;
}

export function getShownSongIds() {
  const gameState = loadGameState();
  return gameState ? gameState.shownSongIds : [];
}

export function getSelectedSongPackId() {
  const gameState = loadGameState();
  return gameState ? gameState.selectedSongPackId : null;
}

export async function generateSong(): Promise<any> {
  const shownSongIds = getShownSongIds();
  const selectedPackId = getSelectedSongPackId();
  const packData = await loadAllPacks();
  const selectedPack = packData.find(p => p.packId === selectedPackId);
  if (!selectedPack) {
    console.warn('Selected pack not found');
    return null;
  }
  const availableSongs = selectedPack.songs.filter((songId: number) => !shownSongIds.includes(songId));
  if (availableSongs.length === 0) {
    console.warn('No more songs available in this pack');
    return null;
  }
  const randomIndex = Math.floor(Math.random() * availableSongs.length);
  const selectedSongId = availableSongs[randomIndex];
  const selectedSong = await loadSong(selectedSongId);
  const tmpState = { ...(loadGameState() || {}) };
  tmpState.currentSong = { ...selectedSong };
  tmpState.shownSongIds = tmpState.shownSongIds || [];
  tmpState.shownSongIds.push(selectedSong.songId);
  saveGameState(tmpState);
}

export async function setSongId(songId: number) {
  const selectedSong = await loadSong(songId);
  const tmpState = { ...(loadGameState() || {}) };
  tmpState.currentSong = { ...selectedSong };
  saveGameState(tmpState);
}

// Convenience helpers to match legacy API used by some pages
export async function nextSong() {
  await generateSong();
  return getCurrentSong();
}

export async function prevSong() {
  const gameState = loadGameState() || { shownSongIds: [] };
  const shown = gameState.shownSongIds || [];
  if (shown.length <= 1) return null;
  // previous song id is the one before the last shown
  const prevId = shown[shown.length - 2];
  const prevSong = await loadSong(prevId);
  const tmpState = { ...(gameState || {}) };
  tmpState.currentSong = { ...prevSong };
  // remove the last shown entry (going back)
  tmpState.shownSongIds = shown.slice(0, shown.length - 1);
  saveGameState(tmpState);
  return tmpState.currentSong;
}
