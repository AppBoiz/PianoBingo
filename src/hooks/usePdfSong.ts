import { useEffect, useState } from 'react'
import type { DependencyList } from 'react'

import type { Song } from '../types/models'

type UsePdfSongResult = {
  song: Song | null
  base64: string | null
  songTitle: string
  isLoading: boolean
  reload: () => Promise<Song | null>
}

export function usePdfSong(loader: () => Promise<Song | null>, deps: DependencyList): UsePdfSongResult {
  const [song, setSong] = useState<Song | null>(null)
  const [base64, setBase64] = useState<string | null>(null)
  const [songTitle, setSongTitle] = useState<string>('')
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
          setBase64(nextSong?.pdfUrl ?? null)
          setSongTitle(nextSong ? nextSong.title || 'Untitled' : '')
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
      setBase64(nextSong?.pdfUrl ?? null)
      setSongTitle(nextSong ? nextSong.title || 'Untitled' : '')
      return nextSong
    } finally {
      setIsLoading(false)
    }
  }

  return {
    song,
    base64,
    songTitle,
    isLoading,
    reload,
  }
}