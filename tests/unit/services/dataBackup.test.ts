jest.mock('../../../src/shared/storage/indexedDb', () => ({
  clearGameState: jest.fn(),
  openDB: jest.fn(),
}))

import type { Pack, Song } from '../../../src/shared/types/models'
import { clearGameState, openDB } from '../../../src/shared/storage/indexedDb'
import {
  createDataBackup,
  createDataBackupDocument,
  DATA_BACKUP_FORMAT,
  DATA_BACKUP_VERSION,
  parseDataBackup,
  restoreDataBackup,
  serializeDataBackup,
  summarizeDataBackup,
} from '../../../src/shared/storage/dataBackup'

const songs: Song[] = [
  { songId: 2, title: 'Second', pdfUrl: null, version: 3 },
  { songId: 1, title: 'First', pdfUrl: 'JVBERi0xLjQ=', version: 2 },
]
const packs: Pack[] = [
  { packId: 1000000, packName: 'My Playlist', songs: [2, 1], songCount: 99, version: 4 },
]
const createdAt = new Date('2026-07-18T12:30:00.000Z')

describe('data backup format', () => {
  test('creates a deterministic versioned document', () => {
    const backup = createDataBackupDocument(packs, songs, createdAt)

    expect(backup.format).toBe(DATA_BACKUP_FORMAT)
    expect(backup.version).toBe(DATA_BACKUP_VERSION)
    expect(backup.createdAt).toBe(createdAt.toISOString())
    expect(backup.data.songs.map(song => song.songId)).toEqual([1, 2])
    expect(backup.data.packs.map(pack => pack.packId)).toEqual([1000000])
  })

  test('round trips valid data and normalizes playlist counts', () => {
    const parsed = parseDataBackup(serializeDataBackup(createDataBackupDocument(packs, songs, createdAt)))

    expect(parsed.data.packs[0].songCount).toBe(2)
    expect(parsed.data.packs[0].songs).toEqual([2, 1])
    expect(summarizeDataBackup(parsed)).toEqual({
      createdAt: createdAt.toISOString(),
      packCount: 1,
      pdfCount: 1,
      songCount: 2,
    })
  })

  test('rejects invalid JSON and unrelated JSON files', () => {
    expect(() => parseDataBackup('{bad')).toThrow('not valid JSON')
    expect(() => parseDataBackup('{"hello":"world"}')).toThrow('not a Piano Bingo backup')
  })

  test('rejects unsupported versions', () => {
    const backup = createDataBackupDocument(packs, songs, createdAt) as any
    backup.version = 2
    expect(() => parseDataBackup(JSON.stringify(backup))).toThrow('version is not supported')
  })

  test('rejects duplicate IDs before restore', () => {
    const backup = createDataBackupDocument(packs, [...songs, songs[0]], createdAt)
    expect(() => parseDataBackup(JSON.stringify(backup))).toThrow('duplicate song ID 2')
  })

  test('rejects playlists that refer to missing songs', () => {
    const backup = createDataBackupDocument([{ ...packs[0], songs: [999] }], songs, createdAt)
    expect(() => parseDataBackup(JSON.stringify(backup))).toThrow('missing song ID 999')
  })
})

describe('restoreDataBackup', () => {
  test('clears and replaces both stores in one transaction, then clears stale game state', async () => {
    const packStore = { clear: jest.fn(), put: jest.fn() }
    const songStore = { clear: jest.fn(), put: jest.fn() }
    const tx = {
      error: null,
      objectStore: jest.fn((name: string) => name === 'packs' ? packStore : songStore),
      oncomplete: null as null | (() => void),
      onerror: null,
      onabort: null,
    } as unknown as IDBTransaction
    const db = {
      close: jest.fn(),
      transaction: jest.fn().mockReturnValue(tx),
    } as unknown as IDBDatabase
    jest.mocked(openDB).mockResolvedValue(db)

    const restorePromise = restoreDataBackup(createDataBackupDocument(packs, songs, createdAt))
    await Promise.resolve()
    await Promise.resolve()
    ;(tx.oncomplete as () => void)()
    await restorePromise

    expect(packStore.clear).toHaveBeenCalledTimes(1)
    expect(songStore.clear).toHaveBeenCalledTimes(1)
    expect(songStore.put).toHaveBeenCalledTimes(2)
    expect(packStore.put).toHaveBeenCalledWith(expect.objectContaining({ songCount: 2 }))
    expect(clearGameState).toHaveBeenCalledTimes(1)
    expect(db.close).toHaveBeenCalledTimes(1)
  })
})

describe('createDataBackup', () => {
  test('reads both stores in one snapshot and removes stale playlist references', async () => {
    const packRequest = {
      result: [{ ...packs[0], songs: [2, 999, 2, 1] }],
      error: null,
      onsuccess: null as null | (() => void),
      onerror: null,
    } as unknown as IDBRequest<Pack[]>
    const songRequest = {
      result: songs,
      error: null,
      onsuccess: null as null | (() => void),
      onerror: null,
    } as unknown as IDBRequest<Song[]>
    const stores = {
      packs: { getAll: jest.fn().mockReturnValue(packRequest) },
      songs: { getAll: jest.fn().mockReturnValue(songRequest) },
    }
    const tx = {
      error: null,
      objectStore: jest.fn((name: 'packs' | 'songs') => stores[name]),
      oncomplete: null as null | (() => void),
      onerror: null,
      onabort: null,
    } as unknown as IDBTransaction
    const db = {
      close: jest.fn(),
      transaction: jest.fn().mockReturnValue(tx),
    } as unknown as IDBDatabase
    jest.mocked(openDB).mockResolvedValue(db)

    const backupPromise = createDataBackup()
    await Promise.resolve()
    await Promise.resolve()
    ;(packRequest.onsuccess as () => void)()
    ;(songRequest.onsuccess as () => void)()
    ;(tx.oncomplete as () => void)()
    const backup = await backupPromise

    expect(db.transaction).toHaveBeenCalledWith(['packs', 'songs'], 'readonly')
    expect(backup.data.packs[0].songs).toEqual([2, 1])
    expect(backup.data.packs[0].songCount).toBe(2)
    expect(db.close).toHaveBeenCalledTimes(1)
  })
})
