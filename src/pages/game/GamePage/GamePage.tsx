import React, { useEffect, useState } from 'react'
import PDFViewer from '../../../shared/components/pdf/PDFViewer'
import PageLayout from '../../../shared/components/organisms/PageLayout'
import { ConfirmationModal } from '../../../shared/components/organisms/ConfirmationModal'
import GamePageHeader from './organisms/GamePageHeader'
import GamePageFooter from './organisms/GamePageFooter'
import { useLoadedSong } from '../hooks/usePdfSong'
import { getCurrentSong, getSelectedSongPackId, getShownSongIds, loadPack, nextSong as loadNextSongFromStorage, prevSong as loadPrevSongFromStorage } from '../../../shared/storage/indexedDb'
import { useNavigation } from '../../../shared/context/NavigationContext'
import { PAGE_NAME } from '../../../shared/constants/navigation'

function useCurrentSongPositionInSelectedPack(song: { songId: number; pdfUrl: string | null } | null | undefined) {
  const [songIndex, setSongIndex] = useState<number>(0);

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

function useGameNavigationAvailability(song: { songId: number } | null | undefined) {
  const [availability, setAvailability] = useState({ canGoPrevious: false, canGoNext: false })

  useEffect(() => {
    let cancelled = false

    const loadAvailability = async () => {
      if (!song) {
        setAvailability({ canGoPrevious: false, canGoNext: false })
        return
      }

      const shownSongIds = getShownSongIds()
      const currentIndex = shownSongIds.findIndex(id => id === song.songId)
      const selectedPackId = getSelectedSongPackId()

      if (!selectedPackId) {
        setAvailability({ canGoPrevious: currentIndex > 0, canGoNext: false })
        return
      }

      const packData = await loadPack(selectedPackId)
      if (cancelled) {
        return
      }

      const packSongIds = packData?.songs ?? []
      const hasNextInHistory = currentIndex !== -1 && currentIndex < shownSongIds.length - 1
      const hasUnseenSongRemaining = packSongIds.some(id => !shownSongIds.includes(id))

      setAvailability({
        canGoPrevious: currentIndex > 0,
        canGoNext: hasNextInHistory || hasUnseenSongRemaining,
      })
    }

    void loadAvailability()

    return () => {
      cancelled = true
    }
  }, [song])

  return availability
}

export default function GamePage(){
  const { loadPage } = useNavigation()
  const { song, base64, songTitle, nextSong, prevSong } = useLoadedSong(getCurrentSong, [], {
    loadNextSong: loadNextSongFromStorage,
    loadPrevSong: loadPrevSongFromStorage,
  })
  const songIndex = useCurrentSongPositionInSelectedPack(song)
  const playedSongs = getShownSongIds().length
  const { canGoPrevious, canGoNext } = useGameNavigationAvailability(song)
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false)

  return (
    <>
      <ConfirmationModal
        open={isConfirmationModalOpen}
        onOpenChange={setIsConfirmationModalOpen}
        title="Are you sure you want to end the game?"
      />
      <PageLayout
        rootClassName="game-page-root pdf-page overflow-hidden"
        rootTestId="game-page"
        header={(
          <GamePageHeader
            songIndex={songIndex}
            playedSongs={playedSongs}
            songTitle={songTitle}
            onNextSong={nextSong}
            onPreviousSong={prevSong}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onOpenGameHistory={() => loadPage(PAGE_NAME.GAME_HISTORY)}
            onEndGame={() => setIsConfirmationModalOpen(true)}
            />
          )}
          footer={(
            <GamePageFooter onNextSong={nextSong} disabled={!canGoNext} />
          )}
          skipMainWrapper
          >
        <PDFViewer base64={base64} scaleMode="fit-contain" />
      </PageLayout>
    </>
  )
}
