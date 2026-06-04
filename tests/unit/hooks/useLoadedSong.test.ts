/** @jest-environment jsdom */
import { renderHook, act, waitFor } from '@testing-library/react'
import { useLoadedSong } from '../../../src/pages/game/hooks/usePdfSong'
import type { Song } from '../../../src/shared/types/models'

const song1: Song = { songId: 1, title: 'Song One', pdfUrl: 'JVBERi0base64', version: 1 }
const song2: Song = { songId: 2, title: 'Song Two', pdfUrl: null, version: 1 }

// ---------------------------------------------------------------------------
// Initial load behaviour
// ---------------------------------------------------------------------------

describe('useLoadedSong — initial load', () => {
  test('starts with isLoading=true then transitions to false', async () => {
    const loader = jest.fn().mockResolvedValue(song1)
    const { result } = renderHook(() => useLoadedSong(loader, []))

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  test('exposes the song returned by the loader', async () => {
    const loader = jest.fn().mockResolvedValue(song1)
    const { result } = renderHook(() => useLoadedSong(loader, []))
    await waitFor(() => expect(result.current.song).toEqual(song1))
  })

  test('exposes pdfUrl as base64 when the song has one', async () => {
    const loader = jest.fn().mockResolvedValue(song1)
    const { result } = renderHook(() => useLoadedSong(loader, []))
    await waitFor(() => expect(result.current.base64).toBe(song1.pdfUrl))
  })

  test('exposes null base64 when the song has no pdfUrl', async () => {
    const loader = jest.fn().mockResolvedValue(song2)
    const { result } = renderHook(() => useLoadedSong(loader, []))
    await waitFor(() => expect(result.current.base64).toBeNull())
  })

  test('exposes song.title as songTitle', async () => {
    const loader = jest.fn().mockResolvedValue(song1)
    const { result } = renderHook(() => useLoadedSong(loader, []))
    await waitFor(() => expect(result.current.songTitle).toBe('Song One'))
  })

  test('falls back to "Untitled" when song.title is empty', async () => {
    const loader = jest.fn().mockResolvedValue({ ...song1, title: '' })
    const { result } = renderHook(() => useLoadedSong(loader, []))
    await waitFor(() => expect(result.current.songTitle).toBe('Untitled'))
  })

  test('exposes empty string songTitle when loader returns null', async () => {
    const loader = jest.fn().mockResolvedValue(null)
    const { result } = renderHook(() => useLoadedSong(loader, []))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.songTitle).toBe('')
  })

  test('sets isLoading=false even when loader rejects', async () => {
    const loader = jest.fn().mockRejectedValue(new Error('DB failure'))
    const { result } = renderHook(() => useLoadedSong(loader, []))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.song).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// reload()
// ---------------------------------------------------------------------------

describe('useLoadedSong — reload()', () => {
  test('re-fetches from the loader and updates song', async () => {
    const loader = jest.fn()
      .mockResolvedValueOnce(song1)
      .mockResolvedValueOnce(song2)
    const { result } = renderHook(() => useLoadedSong(loader, []))
    await waitFor(() => expect(result.current.song?.songId).toBe(1))

    await act(async () => { await result.current.reload() })

    expect(result.current.song?.songId).toBe(2)
  })

  test('returns the newly-loaded song', async () => {
    const loader = jest.fn()
      .mockResolvedValueOnce(song1)
      .mockResolvedValueOnce(song2)
    const { result } = renderHook(() => useLoadedSong(loader, []))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let returned: Song | null | undefined
    await act(async () => { returned = await result.current.reload() })

    expect(returned).toEqual(song2)
  })
})

// ---------------------------------------------------------------------------
// nextSong()
// ---------------------------------------------------------------------------

describe('useLoadedSong — nextSong()', () => {
  test('calls loadNextSong when provided and updates song', async () => {
    const loader = jest.fn().mockResolvedValue(song1)
    const loadNextSong = jest.fn().mockResolvedValue(song2)
    const { result } = renderHook(() => useLoadedSong(loader, [], { loadNextSong }))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => { await result.current.nextSong() })

    expect(loadNextSong).toHaveBeenCalledTimes(1)
    expect(result.current.song?.songId).toBe(2)
  })

  test('falls back to reload() when no loadNextSong is provided', async () => {
    const loader = jest.fn()
      .mockResolvedValueOnce(song1)
      .mockResolvedValueOnce(song2)
    const { result } = renderHook(() => useLoadedSong(loader, []))
    await waitFor(() => expect(result.current.song?.songId).toBe(1))

    await act(async () => { await result.current.nextSong() })

    expect(loader).toHaveBeenCalledTimes(2)
    expect(result.current.song?.songId).toBe(2)
  })

  test('keeps the current song when loadNextSong returns null', async () => {
    const loader = jest.fn().mockResolvedValue(song1)
    const loadNextSong = jest.fn().mockResolvedValue(null)
    const { result } = renderHook(() => useLoadedSong(loader, [], { loadNextSong }))
    await waitFor(() => expect(result.current.song?.songId).toBe(1))

    await act(async () => { await result.current.nextSong() })

    expect(result.current.song?.songId).toBe(1)
    expect(result.current.songTitle).toBe('Song One')
  })
})

// ---------------------------------------------------------------------------
// prevSong()
// ---------------------------------------------------------------------------

describe('useLoadedSong — prevSong()', () => {
  test('calls loadPrevSong when provided and updates song', async () => {
    const loader = jest.fn().mockResolvedValue(song2)
    const loadPrevSong = jest.fn().mockResolvedValue(song1)
    const { result } = renderHook(() => useLoadedSong(loader, [], { loadPrevSong }))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => { await result.current.prevSong() })

    expect(loadPrevSong).toHaveBeenCalledTimes(1)
    expect(result.current.song?.songId).toBe(1)
  })

  test('falls back to reload() when no loadPrevSong is provided', async () => {
    const loader = jest.fn()
      .mockResolvedValueOnce(song2)
      .mockResolvedValueOnce(song1)
    const { result } = renderHook(() => useLoadedSong(loader, []))
    await waitFor(() => expect(result.current.song?.songId).toBe(2))

    await act(async () => { await result.current.prevSong() })

    expect(loader).toHaveBeenCalledTimes(2)
    expect(result.current.song?.songId).toBe(1)
  })

  test('keeps the current song when loadPrevSong returns null', async () => {
    const loader = jest.fn().mockResolvedValue(song1)
    const loadPrevSong = jest.fn().mockResolvedValue(null)
    const { result } = renderHook(() => useLoadedSong(loader, [], { loadPrevSong }))
    await waitFor(() => expect(result.current.song?.songId).toBe(1))

    await act(async () => { await result.current.prevSong() })

    expect(result.current.song?.songId).toBe(1)
    expect(result.current.songTitle).toBe('Song One')
  })
})
