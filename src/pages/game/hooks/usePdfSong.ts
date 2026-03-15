import { useEffect, useState } from 'react'
import type { DependencyList } from 'react'

import type { Song } from '../../../shared/types/models'

type UseLoadedSongResult = {
  song: Song | null
  base64: string | null
  songTitle: string
  isLoading: boolean
  reload: () => Promise<Song | null>
  nextSong: () => Promise<Song | null>
  prevSong: () => Promise<Song | null>
}

type SongNavigationLoaders = {
  loadNextSong?: () => Promise<Song | null>
  loadPrevSong?: () => Promise<Song | null>
}

/**
 * Loads and tracks song state from async storage loaders (for example IndexedDB).
 *
 * It executes the provided async `loader`, derives `base64` and `songTitle`
 * from the returned song, and exposes a loading flag while requests are in
 * flight. The hook re-runs when `deps` change and also provides `reload()` for
 * manual refreshes (for example after next/previous song actions).
 *
 * @param loader Async function that resolves to the current song or `null`.
 * @param deps Dependency list controlling when the initial effect re-loads.
 * @returns Current song data, derived display values, loading state, and reload function.
 */
export function useLoadedSong(
  loader: () => Promise<Song | null>,
  deps: DependencyList,
  navigationLoaders?: SongNavigationLoaders,
): UseLoadedSongResult {
  const [song, setSong] = useState<Song | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Per-effect cancelled flag is the correct pattern: unlike a persistent ref, it
  // resets to false on every remount (including React StrictMode double-invoke),
  // so setIsLoading(false) always fires when the component is live.
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    loader()
      .then(nextSong => {
        if (!cancelled) {
          setSong(nextSong)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // reload() is called from user actions (next/prev song), not from effects.
  // No cancellation needed: React 18 no-ops setState on unmounted components.
  async function reload() {
    setIsLoading(true)
    try {
      const nextSong = await loader()
      setSong(nextSong)
      return nextSong
    } finally {
      setIsLoading(false)
    }
  }

  async function nextSong() {
    if (!navigationLoaders?.loadNextSong) {
      return reload()
    }

    setIsLoading(true)
    try {
      const nextSongValue = await navigationLoaders.loadNextSong()
      setSong(nextSongValue)
      return nextSongValue
    } finally {
      setIsLoading(false)
    }
  }

  async function prevSong() {
    if (!navigationLoaders?.loadPrevSong) {
      return reload()
    }

    setIsLoading(true)
    try {
      const prevSongValue = await navigationLoaders.loadPrevSong()
      setSong(prevSongValue)
      return prevSongValue
    } finally {
      setIsLoading(false)
    }
  }

  const base64 = song?.pdfUrl ?? null
  const songTitle = song ? song.title || 'Untitled' : ''

  return {
    song,
    base64,
    songTitle,
    isLoading,
    reload,
    nextSong,
    prevSong,
  }
}

// Backward-compatible alias while call sites are migrated.
export const usePdfSong = useLoadedSong