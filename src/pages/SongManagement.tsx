import React, { useEffect, useState } from 'react'
import { loadAllSongs, saveSong, deleteSong, loadSong, setSongId, startNewGame } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'
import Header from '../components/Header'

export default function SongManagement(){
  const [songs, setSongs] = useState<any[]>([])
  const { loadPage } = useNavigation()

  useEffect(() => { fetchSongs() }, [])

  async function fetchSongs(){
    const data = await loadAllSongs()
    setSongs(data || [])
  }

  async function handleRenameSong(songId:number, newName:string){
    const song = await loadSong(songId)
    if (!song) return
    song.title = newName
    await saveSong(song)
    await fetchSongs()
  }

  async function handleCreateNewSong(){
    const songData = await loadAllSongs()
    const maxSongId = songData.length > 0 ? Math.max(...songData.map((s:any)=>s.songId)) : 0
    const newSong = {
      songId: maxSongId + 1,
      title: 'New Song',
      pdfUrl: null
    }
    await saveSong(newSong)
    await fetchSongs()
  }

  async function handleViewSong(songId:number){
    await setSongId(songId)
    loadPage('SONG_VIEW')
  }

  async function handleDeleteSong(songId:number){
    await deleteSong(songId)
    await fetchSongs()
  }

  async function handleUpload(file: File, songId:number){
    const base64 = await fileToBase64(file)
    const song = await loadSong(songId)
    if (!song) return
    song.pdfUrl = base64.split(',')[1]
    await saveSong(song)
    await fetchSongs()
  }

  function fileToBase64(file: File){
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (err) => reject(err)
    })
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
                      <button className="remove-pdf-btn" onClick={async () => { const s = await loadSong(song.songId); if (!s) return; s.pdfUrl = null; await saveSong(s); await fetchSongs() }}>❌ PDF</button>
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
