import type { Pack, Song } from '../types/models'
import { DB_TRANSACTION_TYPES, INDEXED_BD_CONFIG } from '../constants/storage'
import { requestToPromise, waitForTransaction } from '../services/storage/indexedDbClient'
import { clearGameState, openDB } from './indexedDb'

export const DATA_BACKUP_FORMAT = 'piano-bingo-data-backup'
export const DATA_BACKUP_VERSION = 1

export interface DataBackup {
  format: typeof DATA_BACKUP_FORMAT
  version: typeof DATA_BACKUP_VERSION
  createdAt: string
  data: {
    packs: Pack[]
    songs: Song[]
  }
}

export interface DataBackupSummary {
  createdAt: string
  packCount: number
  pdfCount: number
  songCount: number
}

type SaveBackupResult = 'cancelled' | 'downloaded' | 'shared'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireSafePositiveInteger(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new Error(`${field} must be a positive whole number.`)
  }
  return value as number
}

function requireOptionalVersion(value: unknown, field: string): number | undefined {
  if (value === undefined) {
    return undefined
  }
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`${field} must be a non-negative whole number.`)
  }
  return value as number
}

function normalizeSong(value: unknown, index: number): Song {
  if (!isRecord(value)) {
    throw new Error(`Song ${index + 1} is not a valid record.`)
  }

  const songId = requireSafePositiveInteger(value.songId, `Song ${index + 1} ID`)
  if (typeof value.title !== 'string') {
    throw new Error(`Song ${songId} must have a title.`)
  }
  if (value.pdfUrl !== null && typeof value.pdfUrl !== 'string') {
    throw new Error(`Song ${songId} has invalid PDF data.`)
  }

  const version = requireOptionalVersion(value.version, `Song ${songId} version`)
  return {
    songId,
    title: value.title,
    pdfUrl: value.pdfUrl,
    ...(version === undefined ? {} : { version }),
  }
}

function normalizePack(value: unknown, index: number): Pack {
  if (!isRecord(value)) {
    throw new Error(`Playlist ${index + 1} is not a valid record.`)
  }

  const packId = requireSafePositiveInteger(value.packId, `Playlist ${index + 1} ID`)
  if (typeof value.packName !== 'string') {
    throw new Error(`Playlist ${packId} must have a name.`)
  }
  if (!Array.isArray(value.songs)) {
    throw new Error(`Playlist ${packId} must contain a song list.`)
  }

  const songs = value.songs.map((songId, songIndex) =>
    requireSafePositiveInteger(songId, `Playlist ${packId} song ${songIndex + 1}`),
  )
  if (new Set(songs).size !== songs.length) {
    throw new Error(`Playlist ${packId} contains the same song more than once.`)
  }

  const version = requireOptionalVersion(value.version, `Playlist ${packId} version`)
  return {
    packId,
    packName: value.packName,
    songCount: songs.length,
    songs,
    ...(version === undefined ? {} : { version }),
  }
}

function assertUniqueIds(records: Array<{ id: number; label: string }>) {
  const seen = new Set<number>()
  for (const record of records) {
    if (seen.has(record.id)) {
      throw new Error(`The backup contains duplicate ${record.label} ID ${record.id}.`)
    }
    seen.add(record.id)
  }
}

export function createDataBackupDocument(
  packs: Pack[],
  songs: Song[],
  createdAt = new Date(),
): DataBackup {
  return {
    format: DATA_BACKUP_FORMAT,
    version: DATA_BACKUP_VERSION,
    createdAt: createdAt.toISOString(),
    data: {
      packs: [...packs].sort((left, right) => left.packId - right.packId),
      songs: [...songs].sort((left, right) => left.songId - right.songId),
    },
  }
}

export async function createDataBackup(): Promise<DataBackup> {
  const db = await openDB()
  try {
    // One transaction gives the file a consistent snapshot across both related stores.
    const tx = db.transaction(
      [INDEXED_BD_CONFIG.SCHEMAS.PACKS, INDEXED_BD_CONFIG.SCHEMAS.SONGS],
      DB_TRANSACTION_TYPES.READ as IDBTransactionMode,
    )
    const completion = waitForTransaction(tx)
    const packRequest = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.PACKS).getAll() as IDBRequest<Pack[]>
    const songRequest = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.SONGS).getAll() as IDBRequest<Song[]>
    const [packs, songs] = await Promise.all([
      requestToPromise(packRequest),
      requestToPromise(songRequest),
    ])
    await completion

    // Old app versions could leave deleted song IDs inside playlists. Omit those
    // stale references so every generated backup is guaranteed to be restorable.
    const songIds = new Set(songs.map(song => song.songId))
    const normalizedPacks = packs.map(pack => {
      const seen = new Set<number>()
      const validSongIds = pack.songs.filter(songId => {
        if (!songIds.has(songId) || seen.has(songId)) {
          return false
        }
        seen.add(songId)
        return true
      })
      return { ...pack, songs: validSongIds, songCount: validSongIds.length }
    })
    const backup = createDataBackupDocument(normalizedPacks, songs)
    return parseDataBackup(serializeDataBackup(backup))
  } finally {
    db.close()
  }
}

export function parseDataBackup(text: string): DataBackup {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('This file is not valid JSON and cannot be restored.')
  }

  if (!isRecord(value) || value.format !== DATA_BACKUP_FORMAT) {
    throw new Error('This is not a Piano Bingo backup file.')
  }
  if (value.version !== DATA_BACKUP_VERSION) {
    throw new Error(`This backup version is not supported. Expected version ${DATA_BACKUP_VERSION}.`)
  }
  if (typeof value.createdAt !== 'string' || Number.isNaN(Date.parse(value.createdAt))) {
    throw new Error('The backup does not contain a valid creation date.')
  }
  if (!isRecord(value.data) || !Array.isArray(value.data.packs) || !Array.isArray(value.data.songs)) {
    throw new Error('The backup is missing its songs or playlists.')
  }

  const songs = value.data.songs.map(normalizeSong)
  const packs = value.data.packs.map(normalizePack)
  assertUniqueIds(songs.map(song => ({ id: song.songId, label: 'song' })))
  assertUniqueIds(packs.map(pack => ({ id: pack.packId, label: 'playlist' })))

  const songIds = new Set(songs.map(song => song.songId))
  for (const pack of packs) {
    for (const songId of pack.songs) {
      if (!songIds.has(songId)) {
        throw new Error(`Playlist "${pack.packName}" refers to missing song ID ${songId}.`)
      }
    }
  }

  return createDataBackupDocument(packs, songs, new Date(value.createdAt))
}

export function summarizeDataBackup(backup: DataBackup): DataBackupSummary {
  return {
    createdAt: backup.createdAt,
    packCount: backup.data.packs.length,
    pdfCount: backup.data.songs.filter(song => song.pdfUrl?.startsWith('JVBERi0')).length,
    songCount: backup.data.songs.length,
  }
}

export function serializeDataBackup(backup: DataBackup): string {
  return JSON.stringify(backup, null, 2)
}

export function createDataBackupFilename(createdAt: string): string {
  const date = createdAt.slice(0, 10)
  return `piano-bingo-backup-${date}.json`
}

export async function saveDataBackupFile(backup: DataBackup): Promise<SaveBackupResult> {
  const filename = createDataBackupFilename(backup.createdAt)
  const file = new File([serializeDataBackup(backup)], filename, { type: 'application/json' })
  const shareData: ShareData = { files: [file], title: 'Piano Bingo backup' }

  if (typeof navigator.share === 'function' && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData)
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled'
      }
      throw error
    }
  }

  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}

export async function restoreDataBackup(backup: DataBackup): Promise<DataBackupSummary> {
  // Revalidate callers as well as uploaded files before beginning the destructive transaction.
  const validatedBackup = parseDataBackup(serializeDataBackup(backup))
  const db = await openDB()

  try {
    const tx = db.transaction(
      [INDEXED_BD_CONFIG.SCHEMAS.PACKS, INDEXED_BD_CONFIG.SCHEMAS.SONGS],
      DB_TRANSACTION_TYPES.READ_WRITE as IDBTransactionMode,
    )
    const completion = waitForTransaction(tx)
    const packStore = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.PACKS)
    const songStore = tx.objectStore(INDEXED_BD_CONFIG.SCHEMAS.SONGS)

    packStore.clear()
    songStore.clear()
    for (const song of validatedBackup.data.songs) {
      songStore.put(song)
    }
    for (const pack of validatedBackup.data.packs) {
      packStore.put(pack)
    }

    await completion
  } finally {
    db.close()
  }

  clearGameState()
  return summarizeDataBackup(validatedBackup)
}
