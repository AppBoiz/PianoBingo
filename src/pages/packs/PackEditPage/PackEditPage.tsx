import React, { useEffect, useState } from 'react'
import { loadPack, savePack } from '../../../shared/storage/indexedDb'
import { useNavigation } from '../../../shared/context/NavigationContext'
import { useSongs } from '../../songs/hooks/useSongs'
import Header from '../../../shared/components/organisms/Header'
import PageLayout from '../../../shared/components/organisms/PageLayout'
import PrimaryActionFooter from '../../../shared/components/organisms/PrimaryActionFooter'
import PackSlots from './organisms/PackSlots'
import SongSelectionModal from './organisms/SongSelectionModal'
import type { Pack, Song } from '../../../shared/types/models'
import { PACK_SIZE } from '../../../shared/constants/game'
import { PAGE_NAME } from '../../../shared/constants/navigation'
import { displaySlotsFromPackSongs, packSongsFromDisplaySlots } from './utils/slotDataTransforms'
import { useParams } from 'react-router-dom'

function useLoadPackFromPathParam(packIdParam: string | undefined) {
  const [pack, setPack] = useState<Pack | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let cancelled = false
    const packId = packIdParam ? Number.parseInt(packIdParam, 10) : NaN

    if (!Number.isFinite(packId)) {
      setPack(null)
      setIsLoading(false)
      return () => { cancelled = true }
    }

    setIsLoading(true)
    loadPack(packId).then(loaded => {
      if (!cancelled) {
        setPack(loaded ? { ...loaded, songs: loaded.songs ?? [] } : null)
        setIsLoading(false)
      }
    }).catch(() => {
      if (!cancelled) {
        setPack(null)
        setIsLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [packIdParam])

  return { pack, setPack, isLoading }
}

export default function PackEditPage() {
  const { packId } = useParams<{ packId: string }>()
  const { pack, setPack, isLoading } = useLoadPackFromPathParam(packId)
  const { songs } = useSongs()
  const { loadPage } = useNavigation()

  const [displaySlots, setDisplaySlots] = useState<(Song | null)[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null)

  // Initialize displaySlots from pack.songs when pack loads
  useEffect(() => {
    if (pack && songs.length > 0) {
      const slots = displaySlotsFromPackSongs(pack.songs, songs, PACK_SIZE)
      setDisplaySlots(slots)
    }
  }, [pack, songs])

  if (isLoading) return <div className="flex min-h-screen items-center justify-center px-6 text-xl text-zinc-600">Loading...</div>
  if (!pack) return <div className="flex min-h-screen items-center justify-center px-6 text-xl text-zinc-600">Pack not found</div>

  function handleSlotSelect(slotIndex: number) {
    setSelectedSlotIndex(slotIndex)
    setModalOpen(true)
  }

  function handleSlotClear(slotIndex: number) {
    setDisplaySlots(prev => {
      const updated = [...prev]
      updated[slotIndex] = null
      return updated
    })
  }

  function handleSongSelect(songId: number, slotIndex: number) {
    const song = songs.find(s => s.songId === songId)
    if (song) {
      setDisplaySlots(prev => {
        const updated = [...prev]
        updated[slotIndex] = song
        return updated
      })
    }
  }

  async function handleSave() {
    if (!pack) return
    const updatedSongs = packSongsFromDisplaySlots(displaySlots)
    const updatedPack = { ...pack, songs: updatedSongs }
    await savePack(updatedPack)
    loadPage(PAGE_NAME.PACK_MANAGEMENT)
  }

  const selectedCount = displaySlots.filter(s => s !== null).length
  const isPackComplete = selectedCount === PACK_SIZE
  const alreadySelectedSongIds = displaySlots
    .filter((song): song is Song => song !== null)
    .map(song => song.songId)

  return (
    <PageLayout
      rootClassName="pack-edit-page-root text-center"
      rootTestId="pack-edit-page"
      header={(
        <Header
          title="Edit Pack"
          backAction={() => loadPage(PAGE_NAME.PACK_MANAGEMENT)}
          rightContent={<div data-testid="song-counter">{selectedCount}/{PACK_SIZE}</div>}
        />
      )}
      footer={<PrimaryActionFooter label="Ok" actionId="save-pack" disabled={!isPackComplete} onClick={handleSave} />}
    >
      <div className="my-4 w-full px-4 pb-6 md:px-6">
        <PackSlots
          displaySlots={displaySlots}
          onSlotSelect={handleSlotSelect}
          onSlotClear={handleSlotClear}
        />
      </div>

      <SongSelectionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        allSongs={songs}
        alreadySelectedSongIds={alreadySelectedSongIds}
        onSongSelect={handleSongSelect}
        currentSlotIndex={selectedSlotIndex}
      />
    </PageLayout>
  )
}
