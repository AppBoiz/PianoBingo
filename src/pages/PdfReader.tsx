import React, { useEffect, useState } from 'react'
import PDFViewer from '../components/PDFViewer'
import PdfHamburgerMenu from '../components/molecules/PdfHamburgerMenu'
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
    <div className="pdf-page">
      <nav>
        <div style={{width: '121px'}}></div>
        <h1 id="title">
          {songIndex > 0 ? `${songIndex} - ${songTitle}` : songTitle}
        </h1>
        <div style={{width: '121px'}}>
          <PdfHamburgerMenu
            actions={[
              { id: 'next-song', label: 'Next Song', onClick: nextSong },
              { id: 'prev-song', label: 'Previous Song', onClick: prevSong },
              { id: 'game-history', label: 'Game History', onClick: () => loadPage(PAGE_NAME.GAME_HISTORY) },
              { id: 'end-game', label: 'End Game', className: 'red', onClick: () => loadPage(PAGE_NAME.WELCOME) },
            ]}
          />
        </div>
      </nav>
      
      <PDFViewer base64={base64} />
      
      <footer>
        <button onClick={nextSong}>Next Song</button>
      </footer>
    </div>
  )
}
