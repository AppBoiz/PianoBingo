import React, { useEffect, useRef, useState } from 'react'
import Sortable from 'sortablejs'
import { getSelectedSongPackId, loadPack, loadAllSongs, savePack, startNewGame } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'
import Header from '../components/Header'
import type { Pack, Song } from '../types/models'

export default function PackEdit(){
  const [packData, setPackData] = useState<Pack | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sortableRef = useRef<Sortable | null>(null)
  const { loadPage } = useNavigation()

  useEffect(() => {
    let mounted = true
    const init = async () => {
      const selectedPackId = getSelectedSongPackId()
      const p = await loadPack(selectedPackId)
      const all = await loadAllSongs()
      if (!p) return
      if (!p.songs) p.songs = []
      if (mounted) {
        setPackData(p)
        setSongs(all || [])
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    if (sortableRef.current) return
    sortableRef.current = Sortable.create(containerRef.current, {
      animation: 150,
      handle: '.drag-handle',
      onEnd: () => {
        // compute new order of songs that are in pack
        const newOrder = Array.from(containerRef.current!.querySelectorAll('.playlist-row'))
          .map(el => parseInt(el.getAttribute('data-song-id') || '0', 10))
          .filter(id => packData?.songs?.includes(id))
        setPackData(prev => prev ? { ...prev, songs: newOrder } : prev)
      }
    })
  }, [containerRef.current, packData])

  if (!packData) return <div>Loading...</div>

  const total = 75
  const selectedCount = (packData.songs || []).length
  const okDisabled = selectedCount !== total

  const sortedSongs = [...songs].sort((a,b) => {
    const indexA = packData.songs.findIndex(id => id === a.songId)
    const indexB = packData.songs.findIndex(id => id === b.songId)
    if (indexA !== -1 && indexB !== -1) return indexA - indexB
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1
    return a.songId - b.songId
  })

  function toggleSong(songId:number){
    const has = packData.songs.includes(songId)
    const next = has ? packData.songs.filter(id => id !== songId) : [...packData.songs, songId]
    setPackData({ ...packData, songs: next })
  }

  return (
    <div id="app">
      <Header 
        title="Edit Pack" 
        backAction={() => { startNewGame(); loadPage('PACK_MANAGEMENT') }}
        rightContent={<div id="song-counter">{selectedCount}/{total}</div>}
      />

      <div className="main-content">
        <div ref={containerRef} className="playlist-container" style={{flexGrow:1}}>
          {sortedSongs.map(song => {
            const packPosition = packData.songs.findIndex(id => id === song.songId) + 1
            const isChecked = packPosition !== 0
            return (
              <div key={song.songId} className={`playlist-row ${isChecked ? '' : 'unchecked'}`} data-song-id={song.songId}
                onClick={(e) => { if ((e.target as HTMLElement).classList.contains('playlist-checkbox')) return; toggleSong(song.songId) }}>
                <span className="drag-handle">{isChecked ? packPosition : '\u00A0'}</span>
                <span className="playlist-name">{song.title}</span>
                <input className="playlist-checkbox" type="checkbox" checked={isChecked} onChange={(e) => { toggleSong(song.songId) }} />
              </div>
            )
          })}
        </div>
      </div>

      <div className="footer">
        <button className="primary-btn" disabled={okDisabled} onClick={async () => { if (!okDisabled) { await savePack(packData); loadPage('PACK_MANAGEMENT') } }}>Ok</button>
      </div>
    </div>
  )
}
