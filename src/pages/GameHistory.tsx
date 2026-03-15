import React, { useEffect, useState } from 'react'
import { loadGameState, loadPack } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'
import Header from '../components/Header'
import type { Pack } from '../types/models'

export default function GameHistory(){
  const [pack, setPack] = useState<Pack | null>(null)
  const [shownSongIds, setShownSongIds] = useState<number[]>([])
  const { loadPage } = useNavigation()

  useEffect(() => { 
    fetchGameData() 
  }, [])

  async function fetchGameData(){
    const state = loadGameState()
    if (!state || !state.selectedSongPackId) {
      return
    }
    
    const packData = await loadPack(state.selectedSongPackId)
    if (packData) {
      setPack(packData)
      setShownSongIds(state.shownSongIds || [])
    }
  }

  function renderBoxes(){
    if (!pack) return null
    
    const boxes = []
    for (let i = 1; i <= 75; i++) {
      const songId = pack.songs[i - 1]
      const isHighlighted = shownSongIds.includes(songId)
      
      boxes.push(
        <div 
          key={i} 
          className={`box ${isHighlighted ? 'highlighted' : ''}`}
        >
          {i}
        </div>
      )
    }
    return boxes
  }

  return (
    <div className="game-history-root">
      <Header title="Game History" backAction={() => loadPage('GAME')} withContainers={false} />
      <h1 style={{ textAlign: 'center', marginTop: '20px' }}>Game History</h1>
      {!pack ? (
        <div style={{ textAlign: 'center', marginTop: '40px', color: '#6b7280' }}>
          No active game. Start a game to see history.
        </div>
      ) : (
        <div className="box-container">
          {renderBoxes()}
        </div>
      )}
    </div>
  )
}
