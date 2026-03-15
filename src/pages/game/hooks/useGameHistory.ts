import { useEffect, useState } from 'react'
import { loadGameState, loadPack } from '../../../shared/storage/indexedDb'
import type { Pack } from '../../../shared/types/models'

type UseGameHistoryResult = {
  pack: Pack | null
  shownSongIds: number[]
  hasSongIdBeenShown: (songId: number) => boolean
}

export function useGameHistory(): UseGameHistoryResult {
  const [pack, setPack] = useState<Pack | null>(null)
  const [shownSongIds, setShownSongIds] = useState<number[]>([])

  useEffect(() => {
    let cancelled = false
    const gameState = loadGameState()
    if (!gameState?.selectedSongPackId) return

    loadPack(gameState.selectedSongPackId).then(packData => {
      if (!cancelled && packData) {
        setPack(packData)
        setShownSongIds(gameState.shownSongIds || [])
      }
    })

    return () => { cancelled = true }
  }, [])

  const hasSongIdBeenShown = (songId: number) => shownSongIds.includes(songId)

  return { pack, shownSongIds, hasSongIdBeenShown }
}
