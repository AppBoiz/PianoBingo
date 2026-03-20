import React from 'react'
import { useParams } from 'react-router-dom'
import PDFViewer from '../../../shared/components/pdf/PDFViewer'
import PageLayout from '../../../shared/components/organisms/PageLayout'
import SongViewHeader from './organisms/SongViewHeader'
import { useLoadedSong } from '../../game/hooks/usePdfSong'
import { loadSong, startNewGame } from '../../../shared/storage/indexedDb'
import { useNavigation } from '../../../shared/context/NavigationContext'
import { PAGE_NAME } from '../../../shared/constants/navigation'

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
      rootTestId="page-song-view"
      header={(
        <SongViewHeader title={songTitle} onBack={handleBack} />
      )}
      skipMainWrapper
    >
      <PDFViewer base64={base64} />
    </PageLayout>
  )
}
