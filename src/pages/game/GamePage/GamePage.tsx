import React, { useEffect, useState } from 'react'
import PDFViewer from '../../../shared/components/pdf/PDFViewer'
import PageLayout from '../../../shared/components/organisms/PageLayout'
import GamePageHeader from './organisms/GamePageHeader'
import GamePageFooter from './organisms/GamePageFooter'
import { useLoadedSong } from '../hooks/usePdfSong'
import { getCurrentSong, getSelectedSongPackId, getShownSongIds, loadPack, nextSong as loadNextSongFromStorage, prevSong as loadPrevSongFromStorage } from '../../../shared/storage/indexedDb'
import { useNavigation } from '../../../shared/context/NavigationContext'
import { PAGE_NAME } from '../../../shared/constants/navigation'
import { Modal } from '../../../shared/components/organisms/Modal'

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
  const { canGoPrevious, canGoNext } = useGameNavigationAvailability(song)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  return (
    <>
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title="Are you sure you want to end the game?">
        <div className="flex justify-center gap-4">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100"
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-brand-pink px-4 py-2 font-medium text-white transition hover:bg-brand-pinkDark"
            onClick={() => {
              setIsModalOpen(false)
              loadPage(PAGE_NAME.WELCOME)
            }}
          >
            End game
          </button>
        </div>
      </Modal>
      <PageLayout
        rootClassName="game-page-root pdf-page overflow-hidden"
        rootTestId="game-page"
        header={(
          <GamePageHeader
            songIndex={songIndex}
            songTitle={songTitle}
            onNextSong={nextSong}
            onPreviousSong={prevSong}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onOpenGameHistory={() => loadPage(PAGE_NAME.GAME_HISTORY)}
            onEndGame={() => setIsModalOpen(true)}
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
