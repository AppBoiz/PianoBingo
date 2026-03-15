import React from 'react'
import { useNavigation } from '../context/NavigationContext'
import { useGameHistory } from '../hooks/useGameHistory'
import Header from '../components/Header'

export default function GameHistory(){
  const { pack, shownSongIds } = useGameHistory()
  const { loadPage } = useNavigation()

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
