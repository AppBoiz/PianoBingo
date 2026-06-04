import GameMenu from '../molecules/GameMenu'

interface GameHeaderProps {
  songIndex: number
  songTitle: string
  onNextSong: () => void
  onPreviousSong: () => void
  canGoPrevious: boolean
  canGoNext: boolean
  onOpenGameHistory: () => void
  onEndGame: () => void
}

export default function GamePageHeader({
  songIndex,
  songTitle,
  onNextSong,
  onPreviousSong,
  canGoPrevious,
  canGoNext,
  onOpenGameHistory,
  onEndGame,
}: GameHeaderProps) {
  return (
    <nav className="flex w-full items-center justify-between gap-4 px-3 py-3 md:px-4" data-testid="header">
      <div className="w-[121px] shrink-0"></div>
      <h1 id="title" className="flex-1 truncate text-center text-xl font-semibold tracking-tight text-black md:text-2xl">
        {songIndex > 0 ? `${songIndex} - ${songTitle}` : songTitle}
      </h1>
      <div className="flex w-[121px] shrink-0 justify-end">
        <GameMenu
          actions={[
            { id: 'next-song', label: 'Next Song', onClick: onNextSong, disabled: !canGoNext },
            { id: 'prev-song', label: 'Previous Song', onClick: onPreviousSong, disabled: !canGoPrevious },
            { id: 'game-history', label: 'Game History', onClick: onOpenGameHistory },
            { id: 'end-game', label: 'End Game', className: 'red', onClick: onEndGame },
          ]}
        />
      </div>
    </nav>
  )
}
