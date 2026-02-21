import React from 'react'
import PDFViewer from '../components/PDFViewer'
import { getCurrentSong, nextSong, prevSong } from '../storage/indexedDb'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useNavigation } from '../context/NavigationContext'

export default function SongView(){
  const [song, setSong] = useState<any>(null)
  const navigate = useNavigate()
  const { loadPage } = useNavigation()

  useEffect(() => {
    const s = getCurrentSong()
    setSong(s)
  }, [])

  async function handleNext(){
    await nextSong()
    setSong(getCurrentSong())
  }

  async function handlePrev(){
    await prevSong()
    setSong(getCurrentSong())
  }

  if (!song) return <div className="pdf-reader-empty">No song selected</div>

  return (
    <div id="pdf-reader-root">
      <div className="reader-controls">
        <button onClick={() => loadPage('WELCOME')}>Back</button>
        <button onClick={handlePrev}>Prev</button>
        <button onClick={handleNext}>Next</button>
      </div>
      <div className="reader-view">
        <PDFViewer base64={song.pdfUrl} />
      </div>
    </div>
  )
}
