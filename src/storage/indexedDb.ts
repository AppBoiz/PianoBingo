// TypeScript port (incremental) of resources/state-helpers/gameStorage.js
// Preserves DB name, object stores and public API. Seeding only runs
// when legacy BASE_PACK_DATA / BASE_SONG_DATA are present to avoid
// overwriting user data during migration.

import type { CurrentSongMetadata, GameState, Pack, Song } from '../types/models'
import { DB_TRANSACTION_TYPES, INDEXED_BD_CONFIG } from '../constants/storage'

export { DB_TRANSACTION_TYPES, INDEXED_BD_CONFIG } from '../constants/storage'

let firstTimeOpeningDB = true;

function waitForTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function normalizePack(pack: Pack): Pack {
  return {
    ...pack,
    songCount: pack.songs.length,
  }
}

function toCurrentSongMetadata(song: Song | null): CurrentSongMetadata {
  if (!song) {
    return {
      songId: null,
      title: '',
    }
  }

  return {
    songId: song.songId,
    title: song.title,
  }
}

function getDefaultGameState(): GameState {
  return {
    selectedSongPackId: null,
    shownSongIds: [],
    currentSong: toCurrentSongMetadata(null),
  }
}

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

          if (window.BASE_PACK_DATA) {
            for (const BASE_PACK of window.BASE_PACK_DATA) {
              const existing = packs.find(p => p.packId === BASE_PACK.packId);
              if (!existing || (existing.version ?? 0) < (BASE_PACK.version ?? 0)) {
                // Seed directly without incrementing version
                const db2 = await openDB();
                const tx = db2.transaction(INDEXED_BD_CONFIG.SCHEMAS.PACKS, DB_TRANSACTION_TYPES.READ_WRITE as IDBTransactionMode);
                const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.PACKS);
                store.put(normalizePack(BASE_PACK));  // Insert base pack with original version
                await waitForTransaction(tx);
                db2.close();
              }
            }
          }

          const songs = await loadAllSongs();
          if (window.BASE_SONG_DATA) {
            for (const BASE_SONG of window.BASE_SONG_DATA) {
              const existing = songs.find(s => s.songId === BASE_SONG.songId);
              if (!existing || (existing.version ?? 0) < (BASE_SONG.version ?? 0)) {
                // Seed directly without incrementing version
                const db2 = await openDB();
                const tx = db2.transaction(INDEXED_BD_CONFIG.SCHEMAS.SONGS, DB_TRANSACTION_TYPES.READ_WRITE as IDBTransactionMode);
                const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.SONGS);
                store.put(BASE_SONG);  // Insert base song with original version
                await waitForTransaction(tx);
                db2.close();
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
    const normalizedPack = normalizePack({
      ...pack,
      version: (pack.version || 0) + 1,
    })
    store.put(normalizedPack);
    await waitForTransaction(tx);
  } finally {
    db.close();
  }
}

export async function loadPack(packId: number): Promise<Pack | null> {
  const db = await openDB();
  const tx = db.transaction(INDEXED_BD_CONFIG.SCHEMAS.PACKS, DB_TRANSACTION_TYPES.READ as IDBTransactionMode);
  const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.PACKS);
  const request = store.get(packId) as IDBRequest<Pack | undefined>
  try {
    return (await requestToPromise(request)) || null
  } finally {
    db.close()
  }
}

export async function loadAllPacks(): Promise<Pack[]> {
  const db = await openDB();
  const tx = db.transaction(INDEXED_BD_CONFIG.SCHEMAS.PACKS, DB_TRANSACTION_TYPES.READ as IDBTransactionMode);
  const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.PACKS);
  const request = store.getAll() as IDBRequest<Pack[]>
  try {
    return (await requestToPromise(request)) || []
  } finally {
    db.close()
  }
}

export async function deletePack(packId: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(INDEXED_BD_CONFIG.SCHEMAS.PACKS, DB_TRANSACTION_TYPES.READ_WRITE as IDBTransactionMode);
  const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.PACKS);
  const request = store.delete(packId)
  try {
    await requestToPromise(request)
  } finally {
    db.close()
  }
}

export async function createNewPack(): Promise<Pack> {
  const packs = await loadAllPacks()
  const maxPackId = packs.length ? Math.max(...packs.map(p => p.packId)) : 0
  const { PACK_ID_PARTITION_SIZE } = await import('../constants/storage')
  const newPack: Pack = {
    packId: Math.max(maxPackId + 1, PACK_ID_PARTITION_SIZE),
    packName: 'New Pack',
    songCount: 0,
    songs: [],
  }
  await savePack(newPack)
  return newPack
}

export async function renamePack(packId: number, newName: string): Promise<void> {
  const pack = await loadPack(packId)
  if (!pack) return
  pack.packName = newName.trim() || 'Untitled Pack'
  await savePack(pack)
}

export async function saveSong(song: Song): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(INDEXED_BD_CONFIG.SCHEMAS.SONGS, DB_TRANSACTION_TYPES.READ_WRITE as IDBTransactionMode);
  const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.SONGS);
  try {
    const normalizedSong: Song = {
      ...song,
      version: (song.version || 0) + 1,
    }
    store.put(normalizedSong);
    await waitForTransaction(tx);
  } finally {
    db.close();
  }
}

export async function loadSong(songId: number): Promise<Song | null> {
  const db = await openDB();
  const tx = db.transaction(INDEXED_BD_CONFIG.SCHEMAS.SONGS, DB_TRANSACTION_TYPES.READ as IDBTransactionMode);
  const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.SONGS);
  const request = store.get(songId) as IDBRequest<Song | undefined>
  try {
    return (await requestToPromise(request)) || null
  } finally {
    db.close()
  }
}

export async function loadAllSongs(): Promise<Song[]> {
  const db = await openDB();
  const tx = db.transaction(INDEXED_BD_CONFIG.SCHEMAS.SONGS, DB_TRANSACTION_TYPES.READ as IDBTransactionMode);
  const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.SONGS);
  const request = store.getAll() as IDBRequest<Song[]>
  try {
    return (await requestToPromise(request)) || []
  } finally {
    db.close()
  }
}

export async function deleteSong(songId: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(INDEXED_BD_CONFIG.SCHEMAS.SONGS, DB_TRANSACTION_TYPES.READ_WRITE as IDBTransactionMode);
  const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.SONGS);
  const request = store.delete(songId)
  try {
    await requestToPromise(request)
  } finally {
    db.close()
  }
}

// Simple localStorage-backed game state (mirrors original)
const defaultGameState: GameState = getDefaultGameState()

export function saveGameState(gameState: GameState): void {
  const gameStateString = JSON.stringify(gameState)
  localStorage.setItem('gameState', gameStateString)
}

export function loadGameState(): GameState | null {
  const gameStateString = localStorage.getItem('gameState');
  if (gameStateString) {
    const gameState = JSON.parse(gameStateString) as Partial<GameState> & {
      currentSong?: CurrentSongMetadata & { id?: number }
    }
    // Migrate legacy data: rename currentSong.id to currentSong.songId
    if (gameState.currentSong && gameState.currentSong.id !== undefined && gameState.currentSong.songId === undefined) {
      gameState.currentSong.songId = gameState.currentSong.id
      delete gameState.currentSong.id
      // Save migrated state back
      saveGameState({
        ...defaultGameState,
        ...gameState,
        shownSongIds: gameState.shownSongIds || [],
        currentSong: gameState.currentSong || defaultGameState.currentSong,
      })
      console.log('Migrated legacy gameState: id → songId');
    }

    return {
      ...defaultGameState,
      ...gameState,
      shownSongIds: gameState.shownSongIds || [],
      currentSong: gameState.currentSong || defaultGameState.currentSong,
    }
  }
  return null
}

export function clearGameState() {
  localStorage.removeItem('gameState');
}

export function startNewGame() {
  saveGameState(defaultGameState)
  return defaultGameState
}

export function selectPack(packId: number) {
  const tmpState: GameState = { ...(loadGameState() || defaultGameState) }
  tmpState.selectedSongPackId = packId
  saveGameState(tmpState)
}

export function getCurrentSongMetadata(): CurrentSongMetadata | null {
  const gameState = loadGameState()
  return gameState ? gameState.currentSong : null
}

export async function getCurrentSong(): Promise<Song | null> {
  const currentSongMetadata = getCurrentSongMetadata()
  if (!currentSongMetadata?.songId) {
    return null
  }

  return loadSong(currentSongMetadata.songId)
}

export function getShownSongIds() {
  const gameState = loadGameState()
  return gameState ? gameState.shownSongIds : []
}

export function getSelectedSongPackId() {
  const gameState = loadGameState()
  return gameState ? gameState.selectedSongPackId : null
}

export async function generateSong(): Promise<Song | null> {
  const shownSongIds = getShownSongIds()
  const selectedPackId = getSelectedSongPackId()
  const packData = await loadAllPacks()
  const selectedPack = packData.find(p => p.packId === selectedPackId)
  if (!selectedPack) {
    console.warn('Selected pack not found')
    return null
  }
  const availableSongs = selectedPack.songs.filter(songId => !shownSongIds.includes(songId))
  if (availableSongs.length === 0) {
    console.warn('No more songs available in this pack')
    return null
  }
  const randomIndex = Math.floor(Math.random() * availableSongs.length)
  const selectedSongId = availableSongs[randomIndex]
  const selectedSong = await loadSong(selectedSongId)

  if (!selectedSong) {
    return null
  }

  const tmpState: GameState = { ...(loadGameState() || defaultGameState) }
  tmpState.currentSong = toCurrentSongMetadata(selectedSong)
  tmpState.shownSongIds = tmpState.shownSongIds || []
  tmpState.shownSongIds.push(selectedSong.songId)
  saveGameState(tmpState)
  return selectedSong
}

// Convenience helpers to match legacy API used by some pages
export async function nextSong() {
  const gameState = loadGameState() || defaultGameState
  const shown = gameState.shownSongIds || []
  const currentSongId = gameState.currentSong?.songId

  if (currentSongId !== null && currentSongId !== undefined) {
    const currentIndex = shown.findIndex(id => id === currentSongId)
    if (currentIndex !== -1 && currentIndex < shown.length - 1) {
      const nextFromHistoryId = shown[currentIndex + 1]
      const nextFromHistory = await loadSong(nextFromHistoryId)
      if (!nextFromHistory) {
        return null
      }

      const tmpState: GameState = { ...(gameState || defaultGameState) }
      tmpState.currentSong = toCurrentSongMetadata(nextFromHistory)
      saveGameState(tmpState)
      return nextFromHistory
    }
  }

  return generateSong()
}

export async function prevSong() {
  const gameState = loadGameState() || defaultGameState
  const shown = gameState.shownSongIds || []
  const currentSongId = gameState.currentSong?.songId
  if (currentSongId === null || currentSongId === undefined) {
    return null
  }

  const currentIndex = shown.findIndex(id => id === currentSongId)
  if (currentIndex <= 0) return null

  const prevId = shown[currentIndex - 1]
  const prevSong = await loadSong(prevId)
  if (!prevSong) {
    return null
  }

  const tmpState: GameState = { ...(gameState || defaultGameState) }
  tmpState.currentSong = toCurrentSongMetadata(prevSong)
  saveGameState(tmpState)
  return prevSong
}
