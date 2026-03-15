import React, { useEffect, useState } from 'react'
import PDFViewer from '../components/PDFViewer'
import { usePdfSong } from '../hooks/usePdfSong'
import { getCurrentSong, getSelectedSongPackId, loadPack, nextSong as storageNextSong, prevSong as storagePrevSong } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'

export default function PdfReader(){
  const [songIndex, setSongIndex] = useState<number>(0)
  const { loadPage } = useNavigation()
  const { song, base64, songTitle, reload } = usePdfSong(async () => getCurrentSong(), [])

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

  async function nextSong(){
    await storageNextSong?.()
    await reload()
  }

  async function prevSong(){
    await storagePrevSong?.()
    await reload()
  }

  return (
    <div className="pdf-page">
      <nav>
        <div style={{width: '121px'}}></div>
        <h1 id="title">
          {songIndex > 0 ? `${songIndex} - ${songTitle}` : songTitle}
        </h1>
        <div style={{width: '121px'}}>
          <div className="checkboxNav">
            <div className="checkBoxBox">
              <input type="checkbox" id="menu-toggle" />
              <label className="hamburger" htmlFor="menu-toggle">
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
              </label>
              <div className="menu">
                <a href="#" onClick={(e) => { e.preventDefault(); nextSong(); }}>Next Song</a>
                <a href="#" onClick={(e) => { e.preventDefault(); prevSong(); }}>Previous Song</a>
                <a href="#" onClick={(e) => { e.preventDefault(); loadPage('GAME_HISTORY'); }}>Game History</a>
                <a href="#" className="red" onClick={(e) => { e.preventDefault(); loadPage('WELCOME'); }}>End Game</a>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <PDFViewer base64={base64} />
      
      <footer>
        <button onClick={nextSong}>Next Song</button>
      </footer>
    </div>
  )
}
