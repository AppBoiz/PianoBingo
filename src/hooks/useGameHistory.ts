import { useEffect, useState } from 'react'
import { loadGameState, loadPack } from '../storage/indexedDb'
import type { Pack } from '../types/models'

type UseGameHistoryResult = {
  pack: Pack | null
  shownSongIds: number[]
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

  return { pack, shownSongIds }
}
