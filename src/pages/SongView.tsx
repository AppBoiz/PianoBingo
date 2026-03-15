import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PDFViewer from '../components/PDFViewer'
import { loadSong, startNewGame } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'
import type { Song } from '../types/models'

export default function SongView(){
  const [song, setSong] = useState<Song | null>(null)
  const { loadPage } = useNavigation()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    let mounted = true
    const idParam = searchParams.get('songId')
    if (!idParam) return

    const songId = parseInt(idParam, 10)
    if (isNaN(songId)) return

    loadSong(songId).then(s => {
      if (mounted) setSong(s ?? null)
    })

    return () => {
      mounted = false
    }
  }, [searchParams])

  function handleBack(){
    startNewGame()
    loadPage('SONG_MANAGEMENT')
  }

  console.log(song)

  if (!song) return <div className="pdf-reader-empty">No song selected</div>

  return (
    <div className="pdf-page">
      <nav>
        <button onClick={handleBack}>Back</button>
        <h1 id="title">
          {song.title || 'Untitled'}
        </h1>
      </nav>
      
      <div id="pdf-viewer">
        <PDFViewer base64={song.pdfUrl} />
      </div>
    </div>
  )
}
