import React from 'react'
import { INDEXED_BD_CONFIG, savePack, deletePack, loadPack, selectPack } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'
import { usePacks } from '../hooks/usePacks'
import Header from '../components/Header'
import type { Pack } from '../types/models'

export default function PackManagement(){
  const { packs, refresh: refreshPacks } = usePacks()
  const { loadPage } = useNavigation()

  async function handleCreateNewPack(){
    const maxPackId = packs.length ? Math.max(...packs.map(p => p.packId)) : 0
    const newPack: Pack = {
      packId: Math.max(maxPackId + 1, INDEXED_BD_CONFIG.PARTITION_SIZE),
      packName: 'New Pack',
      songCount: 0,
      songs: []
    }
    await savePack(newPack)
    await refreshPacks()
  }

  async function handleDeletePack(packId: number){
    await deletePack(packId)
    await refreshPacks()
  }

  function handleEditPack(packId: number){
    selectPack(packId)
    loadPage('PACK_EDIT')
  }

  async function handleRenamePack(packId: number, newName: string){
    const pack = await loadPack(packId)
    if (!pack) return
    pack.packName = newName.trim() || 'Untitled Pack'
    await savePack(pack)
    await refreshPacks()
  }

  return (
    <div id="app">
      <Header title="Manage Playlists" backAction={() => loadPage('WELCOME')} />

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
