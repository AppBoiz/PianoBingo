import React from 'react'
import { saveSong, deleteSong, loadSong, startNewGame } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'
import { useSongs } from '../hooks/useSongs'
import { fileToBase64 } from '../utils/fileUtils'
import Header from '../components/Header'
import type { Song } from '../types/models'

export default function SongManagement(){
  const { songs, refresh: refreshSongs } = useSongs()
  const { loadPage } = useNavigation()

  async function handleRenameSong(songId: number, newName: string){
    const song = await loadSong(songId)
    if (!song) return
    song.title = newName
    await saveSong(song)
    await refreshSongs()
  }

  async function handleCreateNewSong(){
    const maxSongId = songs.length > 0 ? Math.max(...songs.map(s => s.songId)) : 0
    const newSong: Song = {
      songId: maxSongId + 1,
      title: 'New Song',
      pdfUrl: null
    }
    await saveSong(newSong)
    await refreshSongs()
  }

  function handleViewSong(songId: number){
    loadPage(`/song-view?songId=${songId}`)
  }

  async function handleDeleteSong(songId: number){
    await deleteSong(songId)
    await refreshSongs()
  }

  async function handleUpload(file: File, songId: number){
    const base64 = await fileToBase64(file)
    const song = await loadSong(songId)
    if (!song) return
    song.pdfUrl = base64.split(',')[1]
    await saveSong(song)
    await refreshSongs()
  }

  return (
    <div id="app">
      <Header title="Manage Songs" backAction={() => { startNewGame(); loadPage('WELCOME') }} />

      <div className="main-content">
        <div className="playlist-container">
          {songs.map(song => {
            const hasPdf = !!song.pdfUrl
            return (
              <div className="playlist-row" key={song.songId}>
                <input className="playlist-name-input" defaultValue={song.title} onBlur={(e) => handleRenameSong(song.songId, e.currentTarget.value)} />
                <div className="playlist-actions">
                  {hasPdf ? (
                    <>
                      <button className="pdf-btn" onClick={() => handleViewSong(song.songId)}>📄 View</button>
                      <button className="remove-pdf-btn" onClick={async () => { const s = await loadSong(song.songId); if (!s) return; s.pdfUrl = null; await saveSong(s); await refreshSongs() }}>❌ PDF</button>
                    </>
                  ) : (
                    <>
                      <label className="pdf-upload-label" htmlFor={`upload-${song.songId}`}>📤 Upload PDF</label>
                      <input id={`upload-${song.songId}`} type="file" accept="application/pdf" className="pdf-upload" onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) handleUpload(f, song.songId) }} />
                    </>
                  )}
                  <button className="delete-btn" onClick={() => handleDeleteSong(song.songId)}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="footer">
        <button className="primary-btn" onClick={handleCreateNewSong}>New Song</button>
      </div>
    </div>
  )
}
