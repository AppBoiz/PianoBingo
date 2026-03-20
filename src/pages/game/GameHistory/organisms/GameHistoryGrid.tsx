import { PACK_SIZE } from '../../../../shared/constants/game'

interface GameHistoryGridProps {
  songIds: number[]
  isHighlighted: (songId: number) => boolean
}

export default function GameHistoryGrid({ songIds, isHighlighted }: GameHistoryGridProps) {
  return (
    <div className="box-container" data-testid="grid">
      {Array.from({ length: PACK_SIZE }, (_, index) => {
        const songId = songIds[index]
        return (
          <div
            key={index + 1}
            data-testid={`box-${index + 1}`}
            className={`box ${isHighlighted(songId) ? 'highlighted' : ''}`}
          >
            {index + 1}
          </div>
        )
      })}
    </div>
  )
}
