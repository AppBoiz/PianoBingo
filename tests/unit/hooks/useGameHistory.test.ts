/** @jest-environment jsdom */
import { renderHook, waitFor } from '@testing-library/react'
import { useGameHistory } from '../../../src/pages/game/hooks/useGameHistory'

jest.mock('../../../src/shared/storage/indexedDb', () => ({
  loadGameState: jest.fn(),
  loadPack: jest.fn(),
}))

import { loadGameState, loadPack } from '../../../src/shared/storage/indexedDb'

const mockPack = {
  packId: 1,
  packName: 'Classical Pack',
  songs: [1, 2, 3],
  version: 1,
}

beforeEach(() => {
  jest.mocked(loadGameState).mockReset()
  jest.mocked(loadPack).mockReset()
})

// ---------------------------------------------------------------------------
// No active game
// ---------------------------------------------------------------------------

describe('useGameHistory — no active game', () => {
  test('returns null pack and empty shownSongIds when loadGameState returns null', async () => {
    jest.mocked(loadGameState).mockReturnValue(null)
    const { result } = renderHook(() => useGameHistory())

    await waitFor(() => {
      expect(result.current.pack).toBeNull()
      expect(result.current.shownSongIds).toEqual([])
    })
    expect(jest.mocked(loadPack)).not.toHaveBeenCalled()
  })

  test('returns null pack when game state has no selectedSongPackId', async () => {
    jest.mocked(loadGameState).mockReturnValue({
      selectedSongPackId: null,
      shownSongIds: [],
      currentSong: { songId: null, title: '' },
    })
    const { result } = renderHook(() => useGameHistory())

    await waitFor(() => expect(result.current.pack).toBeNull())
    expect(jest.mocked(loadPack)).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Active game with a valid pack
// ---------------------------------------------------------------------------

describe('useGameHistory — active game', () => {
  test('loads the pack when selectedSongPackId is set', async () => {
    jest.mocked(loadGameState).mockReturnValue({
      selectedSongPackId: 1,
      shownSongIds: [2, 3],
      currentSong: { songId: 2, title: 'Fur Elise' },
    })
    jest.mocked(loadPack).mockResolvedValue(mockPack)

    const { result } = renderHook(() => useGameHistory())

    await waitFor(() => expect(result.current.pack).toEqual(mockPack))
    expect(jest.mocked(loadPack)).toHaveBeenCalledWith(1)
  })

  test('exposes shownSongIds from game state after pack loads', async () => {
    jest.mocked(loadGameState).mockReturnValue({
      selectedSongPackId: 1,
      shownSongIds: [2, 3],
      currentSong: { songId: 2, title: 'Fur Elise' },
    })
    jest.mocked(loadPack).mockResolvedValue(mockPack)

    const { result } = renderHook(() => useGameHistory())

    await waitFor(() => expect(result.current.shownSongIds).toEqual([2, 3]))
  })

  test('keeps pack null when loadPack resolves to null', async () => {
    jest.mocked(loadGameState).mockReturnValue({
      selectedSongPackId: 1,
      shownSongIds: [],
      currentSong: { songId: null, title: '' },
    })
    jest.mocked(loadPack).mockResolvedValue(null)

    const { result } = renderHook(() => useGameHistory())

    await waitFor(() => expect(jest.mocked(loadPack)).toHaveBeenCalled())
    expect(result.current.pack).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// hasSongIdBeenShown()
// ---------------------------------------------------------------------------

describe('useGameHistory — hasSongIdBeenShown()', () => {
  test('returns true for a song id present in shownSongIds', async () => {
    jest.mocked(loadGameState).mockReturnValue({
      selectedSongPackId: 1,
      shownSongIds: [1, 2, 3],
      currentSong: { songId: 1, title: 'X' },
    })
    jest.mocked(loadPack).mockResolvedValue(mockPack)

    const { result } = renderHook(() => useGameHistory())
    await waitFor(() => expect(result.current.shownSongIds).toEqual([1, 2, 3]))

    expect(result.current.hasSongIdBeenShown(1)).toBe(true)
    expect(result.current.hasSongIdBeenShown(3)).toBe(true)
  })

  test('returns false for a song id not in shownSongIds', async () => {
    jest.mocked(loadGameState).mockReturnValue({
      selectedSongPackId: 1,
      shownSongIds: [1],
      currentSong: { songId: 1, title: 'X' },
    })
    jest.mocked(loadPack).mockResolvedValue(mockPack)

    const { result } = renderHook(() => useGameHistory())
    await waitFor(() => expect(result.current.shownSongIds).toEqual([1]))

    expect(result.current.hasSongIdBeenShown(99)).toBe(false)
  })

  test('returns false for all songs when there is no active game', () => {
    jest.mocked(loadGameState).mockReturnValue(null)
    const { result } = renderHook(() => useGameHistory())

    expect(result.current.hasSongIdBeenShown(1)).toBe(false)
  })
})
