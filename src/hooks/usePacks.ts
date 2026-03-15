import { useEffect, useState } from 'react'
import { loadAllPacks } from '../storage/indexedDb'
import type { Pack } from '../types/models'

type UsePacksResult = {
  packs: Pack[]
  isLoading: boolean
  refresh: () => Promise<void>
}

export function usePacks(): UsePacksResult {
  const [packs, setPacks] = useState<Pack[]>([])
  const [isLoading, setIsLoading] = useState(true)

  async function refresh() {
    setIsLoading(true)
    try {
      const data = await loadAllPacks()
      setPacks(data || [])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    loadAllPacks()
      .then(data => {
        if (!cancelled) {
          setPacks(data || [])
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { packs, isLoading, refresh }
}
