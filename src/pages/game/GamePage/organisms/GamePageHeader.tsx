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
    <nav data-testid="header">
      <div style={{ width: '121px' }}></div>
      <h1 id="title">
        {songIndex > 0 ? `${songIndex} - ${songTitle}` : songTitle}
      </h1>
      <div style={{ width: '121px' }}>
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
