import { PACK_SIZE } from '../../../../shared/constants/game'

interface GameHistoryGridProps {
  songIds: number[]
  isHighlighted: (songId: number) => boolean
}

export default function GameHistoryGrid({ songIds, isHighlighted }: GameHistoryGridProps) {
  return (
    <div className="box-container flex flex-wrap items-center justify-evenly gap-5 px-[8vw] py-12 md:px-[10vw] md:py-[60px]" data-testid="grid">
      {Array.from({ length: PACK_SIZE }, (_, index) => {
        const songId = songIds[index]
        return (
          <div
            key={index + 1}
            data-testid={`box-${index + 1}`}
            className={`box flex h-24 w-24 items-center justify-center rounded-[20px] bg-surface-muted text-3xl text-zinc-400 md:h-[120px] md:w-[120px] md:text-[40px] ${isHighlighted(songId) ? 'highlighted border-2 border-black bg-surface-subtle text-zinc-900' : ''}`}
          >
            {index + 1}
          </div>
        )
      })}
    </div>
  )
}
