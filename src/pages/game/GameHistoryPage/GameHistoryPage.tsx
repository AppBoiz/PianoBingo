import React from 'react'
import { useNavigation } from '../../../shared/context/NavigationContext'
import { useGameHistory } from '../hooks/useGameHistory'
import GameHistoryGrid from './organisms/GameHistoryGrid'
import PageLayout from '../../../shared/components/organisms/PageLayout'
import { PAGE_NAME } from '../../../shared/constants/navigation'

export default function GameHistoryPage(){
  const { pack, hasSongIdBeenShown: isHighlighted } = useGameHistory()
  const { loadPage } = useNavigation()

  return (
    <PageLayout
      rootClassName="game-history-page-root scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-400/50 overflow-x-hidden overflow-y-auto"
      rootTestId="game-history-page"
      skipMainWrapper
    >
      <div className="back-container flex w-full items-center px-4 py-6 md:px-10 md:py-[30px]" data-testid="header">
        <button
          className="rounded-full px-3 py-2 text-2xl font-bold text-brand-pink transition hover:bg-brand-pink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink/40 md:text-[30px]"
          data-action="back"
          onClick={() => loadPage(PAGE_NAME.GAME)}
        >
          Back
        </button>
      </div>
      <h1 className="text-center text-4xl font-semibold tracking-tight text-black md:text-[45px]">Game History</h1>
      {!pack ? (
        <div className="mt-10 text-center text-lg text-zinc-500" data-testid="empty-state">
          No active game. Start a game to see history.
        </div>
      ) : (
        <GameHistoryGrid songIds={pack.songs} isHighlighted={isHighlighted} />
      )}
    </PageLayout>
  )
}
