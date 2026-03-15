import React from 'react'
import { useSearchParams } from 'react-router-dom'
import PDFViewer from '../components/PDFViewer'
import { useLoadedSong } from '../hooks/usePdfSong'
import { loadSong, startNewGame } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'
import { PAGE_NAME } from '../constants/navigation'

export default function SongView(){
  const { loadPage } = useNavigation()
  const [searchParams] = useSearchParams()
  const { base64, songTitle, isLoading } = useLoadedSong(async () => {
    const idParam = searchParams.get('songId')
    if (!idParam) {
      return null
    }

    const songId = parseInt(idParam, 10)
    if (isNaN(songId)) {
      return null
    }

    return loadSong(songId)
  }, [searchParams])

  function handleBack(){
    startNewGame()
    loadPage(PAGE_NAME.SONG_MANAGEMENT)
  }

  if (isLoading) return <div className="pdf-reader-empty">Loading song...</div>

  if (!base64) return <div className="pdf-reader-empty">No song selected</div>

  return (
    <div className="pdf-page">
      <nav>
        <button onClick={handleBack}>Back</button>
        <h1 id="title">
          {songTitle}
        </h1>
      </nav>

      <PDFViewer base64={base64} />
    </div>
  )
}
