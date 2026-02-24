import React, { useEffect, useState } from 'react'
import PDFViewer from '../components/PDFViewer'
import { getCurrentSong, getSelectedSongPackId, loadPack, nextSong as storageNextSong, prevSong as storagePrevSong } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'

export default function PdfReader(){
  const [base64, setBase64] = useState<string | null>(null)
  const [songTitle, setSongTitle] = useState<string>('')
  const [songIndex, setSongIndex] = useState<number>(0)
  const { loadPage } = useNavigation()

  useEffect(() => {
    loadSongData()
  }, [])

  async function loadSongData() {
    const song = getCurrentSong()
    if (!song || !song.pdfUrl) {
      setBase64(null)
      return
    }
    
    setBase64(song.pdfUrl)
    setSongTitle(song.title || 'Untitled')
    
    // Get pack index for this song
    const selectedPackId = getSelectedSongPackId()
    if (selectedPackId) {
      const packData = await loadPack(selectedPackId)
      if (packData) {
        const index = packData.songs.findIndex(id => id === song.songId)
        setSongIndex(index !== -1 ? index + 1 : 0)
      }
    }
  }

  async function nextSong(){
    await storageNextSong?.()
    await loadSongData()
  }

  async function prevSong(){
    await storagePrevSong?.()
    await loadSongData()
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
