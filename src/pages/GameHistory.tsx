import React from 'react'
import { useNavigation } from '../context/NavigationContext'
import { useGameHistory } from '../hooks/useGameHistory'
import Header from '../components/Header'
import GameHistoryGrid from '../components/organisms/GameHistoryGrid'
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
        <GameHistoryGrid songIds={pack.songs} isHighlighted={isHighlighted} />
      )}
    </div>
  )
}
