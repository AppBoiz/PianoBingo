import React, { useEffect, useState } from 'react'
import { loadAllPacks, savePack, deletePack, loadPack, selectPack } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'

export default function PackManagement(){
  const [packs, setPacks] = useState<any[]>([])
  const { loadPage } = useNavigation()

  useEffect(() => { fetchPacks() }, [])

  async function fetchPacks(){
    const data = await loadAllPacks()
    setPacks(data || [])
  }

  async function handleCreateNewPack(){
    const packData = await loadAllPacks()
    const maxPackId = packData.length ? Math.max(...packData.map((p:any) => p.packId)) : 0
    const newPack = {
      packId: Math.max(maxPackId + 1, (window as any).INDEXED_BD_CONFIG?.PARTITION_SIZE || 1000000),
      packName: 'New Pack',
      songs: []
    }
    await savePack(newPack)
    await fetchPacks()
  }

  async function handleDeletePack(idToRemove:number){
    await deletePack(idToRemove)
    await fetchPacks()
  }

  function handleEditPack(packId:number){
    selectPack(packId)
    loadPage('PACK_EDIT')
  }

  async function handleRenamePack(packId:number, newName:string){
    const pack = await loadPack(packId)
    if (!pack) return
    pack.packName = newName.trim() || 'Untitled Pack'
    await savePack(pack)
    await fetchPacks()
  }

  return (
    <div id="app">
      <div className="nav-bar">
        <div className="back-container nav-bar-left">
          <button onClick={() => loadPage('WELCOME')}>Back</button>
        </div>
        <h1>Manage Playlists</h1>
      </div>
      <div className="main-content">
        <div id="playlist-container" className="playlist-container">
          {packs.map(pack => (
            <div className="playlist-row" key={pack.packId}>
              <input className="playlist-name-input" value={pack.packName || ''}
                onChange={() => {}}
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
