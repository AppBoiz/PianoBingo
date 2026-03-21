import React from 'react'
import { useNavigation } from '../../../shared/context/NavigationContext'
import { useGameHistory } from '../hooks/useGameHistory'
import Header from '../../../shared/components/organisms/Header'
import GameHistoryGrid from './organisms/GameHistoryGrid'
import PageLayout from '../../../shared/components/organisms/PageLayout'
import { PAGE_NAME } from '../../../shared/constants/navigation'

export default function GameHistoryPage(){
  const { pack, hasSongIdBeenShown: isHighlighted } = useGameHistory()
  const { loadPage } = useNavigation()

  return (
    <PageLayout
      rootClassName="game-history-root"
      rootTestId="game-history-page"
      header={<Header title="Game History" backAction={() => loadPage(PAGE_NAME.GAME)} withContainers={false} />}
      skipMainWrapper
    >
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
