import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PDFViewer from '../components/PDFViewer'
import { loadSong, startNewGame } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'

export default function SongView(){
  const [base64, setBase64] = useState<string | null>(null)
  const [songTitle, setSongTitle] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { loadPage } = useNavigation()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    let mounted = true

    const loadSongData = async () => {
      setIsLoading(true)
      setBase64(null)
      setSongTitle('')

      const idParam = searchParams.get('songId')
      if (!idParam) {
        if (mounted) {
          setIsLoading(false)
        }
        return
      }

      const songId = parseInt(idParam, 10)
      if (isNaN(songId)) {
        if (mounted) {
          setIsLoading(false)
        }
        return
      }

      const song = await loadSong(songId)
      if (!mounted) {
        return
      }

      setBase64(song?.pdfUrl ?? null)
      setSongTitle(song?.title || 'Untitled')
      setIsLoading(false)
    }

    loadSongData()

    return () => {
      mounted = false
    }
  }, [searchParams])

  function handleBack(){
    startNewGame()
    loadPage('SONG_MANAGEMENT')
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
