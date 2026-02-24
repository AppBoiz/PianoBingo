import React from 'react'
import PDFViewer from '../components/PDFViewer'
import { getCurrentSong, startNewGame } from '../storage/indexedDb'
import { useEffect, useState } from 'react'
import { useNavigation } from '../context/NavigationContext'

export default function SongView(){
  const [song, setSong] = useState<any>(null)
  const { loadPage } = useNavigation()

  useEffect(() => {
    const s = getCurrentSong()
    setSong(s)
  }, [])

  function handleBack(){
    startNewGame()
    loadPage('SONG_MANAGEMENT')
  }

  if (!song) return <div className="pdf-reader-empty">No song selected</div>

  return (
    <div className="pdf-page">
      <nav>
        <button onClick={handleBack}>Back</button>
        <h1 id="title">
          {song.songId} - {song.title || 'Untitled'}
        </h1>
      </nav>
      
      <div id="pdf-viewer">
        <PDFViewer base64={song.pdfUrl} />
      </div>
    </div>
  )
}
