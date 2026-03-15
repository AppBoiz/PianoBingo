import { clearSongPdf, createNewSong, deleteSong, renameSong, setSongPdf, startNewGame } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'
import { useSongs } from '../hooks/useSongs'
import { fileToBase64 } from '../utils/fileUtils'
import Header from '../components/Header'
import { PAGE, PAGE_NAME } from '../constants/navigation'

export default function SongManagement(){
  const { songs, refresh: refreshSongs } = useSongs()
  const { loadPage } = useNavigation()

  async function handleRenameSong(songId: number, newName: string){
    await renameSong(songId, newName)
    await refreshSongs()
  }

  async function handleCreateNewSong(){
    await createNewSong()
    await refreshSongs()
  }

  function handleViewSong(songId: number){
    loadPage(`${PAGE.SONG_VIEW}?songId=${songId}`)
  }

  async function handleDeleteSong(songId: number){
    await deleteSong(songId)
    await refreshSongs()
  }

  async function handleUpload(file: File, songId: number){
    const pdfDataUrl = await fileToBase64(file)
    await setSongPdf(songId, pdfDataUrl)
    await refreshSongs()
  }

  return (
    <div id="app">
      <Header title="Manage Songs" backAction={() => { startNewGame(); loadPage(PAGE_NAME.WELCOME) }} />

      <div className="main-content">
        <div className="playlist-container">
          {songs.map(song => {
            const hasPdf = !!song.pdfUrl
            return (
              <div className="playlist-row" key={song.songId}>
                <input className="playlist-name-input" defaultValue={song.title} onBlur={(e) => handleRenameSong(song.songId, e.currentTarget.value)} />
                <div className="playlist-actions">
                  {hasPdf ? (
                    <>
                      <button className="pdf-btn" onClick={() => handleViewSong(song.songId)}>📄 View</button>
                      <button className="remove-pdf-btn" onClick={async () => { await clearSongPdf(song.songId); await refreshSongs() }}>❌ PDF</button>
                    </>
                  ) : (
                    <>
                      <label className="pdf-upload-label" htmlFor={`upload-${song.songId}`}>📤 Upload PDF</label>
                      <input id={`upload-${song.songId}`} type="file" accept="application/pdf" className="pdf-upload" onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) handleUpload(f, song.songId) }} />
                    </>
                  )}
                  <button className="delete-btn" onClick={() => handleDeleteSong(song.songId)}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="footer">
        <button className="primary-btn" onClick={handleCreateNewSong}>New Song</button>
      </div>
    </div>
  )
}
