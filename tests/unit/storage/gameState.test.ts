/** @jest-environment jsdom */
import {
  saveGameState,
  loadGameState,
  clearGameState,
  startNewGame,
  selectPack,
} from '../../../src/shared/storage/indexedDb'
import type { GameState } from '../../../src/shared/types/models'

const baseState: GameState = {
  selectedSongPackId: 1,
  shownSongIds: [2, 3],
  currentSong: { songId: 3, title: 'Test Song' },
}

beforeEach(() => {
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// saveGameState / loadGameState round-trip
// ---------------------------------------------------------------------------

describe('saveGameState / loadGameState round-trip', () => {
  test('saves and loads a game state correctly', () => {
    saveGameState(baseState)
    expect(loadGameState()).toEqual(baseState)
  })

  test('returns null when nothing has been saved', () => {
    expect(loadGameState()).toBeNull()
  })

  test('overwrites the previous state', () => {
    saveGameState(baseState)
    saveGameState({ ...baseState, selectedSongPackId: 99 })
    expect(loadGameState()?.selectedSongPackId).toBe(99)
  })

  test('fills missing shownSongIds with an empty array', () => {
    localStorage.setItem(
      'gameState',
      JSON.stringify({ selectedSongPackId: 1, currentSong: { songId: 1, title: 'X' } }),
    )
    expect(loadGameState()?.shownSongIds).toEqual([])
  })

  test('fills missing currentSong with the default', () => {
    localStorage.setItem(
      'gameState',
      JSON.stringify({ selectedSongPackId: 1, shownSongIds: [] }),
    )
    const state = loadGameState()
    expect(state?.currentSong).toBeDefined()
    expect(state?.currentSong.songId).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Legacy migration: currentSong.id → currentSong.songId
// ---------------------------------------------------------------------------

describe('loadGameState — legacy migration', () => {
  test('migrates currentSong.id to currentSong.songId', () => {
    localStorage.setItem(
      'gameState',
      JSON.stringify({
        selectedSongPackId: null,
        shownSongIds: [],
        currentSong: { id: 7, title: 'Legacy Song' },
      }),
    )
    const state = loadGameState()
    expect(state?.currentSong.songId).toBe(7)
    expect((state?.currentSong as any).id).toBeUndefined()
  })

  test('does not migrate when songId is already present', () => {
    saveGameState(baseState)
    const state = loadGameState()
    expect(state?.currentSong.songId).toBe(baseState.currentSong.songId)
  })

  test('persists the migrated state back to localStorage', () => {
    localStorage.setItem(
      'gameState',
      JSON.stringify({
        selectedSongPackId: null,
        shownSongIds: [],
        currentSong: { id: 5, title: 'Old' },
      }),
    )
    loadGameState()
    const raw = JSON.parse(localStorage.getItem('gameState')!)
    expect(raw.currentSong.songId).toBe(5)
    expect(raw.currentSong.id).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// clearGameState
// ---------------------------------------------------------------------------

describe('clearGameState', () => {
  test('removes game state so subsequent loads return null', () => {
    saveGameState(baseState)
    clearGameState()
    expect(loadGameState()).toBeNull()
  })

  test('does not throw when there is no state to clear', () => {
    expect(() => clearGameState()).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// startNewGame
// ---------------------------------------------------------------------------

describe('startNewGame', () => {
  test('resets selectedSongPackId to null', () => {
    saveGameState(baseState)
    const result = startNewGame()
    expect(result.selectedSongPackId).toBeNull()
  })

  test('clears shownSongIds', () => {
    saveGameState(baseState)
    const result = startNewGame()
    expect(result.shownSongIds).toEqual([])
  })

  test('resets currentSong.songId to null', () => {
    saveGameState(baseState)
    const result = startNewGame()
    expect(result.currentSong.songId).toBeNull()
  })

  test('persists the reset state so loadGameState reflects it', () => {
    saveGameState(baseState)
    startNewGame()
    const loaded = loadGameState()
    expect(loaded?.selectedSongPackId).toBeNull()
    expect(loaded?.shownSongIds).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// selectPack
// ---------------------------------------------------------------------------

describe('selectPack', () => {
  test('sets selectedSongPackId on existing state without overwriting shownSongIds', () => {
    saveGameState({ ...baseState, shownSongIds: [10, 11] })
    selectPack(42)
    const loaded = loadGameState()
    expect(loaded?.selectedSongPackId).toBe(42)
    expect(loaded?.shownSongIds).toEqual([10, 11])
  })

  test('creates state with selectedSongPackId when no prior state exists', () => {
    selectPack(7)
    expect(loadGameState()?.selectedSongPackId).toBe(7)
  })

  test('overrides an existing selectedSongPackId', () => {
    saveGameState({ ...baseState, selectedSongPackId: 5 })
    selectPack(9)
    expect(loadGameState()?.selectedSongPackId).toBe(9)
  })
})
