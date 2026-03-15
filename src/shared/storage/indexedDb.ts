// TypeScript port (incremental) of resources/state-helpers/gameStorage.js
// Preserves DB name, object stores and public API. Seeding only runs
// when legacy BASE_PACK_DATA / BASE_SONG_DATA are present to avoid
// overwriting user data during migration.

import type { CurrentSongMetadata, GameState, Pack, Song } from '../types/models'
import { DB_TRANSACTION_TYPES, INDEXED_BD_CONFIG, PACK_ID_PARTITION_SIZE } from '../constants/storage'
import { openIndexedDb, requestToPromise, waitForTransaction } from '../services/storage/indexedDbClient'
import {
  loadJsonFromLocalStorage,
  removeLocalStorageItem,
  saveJsonToLocalStorage,
} from '../services/storage/localStorageService'
import { getBasePackData, getBaseSongData } from '../services/runtime/windowGlobals'

export { DB_TRANSACTION_TYPES, INDEXED_BD_CONFIG } from '../constants/storage'

let firstTimeOpeningDB = true;

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
    openIndexedDb(INDEXED_BD_CONFIG, db => {
      if (!db.objectStoreNames.contains(INDEXED_BD_CONFIG.SCHEMAS.PACKS)) {
        db.createObjectStore(INDEXED_BD_CONFIG.SCHEMAS.PACKS, { keyPath: 'packId' })
      }
      if (!db.objectStoreNames.contains(INDEXED_BD_CONFIG.SCHEMAS.SONGS)) {
        db.createObjectStore(INDEXED_BD_CONFIG.SCHEMAS.SONGS, { keyPath: 'songId' })
      }
    }).then(async db => {

      if (firstTimeOpeningDB) {
        firstTimeOpeningDB = false

        // Try to seed with legacy globals if available (migration safe)
        try {
          const packs = await loadAllPacks()
          const basePackData = getBasePackData()

          if (basePackData.length) {
            for (const BASE_PACK of basePackData) {
              const existing = packs.find(p => p.packId === BASE_PACK.packId)
              if (!existing || (existing.version ?? 0) < (BASE_PACK.version ?? 0)) {
                // Seed directly without incrementing version
                const db2 = await openDB()
                const tx = db2.transaction(INDEXED_BD_CONFIG.SCHEMAS.PACKS, DB_TRANSACTION_TYPES.READ_WRITE as IDBTransactionMode)
                const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.PACKS)
                store.put(normalizePack(BASE_PACK))
                await waitForTransaction(tx)
                db2.close()
              }
            }
          }

          const songs = await loadAllSongs()
          const baseSongData = getBaseSongData()

          if (baseSongData.length) {
            for (const BASE_SONG of baseSongData) {
              const existing = songs.find(s => s.songId === BASE_SONG.songId)
              if (!existing || (existing.version ?? 0) < (BASE_SONG.version ?? 0)) {
                // Seed directly without incrementing version
                const db2 = await openDB()
                const tx = db2.transaction(INDEXED_BD_CONFIG.SCHEMAS.SONGS, DB_TRANSACTION_TYPES.READ_WRITE as IDBTransactionMode)
                const store = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.SONGS)
                store.put(BASE_SONG)
                await waitForTransaction(tx)
                db2.close()
              }
            }
          }
        } catch (err) {
          // If seeding fails, don't block opening DB
          console.warn('Seeding skipped or failed:', err)
        }
      }

      resolve(db)
    }).catch(reject)
  })
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

export async function createNewSong(): Promise<Song> {
  const songs = await loadAllSongs()
  const maxSongId = songs.length ? Math.max(...songs.map(s => s.songId)) : 0
  const newSong: Song = {
    songId: maxSongId + 1,
    title: 'New Song',
    pdfUrl: null,
  }
  await saveSong(newSong)
  return newSong
}

export async function renameSong(songId: number, newName: string): Promise<void> {
  const song = await loadSong(songId)
  if (!song) return
  song.title = newName.trim() || 'Untitled Song'
  await saveSong(song)
}

export async function setSongPdf(songId: number, pdfData: string | null): Promise<void> {
  const song = await loadSong(songId)
  if (!song) return

  // Accept either raw base64 or data URL and persist payload only.
  const normalizedPdf = typeof pdfData === 'string' && pdfData.includes(',')
    ? pdfData.split(',')[1]
    : pdfData

  song.pdfUrl = normalizedPdf
  await saveSong(song)
}

export async function clearSongPdf(songId: number): Promise<void> {
  await setSongPdf(songId, null)
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
const GAME_STATE_STORAGE_KEY = 'gameState'

export function saveGameState(gameState: GameState): void {
  saveJsonToLocalStorage(GAME_STATE_STORAGE_KEY, gameState)
}

export function loadGameState(): GameState | null {
  const gameState = loadJsonFromLocalStorage<Partial<GameState> & {
      currentSong?: CurrentSongMetadata & { id?: number }
    }>(GAME_STATE_STORAGE_KEY)

  if (gameState) {
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
  removeLocalStorageItem(GAME_STATE_STORAGE_KEY)
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
