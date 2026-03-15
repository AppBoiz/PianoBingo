import { useEffect, useState } from 'react'
import { loadAllSongs } from '../storage/indexedDb'
import type { Song } from '../types/models'

type UseSongsResult = {
  songs: Song[]
  isLoading: boolean
  refresh: () => Promise<void>
}

export function useSongs(): UseSongsResult {
  const [songs, setSongs] = useState<Song[]>([])
  const [isLoading, setIsLoading] = useState(true)

  async function refresh() {
    setIsLoading(true)
    try {
      const data = await loadAllSongs()
      setSongs(data || [])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    loadAllSongs()
      .then(data => {
        if (!cancelled) {
          setSongs(data || [])
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { songs, isLoading, refresh }
}
