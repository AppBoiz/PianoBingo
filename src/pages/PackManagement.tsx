import { createNewPack, deletePack, renamePack } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'
import { usePacks } from '../hooks/usePacks'
import Header from '../components/Header'
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
    <div id="app">
      <Header title="Manage Playlists" backAction={() => loadPage(PAGE_NAME.WELCOME)} />

      <div className="main-content">
        <div id="playlist-container" className="playlist-container">
          {packs.map(pack => (
            <div className="playlist-row" key={pack.packId}>
              <input className="playlist-name-input" defaultValue={pack.packName || ''}
                onBlur={(e) => handleRenamePack(pack.packId, e.currentTarget.value)} />
              <div className="playlist-actions">
                <button className="edit-btn" onClick={() => handleEditPack(pack.packId)}>✏️</button>
                <button className="delete-btn" onClick={() => handleDeletePack(pack.packId)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{width:'100%', display:'flex', justifyContent:'center', alignItems:'center', padding: '1rem 0'}}>
          <button className="create-button" onClick={handleCreateNewPack}>Create New</button>
        </div>
      </div>
    </div>
  )
}
