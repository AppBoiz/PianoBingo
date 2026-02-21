import React, { useEffect, useRef, useState } from 'react'
import Sortable from 'sortablejs'
import { getSelectedSongPackId, loadPack, loadAllSongs, savePack, startNewGame } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'

export default function PackEdit(){
  const [packData, setPackData] = useState<any | null>(null)
  const [songs, setSongs] = useState<any[]>([])
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
        setPackData((prev:any) => ({ ...prev, songs: newOrder }))
      }
    })
  }, [containerRef.current, packData])

  if (!packData) return <div>Loading...</div>

  const total = 75
  const selectedCount = (packData.songs || []).length
  const okDisabled = selectedCount !== total

  const sortedSongs = [...songs].sort((a,b) => {
    const indexA = packData.songs.findIndex((id:number) => id === a.songId)
    const indexB = packData.songs.findIndex((id:number) => id === b.songId)
    if (indexA !== -1 && indexB !== -1) return indexA - indexB
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1
    return a.songId - b.songId
  })

  function toggleSong(songId:number){
    const has = packData.songs.includes(songId)
    const next = has ? packData.songs.filter((id:number) => id !== songId) : [...packData.songs, songId]
    setPackData({ ...packData, songs: next })
  }

  return (
    <div id="app">
      <div className="nav-bar">
        <div className="back-container nav-bar-left">
          <button onClick={() => { startNewGame(); loadPage('PACK_MANAGEMENT') }}>Back</button>
        </div>
        <h1>Edit Pack</h1>
        <div id="song-counter" className="nav-bar-right">{selectedCount}/{total}</div>
      </div>

      <div className="main-content">
        <div ref={containerRef} className="playlist-container" style={{flexGrow:1}}>
          {sortedSongs.map(song => {
            const songIdInPack = packData.songs.findIndex((id:number) => id === song.songId) + 1
            const isChecked = songIdInPack !== 0
            return (
              <div key={song.songId} className={`playlist-row ${isChecked ? '' : 'unchecked'}`} data-song-id={song.songId}
                onClick={(e) => { if ((e.target as HTMLElement).classList.contains('playlist-checkbox')) return; toggleSong(song.songId) }}>
                <span className="drag-handle">{isChecked ? songIdInPack : '\u00A0'}</span>
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
