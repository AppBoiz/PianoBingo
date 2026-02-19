import React, { useEffect, useState } from 'react'
import PDFViewer from '../components/PDFViewer'
import { getCurrentSong, getShownSongIds, nextSong as storageNextSong, prevSong as storagePrevSong } from '../storage/indexedDb'

export default function PdfReader(){
  const [base64, setBase64] = useState<string | null>(null)
  const [songId, setSongId] = useState<number | null>(null)

  useEffect(() => {
    const song = getCurrentSong();
    if (song && song.pdfUrl) {
      setBase64(song.pdfUrl);
      setSongId(song.songId || null);
    } else {
      setBase64(null);
      setSongId(null);
    }
  }, [])

  async function nextSong(){
    // generateSong is in storage but nextSong flow needs to replicate; here we'll call generateSong via setSongId if available
    // For now reload state by reading currentSong after user triggers navigation
    await storageNextSong?.();
    const song = getCurrentSong();
    if (song) setBase64(song.pdfUrl);
  }

  async function prevSong(){
    await storagePrevSong?.();
    const song = getCurrentSong();
    if (song) setBase64(song.pdfUrl);
  }

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <button onClick={prevSong}>Prev Song</button>
        <h2>PDF Reader</h2>
        <button onClick={nextSong}>Next Song</button>
      </div>
      <PDFViewer base64={base64} />
    </div>
  )
}
