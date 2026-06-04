import { clearSongPdf, createNewSong, deleteSong, renameSong, setSongPdf, startNewGame } from '../../../shared/storage/indexedDb'
import { useNavigation } from '../../../shared/context/NavigationContext'
import { useSongs } from '../hooks/useSongs'
import { fileToBase64 } from '../../../shared/utils/fileUtils'
import Header from '../../../shared/components/organisms/Header'
import IconButton from '../../../shared/components/atoms/IconButton'
import PlaylistRow from '../../packs/PackManagementPage/molecules/PlaylistRow'
import PageLayout from '../../../shared/components/organisms/PageLayout'
import PlaylistContainer from '../../../shared/components/organisms/PlaylistContainer'
import PrimaryActionFooter from '../../../shared/components/organisms/PrimaryActionFooter'
import { PAGE, PAGE_NAME } from '../../../shared/constants/navigation'

export default function SongManagementPage(){
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
      rootClassName="song-management-page-root text-center"
      rootTestId="song-management-page"
      header={<Header title="Manage Songs" backAction={() => { startNewGame(); loadPage(PAGE_NAME.WELCOME) }} />}
      footer={<PrimaryActionFooter label="New Song" actionId="create-song" onClick={handleCreateNewSong} />}
    >
      <PlaylistContainer className="my-4 w-full px-4 pb-6 md:px-6">
        {songs.map(song => {
          const hasPdf = !!song.pdfUrl
          return (
            <PlaylistRow
              key={song.songId}
              value={song.title}
              rowTestId={`row-${song.songId}`}
              rowClassName="w-full max-w-[600px] self-center"
              onRename={(newName) => handleRenameSong(song.songId, newName)}
              actions={(
                <>
                  {hasPdf ? (
                    <>
                      <IconButton className="pdf-btn rounded-lg bg-brand-pink px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-pinkDark" actionId={`view-song-${song.songId}`} onClick={() => handleViewSong(song.songId)} icon="📄" label="View" />
                      <IconButton className="remove-pdf-btn rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600" actionId={`remove-pdf-${song.songId}`} onClick={() => void handleClearSongPdf(song.songId)} icon="❌" label="PDF" />
                    </>
                  ) : (
                    <>
                      <label data-testid={`upload-pdf-label-${song.songId}`} className="pdf-upload-label cursor-pointer rounded-lg bg-fuchsia-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-fuchsia-700" htmlFor={`upload-${song.songId}`}>📤 Upload PDF</label>
                      <input data-testid={`pdf-input-${song.songId}`} id={`upload-${song.songId}`} type="file" accept="application/pdf" className="pdf-upload hidden" onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) void handleUpload(f, song.songId) }} />
                    </>
                  )}
                  <IconButton className="delete-btn rounded-md bg-rose-500 px-2.5 py-1.5 text-base text-white shadow-sm transition hover:bg-rose-600" actionId={`delete-song-${song.songId}`} onClick={() => void handleDeleteSong(song.songId)} icon="🗑️" />
                </>
              )}
            />
          )
        })}
      </PlaylistContainer>
    </PageLayout>
  )
}
