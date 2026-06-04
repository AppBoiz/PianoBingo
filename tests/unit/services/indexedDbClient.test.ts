import { waitForTransaction, requestToPromise, openIndexedDb } from '../../../src/shared/services/storage/indexedDbClient'
import type { IndexedDbConfig } from '../../../src/shared/types/models'

// ---------------------------------------------------------------------------
// requestToPromise
// ---------------------------------------------------------------------------

describe('requestToPromise', () => {
  test('resolves with request.result when onsuccess fires', async () => {
    const request = { result: 'hello' } as unknown as IDBRequest<string>
    const promise = requestToPromise(request)
    ;(request as any).onsuccess()
    await expect(promise).resolves.toBe('hello')
  })

  test('rejects with request.error when onerror fires', async () => {
    const error = new Error('db read error')
    const request = { result: null, error } as unknown as IDBRequest<string>
    const promise = requestToPromise(request)
    ;(request as any).onerror()
    await expect(promise).rejects.toBe(error)
  })

  test('resolves with undefined result when result is undefined', async () => {
    const request = { result: undefined } as unknown as IDBRequest<undefined>
    const promise = requestToPromise(request)
    ;(request as any).onsuccess()
    await expect(promise).resolves.toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// waitForTransaction
// ---------------------------------------------------------------------------

describe('waitForTransaction', () => {
  function stubTx(error: Error | null = null) {
    return { error } as unknown as IDBTransaction
  }

  test('resolves when oncomplete fires', async () => {
    const tx = stubTx()
    const promise = waitForTransaction(tx)
    ;(tx as any).oncomplete()
    await expect(promise).resolves.toBeUndefined()
  })

  test('rejects with tx.error when onerror fires and error is set', async () => {
    const err = new Error('transaction error')
    const tx = stubTx(err)
    const promise = waitForTransaction(tx)
    ;(tx as any).onerror()
    await expect(promise).rejects.toBe(err)
  })

  test('rejects with fallback message when onerror fires and tx.error is null', async () => {
    const tx = stubTx(null)
    const promise = waitForTransaction(tx)
    ;(tx as any).onerror()
    await expect(promise).rejects.toMatchObject({ message: 'IndexedDB transaction failed' })
  })

  test('rejects with tx.error when onabort fires and error is set', async () => {
    const err = new Error('transaction aborted')
    const tx = stubTx(err)
    const promise = waitForTransaction(tx)
    ;(tx as any).onabort()
    await expect(promise).rejects.toBe(err)
  })

  test('rejects with fallback message when onabort fires and tx.error is null', async () => {
    const tx = stubTx(null)
    const promise = waitForTransaction(tx)
    ;(tx as any).onabort()
    await expect(promise).rejects.toMatchObject({ message: 'IndexedDB transaction aborted' })
  })
})

// ---------------------------------------------------------------------------
// openIndexedDb — uses a manual indexedDB global mock (no external packages)
// ---------------------------------------------------------------------------

describe('openIndexedDb', () => {
  const config: IndexedDbConfig = {
    DB_NAME: 'TestDB',
    DB_VERSION: 1,
    PARTITION_SIZE: 100,
    SCHEMAS: { PACKS: 'packs', SONGS: 'songs' },
  }

  function makeMockRequest(db: object) {
    return {
      result: db,
      error: null,
      onsuccess: null as null | (() => void),
      onerror: null as null | (() => void),
      onupgradeneeded: null as null | (() => void),
    }
  }

  afterEach(() => {
    delete (global as any).indexedDB
  })

  test('resolves with the IDBDatabase returned by indexedDB.open', async () => {
    const mockDb = { close: jest.fn() }
    const mockReq = makeMockRequest(mockDb)
    ;(global as any).indexedDB = { open: jest.fn().mockReturnValue(mockReq) }

    const promise = openIndexedDb(config)
    mockReq.onsuccess!()
    const db = await promise
    expect(db).toBe(mockDb)
  })

  test('calls onUpgrade with the database when onupgradeneeded fires', async () => {
    const mockDb = { close: jest.fn() }
    const mockReq = makeMockRequest(mockDb)
    ;(global as any).indexedDB = { open: jest.fn().mockReturnValue(mockReq) }

    const onUpgrade = jest.fn()
    const promise = openIndexedDb(config, onUpgrade)

    mockReq.onupgradeneeded!()
    mockReq.onsuccess!()
    await promise

    expect(onUpgrade).toHaveBeenCalledWith(mockDb)
  })

  test('does not throw when no onUpgrade callback is given', async () => {
    const mockDb = { close: jest.fn() }
    const mockReq = makeMockRequest(mockDb)
    ;(global as any).indexedDB = { open: jest.fn().mockReturnValue(mockReq) }

    const promise = openIndexedDb(config)
    mockReq.onupgradeneeded!()  // fires with no registered callback
    mockReq.onsuccess!()
    await expect(promise).resolves.toBe(mockDb)
  })

  test('rejects when indexedDB.open triggers onerror', async () => {
    const openError = new Error('open failed')
    const mockReq = { ...makeMockRequest({}), error: openError }
    ;(global as any).indexedDB = { open: jest.fn().mockReturnValue(mockReq) }

    const promise = openIndexedDb(config)
    mockReq.onerror!()
    await expect(promise).rejects.toBe(openError)
  })

  test('opens the database with the correct name and version', async () => {
    const mockDb = { close: jest.fn() }
    const mockReq = makeMockRequest(mockDb)
    const openSpy = jest.fn().mockReturnValue(mockReq)
    ;(global as any).indexedDB = { open: openSpy }

    const promise = openIndexedDb(config)
    mockReq.onsuccess!()
    await promise

    expect(openSpy).toHaveBeenCalledWith(config.DB_NAME, config.DB_VERSION)
  })
})
