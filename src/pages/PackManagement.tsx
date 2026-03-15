import { createNewPack, deletePack, renamePack } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'
import { usePacks } from '../hooks/usePacks'
import Header from '../components/Header'
import IconButton from '../components/atoms/IconButton'
import PlaylistRow from '../components/molecules/PlaylistRow'
import PageLayout from '../components/organisms/PageLayout'
import PlaylistContainer from '../components/organisms/PlaylistContainer'
import { PAGE, PAGE_NAME } from '../constants/navigation'

export default function PackManagement(){
  const { packs, refresh: refreshPacks } = usePacks()
  const { loadPage } = useNavigation()

  async function handleCreateNewPack(){
    await createNewPack()
    await refreshPacks()
  }

  async function handleDeletePack(packId: number){
    await deletePack(packId)
    await refreshPacks()
  }

  function handleEditPack(packId: number){
    loadPage(`${PAGE.PACK_EDIT}/${packId}`)
  }

  async function handleRenamePack(packId: number, newName: string){
    await renamePack(packId, newName)
    await refreshPacks()
  }

  return (
    <PageLayout
      header={<Header title="Manage Playlists" backAction={() => loadPage(PAGE_NAME.WELCOME)} />}
    >
      <PlaylistContainer containerId="playlist-container">
        {packs.map(pack => (
          <PlaylistRow
            key={pack.packId}
            value={pack.packName || ''}
            onRename={(newName) => handleRenamePack(pack.packId, newName)}
            actions={(
              <>
                <IconButton className="edit-btn" onClick={() => handleEditPack(pack.packId)} icon="✏️" />
                <IconButton className="delete-btn" onClick={() => handleDeletePack(pack.packId)} icon="🗑️" />
              </>
            )}
          />
        ))}
      </PlaylistContainer>
      <div style={{width:'100%', display:'flex', justifyContent:'center', alignItems:'center', padding: '1rem 0'}}>
        <button className="create-button" onClick={handleCreateNewPack}>Create New</button>
      </div>
    </PageLayout>
  )
}
