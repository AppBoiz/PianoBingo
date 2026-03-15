import React from 'react'
import { useParams } from 'react-router-dom'
import PDFViewer from '../components/PDFViewer'
import PageLayout from '../components/organisms/PageLayout'
import SongViewHeader from '../components/organisms/SongViewHeader'
import { useLoadedSong } from '../hooks/usePdfSong'
import { loadSong, startNewGame } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'
import { PAGE_NAME } from '../constants/navigation'

export default function SongView(){
  const { loadPage } = useNavigation()
  const { songId: songIdParam } = useParams<{ songId: string }>()
  const { base64, songTitle, isLoading } = useLoadedSong(async () => {
    if (!songIdParam) {
      return null
    }

    const songId = parseInt(songIdParam, 10)
    if (isNaN(songId)) {
      return null
    }

    return loadSong(songId)
  }, [songIdParam])

  function handleBack(){
    startNewGame()
    loadPage(PAGE_NAME.SONG_MANAGEMENT)
  }

  if (isLoading) return <div className="pdf-reader-empty">Loading song...</div>

  if (!base64) return <div className="pdf-reader-empty">No song selected</div>

  return (
    <PageLayout
      rootClassName="pdf-page"
      header={(
        <SongViewHeader title={songTitle} onBack={handleBack} />
      )}
      skipMainWrapper
    >
      <PDFViewer base64={base64} />
    </PageLayout>
  )
}
