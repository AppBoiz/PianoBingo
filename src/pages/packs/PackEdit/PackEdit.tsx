import React, { useEffect, useState } from 'react'
import { loadPack, savePack } from '../../../shared/storage/indexedDb'
import { useNavigation } from '../../../shared/context/NavigationContext'
import { useSongs } from '../../songs/hooks/useSongs'
import { useSortable } from '../hooks/useSortable'
import Header from '../../../shared/components/organisms/Header'
import SelectableSongRow from './molecules/SelectableSongRow'
import PageLayout from '../../../shared/components/organisms/PageLayout'
import PlaylistContainer from '../../../shared/components/organisms/PlaylistContainer'
import PrimaryActionFooter from '../../../shared/components/organisms/PrimaryActionFooter'
import type { Pack } from '../../../shared/types/models'
import { compareSongsByPackMembershipThenPackOrder } from '../../../shared/utils/sort'
import { PACK_SIZE } from '../../../shared/constants/game'
import { PAGE_NAME } from '../../../shared/constants/navigation'
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

export default function PackEdit() {
  const { packId } = useParams<{ packId: string }>()
  const { pack, setPack, isLoading } = useLoadPackFromPathParam(packId)
  const { songs } = useSongs()
  const { loadPage } = useNavigation()

  const containerRef = useSortable(
    orderedIds => {
      setPack(prev => prev ? { ...prev, songs: orderedIds.filter(id => prev.songs.includes(id)) } : prev)
    },
    { rowSelector: '.playlist-row', idAttribute: 'data-song-id' }
  )

  if (isLoading) return <div>Loading...</div>
  if (!pack) return <div>Pack not found</div>

  const songsSortedByPackOrder = songs.sort(compareSongsByPackMembershipThenPackOrder(pack.songs))

  function toggleSong(songId: number) {
    setPack(prev => {
      if (!prev) return prev
      const isInPack = prev.songs.includes(songId)
      const updatedSongs = isInPack
        ? prev.songs.filter(id => id !== songId)
        : [...prev.songs, songId]
      return { ...prev, songs: updatedSongs }
    })
  }

  async function handleSave() {
    if (!pack) return
    await savePack(pack)
    loadPage(PAGE_NAME.PACK_MANAGEMENT)
  }

  const selectedCount = pack.songs.length
  const isPackComplete = selectedCount === PACK_SIZE

  return (
    <PageLayout
      header={(
        <Header
          title="Edit Pack"
          backAction={() => loadPage(PAGE_NAME.PACK_MANAGEMENT)}
          rightContent={<div id="song-counter">{selectedCount}/{PACK_SIZE}</div>}
        />
      )}
      footer={<PrimaryActionFooter label="Ok" disabled={!isPackComplete} onClick={handleSave} />}
    >
      <PlaylistContainer containerRef={containerRef} style={{ flexGrow: 1 }}>
        {songsSortedByPackOrder.map(song => {
          const packPosition = pack.songs.indexOf(song.songId) + 1
          const isInPack = packPosition !== 0
          return (
            <SelectableSongRow
              key={song.songId}
              songId={song.songId}
              title={song.title}
              position={isInPack ? packPosition : null}
              isSelected={isInPack}
              onToggle={() => toggleSong(song.songId)}
            />
          )
        })}
      </PlaylistContainer>
    </PageLayout>
  )
}
