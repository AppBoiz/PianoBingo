import { clearSongPdf, createNewSong, deleteSong, renameSong, setSongPdf, startNewGame } from '../../../shared/storage/indexedDb'
import { useNavigation } from '../../../shared/context/NavigationContext'
import { useSongs } from '../hooks/useSongs'
import { fileToBase64 } from '../../../shared/utils/fileUtils'
import Header from '../../../shared/components/organisms/Header'
import IconButton from '../../../shared/components/atoms/IconButton'
import PlaylistRow from '../../packs/PackManagement/molecules/PlaylistRow'
import PageLayout from '../../../shared/components/organisms/PageLayout'
import PlaylistContainer from '../../../shared/components/organisms/PlaylistContainer'
import PrimaryActionFooter from '../../../shared/components/organisms/PrimaryActionFooter'
import { PAGE, PAGE_NAME } from '../../../shared/constants/navigation'

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
    loadPage(`${PAGE.SONG_VIEW}/${songId}`)
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

  async function handleClearSongPdf(songId: number) {
    await clearSongPdf(songId)
    await refreshSongs()
  }

  return (
    <PageLayout
      header={<Header title="Manage Songs" backAction={() => { startNewGame(); loadPage(PAGE_NAME.WELCOME) }} />}
      footer={<PrimaryActionFooter label="New Song" onClick={handleCreateNewSong} />}
    >
      <PlaylistContainer>
        {songs.map(song => {
          const hasPdf = !!song.pdfUrl
          return (
            <PlaylistRow
              key={song.songId}
              value={song.title}
              onRename={(newName) => handleRenameSong(song.songId, newName)}
              actions={(
                <>
                  {hasPdf ? (
                    <>
                      <IconButton className="pdf-btn" onClick={() => handleViewSong(song.songId)} icon="📄" label="View" />
                      <IconButton className="remove-pdf-btn" onClick={() => void handleClearSongPdf(song.songId)} icon="❌" label="PDF" />
                    </>
                  ) : (
                    <>
                      <label className="pdf-upload-label" htmlFor={`upload-${song.songId}`}>📤 Upload PDF</label>
                      <input id={`upload-${song.songId}`} type="file" accept="application/pdf" className="pdf-upload" onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) void handleUpload(f, song.songId) }} />
                    </>
                  )}
                  <IconButton className="delete-btn" onClick={() => void handleDeleteSong(song.songId)} icon="🗑️" />
                </>
              )}
            />
          )
        })}
      </PlaylistContainer>
    </PageLayout>
  )
}
