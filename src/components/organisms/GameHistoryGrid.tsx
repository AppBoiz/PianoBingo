import { PACK_SIZE } from '../../constants/game'

interface GameHistoryGridProps {
  songIds: number[]
  isHighlighted: (songId: number) => boolean
}

export default function GameHistoryGrid({ songIds, isHighlighted }: GameHistoryGridProps) {
  return (
    <div className="box-container">
      {Array.from({ length: PACK_SIZE }, (_, index) => {
        const songId = songIds[index]
        return (
          <div
            key={index + 1}
            className={`box ${isHighlighted(songId) ? 'highlighted' : ''}`}
          >
            {index + 1}
          </div>
        )
      })}
    </div>
  )
}
