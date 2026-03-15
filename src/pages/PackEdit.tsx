import React, { useEffect, useState } from 'react'
import { getSelectedSongPackId, loadPack, savePack, startNewGame } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'
import { useSongs } from '../hooks/useSongs'
import { useSortable } from '../hooks/useSortable'
import Header from '../components/Header'
import type { Pack } from '../types/models'
import { compareSongsByPackMembershipThenPackOrder } from '../utils/sort'
import { PACK_SIZE } from '../constants/game'

function useLoadSelectedPack() {
  const [pack, setPack] = useState<Pack | null>(null)

  useEffect(() => {
    let cancelled = false
    const packId = getSelectedSongPackId()
    if (!packId) return
    loadPack(packId).then(loaded => {
      if (loaded && !cancelled) setPack({ ...loaded, songs: loaded.songs ?? [] })
    })
    return () => { cancelled = true }
  }, [])

  return [pack, setPack] as const
}

export default function PackEdit() {
  const [pack, setPack] = useLoadSelectedPack()
  const { songs } = useSongs()
  const { loadPage } = useNavigation()

  const containerRef = useSortable(
    orderedIds => {
      setPack(prev => prev ? { ...prev, songs: orderedIds.filter(id => prev.songs.includes(id)) } : prev)
    },
    { rowSelector: '.playlist-row', idAttribute: 'data-song-id' }
  )

  if (!pack) return <div>Loading...</div>

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
    loadPage('PACK_MANAGEMENT')
  }

  const selectedCount = pack.songs.length
  const isPackComplete = selectedCount === PACK_SIZE

  return (
    <div id="app">
      <Header
        title="Edit Pack"
        backAction={() => { startNewGame(); loadPage('PACK_MANAGEMENT') }}
        rightContent={<div id="song-counter">{selectedCount}/{PACK_SIZE}</div>}
      />

      <div className="main-content">
        <div ref={containerRef} className="playlist-container" style={{ flexGrow: 1 }}>
          {songsSortedByPackOrder.map(song => {
            const packPosition = pack.songs.indexOf(song.songId) + 1
            const isInPack = packPosition !== 0
            return (
              <div
                key={song.songId}
                className={`playlist-row ${isInPack ? '' : 'unchecked'}`}
                data-song-id={song.songId}
                onClick={(e) => {
                  if ((e.target as HTMLElement).classList.contains('playlist-checkbox')) return
                  toggleSong(song.songId)
                }}
              >
                <span className="drag-handle">{isInPack ? packPosition : '\u00A0'}</span>
                <span className="playlist-name">{song.title}</span>
                <input
                  className="playlist-checkbox"
                  type="checkbox"
                  checked={isInPack}
                  onChange={() => toggleSong(song.songId)}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="footer">
        <button className="primary-btn" disabled={!isPackComplete} onClick={handleSave}>
          Ok
        </button>
      </div>
    </div>
  )
}
