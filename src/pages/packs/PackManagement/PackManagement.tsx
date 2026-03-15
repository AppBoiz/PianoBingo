import { createNewPack, deletePack, renamePack } from '../../../shared/storage/indexedDb'
import { useNavigation } from '../../../shared/context/NavigationContext'
import { usePacks } from '../hooks/usePacks'
import Header from '../../../shared/components/organisms/Header'
import IconButton from '../../../shared/components/atoms/IconButton'
import PlaylistRow from './molecules/PlaylistRow'
import PageLayout from '../../../shared/components/organisms/PageLayout'
import PlaylistContainer from '../../../shared/components/organisms/PlaylistContainer'
import PackManagementFooter from './organisms/PackManagementFooter'
import { PAGE, PAGE_NAME } from '../../../shared/constants/navigation'

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
      footer={<PackManagementFooter onCreateNewPack={handleCreateNewPack} />}
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
    </PageLayout>
  )
}
