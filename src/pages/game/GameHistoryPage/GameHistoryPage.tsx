import React from 'react'
import { useNavigation } from '../../../shared/context/NavigationContext'
import { useGameHistory } from '../hooks/useGameHistory'
import GameHistoryGrid from './organisms/GameHistoryGrid'
import PageLayout from '../../../shared/components/organisms/PageLayout'
import { PAGE_NAME } from '../../../shared/constants/navigation'
import '../../../styles/legacy/game-history.css'

export default function GameHistoryPage(){
  const { pack, hasSongIdBeenShown: isHighlighted } = useGameHistory()
  const { loadPage } = useNavigation()

  return (
    <PageLayout
      rootClassName="game-history-page-root"
      rootTestId="game-history-page"
      skipMainWrapper
    >
      <div className="back-container" data-testid="header">
        <button data-action="back" onClick={() => loadPage(PAGE_NAME.GAME)}>Back</button>
      </div>
      <h1>Game History</h1>
      {!pack ? (
        <div data-testid="empty-state" style={{ textAlign: 'center', marginTop: '40px', color: '#6b7280' }}>
          No active game. Start a game to see history.
        </div>
      ) : (
        <GameHistoryGrid songIds={pack.songs} isHighlighted={isHighlighted} />
      )}
    </PageLayout>
  )
}
