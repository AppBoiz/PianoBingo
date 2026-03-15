import React from 'react'
import { useNavigation } from '../context/NavigationContext'
import { useGameHistory } from '../hooks/useGameHistory'
import Header from '../components/Header'

export default function GameHistory(){
  const { pack, hasSongIdBeenShown: isHighlighted } = useGameHistory()
  const { loadPage } = useNavigation()

  return (
    <div className="game-history-root">
      <Header title="Game History" backAction={() => loadPage('GAME')} withContainers={false} />
      {!pack ? (
        <div style={{ textAlign: 'center', marginTop: '40px', color: '#6b7280' }}>
          No active game. Start a game to see history.
        </div>
      ) : (
        <div className="box-container">
          {Array.from({ length: 75 }, (_, i) => {
            const songId = pack.songs[i]
            return (
              <div
                key={i + 1}
                className={`box ${isHighlighted(songId) ? 'highlighted' : ''}`}
              >
                {i + 1}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
