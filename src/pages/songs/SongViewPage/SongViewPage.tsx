import React from 'react'
import { useParams } from 'react-router-dom'
import PDFViewer from '../../../shared/components/pdf/PDFViewer'
import PageLayout from '../../../shared/components/organisms/PageLayout'
import SongViewPageHeader from './organisms/SongViewPageHeader'
import { useLoadedSong } from '../../game/hooks/usePdfSong'
import { loadSong, startNewGame } from '../../../shared/storage/indexedDb'
import { useNavigation } from '../../../shared/context/NavigationContext'
import { PAGE_NAME } from '../../../shared/constants/navigation'
import '../../../styles/legacy/song-view.css'

export default function SongViewPage(){
  const { loadPage } = useNavigation()
  const { songId: songIdParam } = useParams<{ songId: string }>()
  const { base64, isLoading } = useLoadedSong(async () => {
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

  if (isLoading) return <div className="song-view-page-root pdf-reader-empty">Loading song...</div>

  if (!base64) return <div className="song-view-page-root pdf-reader-empty">No song selected</div>

  return (
    <PageLayout
      rootClassName="song-view-page-root pdf-page"
      rootTestId="song-view-page"
      header={(
        <SongViewPageHeader onBack={handleBack} />
      )}
      skipMainWrapper
    >
      <PDFViewer base64={base64} scaleMode="fit-contain" />
    </PageLayout>
  )
}
