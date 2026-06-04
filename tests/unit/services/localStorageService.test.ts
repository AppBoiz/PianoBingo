/** @jest-environment jsdom */
import {
  saveJsonToLocalStorage,
  loadJsonFromLocalStorage,
  removeLocalStorageItem,
} from '../../../src/shared/services/storage/localStorageService'

beforeEach(() => {
  localStorage.clear()
})

describe('saveJsonToLocalStorage / loadJsonFromLocalStorage', () => {
  test('saves and loads a plain object', () => {
    saveJsonToLocalStorage('key', { a: 1, b: 'hello' })
    expect(loadJsonFromLocalStorage('key')).toEqual({ a: 1, b: 'hello' })
  })

  test('returns null for a key that was never set', () => {
    expect(loadJsonFromLocalStorage<unknown>('missing')).toBeNull()
  })

  test('overwrites an existing value', () => {
    saveJsonToLocalStorage('key', { version: 1 })
    saveJsonToLocalStorage('key', { version: 2 })
    expect(loadJsonFromLocalStorage<{ version: number }>('key')).toEqual({ version: 2 })
  })

  test('handles arrays', () => {
    saveJsonToLocalStorage('arr', [1, 2, 3])
    expect(loadJsonFromLocalStorage<number[]>('arr')).toEqual([1, 2, 3])
  })

  test('handles numeric primitives', () => {
    saveJsonToLocalStorage('num', 42)
    expect(loadJsonFromLocalStorage<number>('num')).toBe(42)
  })

  test('handles boolean false without treating it as missing', () => {
    saveJsonToLocalStorage('bool', false)
    // loadJsonFromLocalStorage checks `if (!rawValue)` — rawValue is "false" (truthy string)
    expect(loadJsonFromLocalStorage<boolean>('bool')).toBe(false)
  })

  test('handles nested objects', () => {
    const nested = { a: { b: { c: [1, 2, 3] } } }
    saveJsonToLocalStorage('nested', nested)
    expect(loadJsonFromLocalStorage('nested')).toEqual(nested)
  })

  test('different keys are independent', () => {
    saveJsonToLocalStorage('x', 1)
    saveJsonToLocalStorage('y', 2)
    expect(loadJsonFromLocalStorage<number>('x')).toBe(1)
    expect(loadJsonFromLocalStorage<number>('y')).toBe(2)
  })
})

describe('removeLocalStorageItem', () => {
  test('removes an existing key so subsequent loads return null', () => {
    saveJsonToLocalStorage('key', 123)
    removeLocalStorageItem('key')
    expect(loadJsonFromLocalStorage('key')).toBeNull()
  })

  test('does not throw when the key does not exist', () => {
    expect(() => removeLocalStorageItem('nonexistent')).not.toThrow()
  })

  test('only removes the specified key, leaves others intact', () => {
    saveJsonToLocalStorage('a', 1)
    saveJsonToLocalStorage('b', 2)
    removeLocalStorageItem('a')
    expect(loadJsonFromLocalStorage<number>('b')).toBe(2)
    expect(loadJsonFromLocalStorage('a')).toBeNull()
  })
})
