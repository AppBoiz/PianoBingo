import React, { useEffect, useState } from 'react'
import PDFViewer from '../components/PDFViewer'
import PageLayout from '../components/organisms/PageLayout'
import PdfReaderHeader from '../components/organisms/PdfReaderHeader'
import PdfReaderFooter from '../components/organisms/PdfReaderFooter'
import { useLoadedSong } from '../hooks/usePdfSong'
import { getCurrentSong, getSelectedSongPackId, loadPack, nextSong as loadNextSongFromStorage, prevSong as loadPrevSongFromStorage } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'
import { PAGE_NAME } from '../constants/navigation'

function useCurrentSongPositionInSelectedPack(song: { songId: number; pdfUrl: string | null } | null | undefined) {
  const [songIndex, setSongIndex] = useState<number>(0)

  useEffect(() => {
    const loadSongIndex = async () => {
      if (!song || !song.pdfUrl) {
        setSongIndex(0)
        return
      }

      const selectedPackId = getSelectedSongPackId()
      if (!selectedPackId) {
        setSongIndex(0)
        return
      }

      const packData = await loadPack(selectedPackId)
      if (!packData) {
        setSongIndex(0)
        return
      }

      const index = packData.songs.findIndex(id => id === song.songId)
      setSongIndex(index !== -1 ? index + 1 : 0)
    }

    void loadSongIndex()
  }, [song])

  return songIndex
}

export default function PdfReader(){
  const { loadPage } = useNavigation()
  const { song, base64, songTitle, nextSong, prevSong } = useLoadedSong(getCurrentSong, [], {
    loadNextSong: loadNextSongFromStorage,
    loadPrevSong: loadPrevSongFromStorage,
  })
  const songIndex = useCurrentSongPositionInSelectedPack(song)

  return (
    <PageLayout
      rootClassName="pdf-page"
      header={(
        <PdfReaderHeader
          songIndex={songIndex}
          songTitle={songTitle}
          onNextSong={nextSong}
          onPreviousSong={prevSong}
          onOpenGameHistory={() => loadPage(PAGE_NAME.GAME_HISTORY)}
          onEndGame={() => loadPage(PAGE_NAME.WELCOME)}
        />
      )}
      footer={(
        <PdfReaderFooter onNextSong={nextSong} />
      )}
      skipMainWrapper
    >
      <PDFViewer base64={base64} />
    </PageLayout>
  )
}
