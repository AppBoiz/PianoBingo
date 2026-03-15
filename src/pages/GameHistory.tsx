import React from 'react'
import { useNavigation } from '../context/NavigationContext'
import { useGameHistory } from '../hooks/useGameHistory'
import Header from '../components/Header'
import { PACK_SIZE } from '../constants/game'
import { PAGE_NAME } from '../constants/navigation'

export default function GameHistory(){
  const { pack, hasSongIdBeenShown: isHighlighted } = useGameHistory()
  const { loadPage } = useNavigation()

  return (
    <div className="game-history-root">
      <Header title="Game History" backAction={() => loadPage(PAGE_NAME.GAME)} withContainers={false} />
      {!pack ? (
        <div style={{ textAlign: 'center', marginTop: '40px', color: '#6b7280' }}>
          No active game. Start a game to see history.
        </div>
      ) : (
        <div className="box-container">
          {Array.from({ length: PACK_SIZE }, (_, i) => {
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
