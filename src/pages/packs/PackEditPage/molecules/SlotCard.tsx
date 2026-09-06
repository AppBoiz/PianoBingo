import React from 'react'
import type { Song } from '../../../../shared/types/models'

interface SlotCardProps {
  song: Song | null
  slotIndex: number
  onSelectClick: (slotIndex: number) => void
  onClearClick: (slotIndex: number) => void
}

export default function SlotCard({
  song,
  slotIndex,
  onSelectClick,
  onClearClick,
}: SlotCardProps) {
  const position = slotIndex + 1

  if (!song) {
    return (
      <div
        className="slot-card-empty flex w-full max-w-[600px] self-center items-center gap-3 rounded-xl bg-gray-50 px-4 py-4 text-left cursor-pointer border-2 border-dashed border-gray-300 hover:border-brand-pink hover:bg-gray-100 transition"
        data-testid={`slot-${slotIndex}`}
        onClick={() => onSelectClick(slotIndex)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelectClick(slotIndex)
          }
        }}
      >
        <span className="inline-block w-[30px] shrink-0 text-center text-base font-bold text-gray-400">
          {position}
        </span>
        <span className="flex-1 text-base font-medium text-gray-400">
          Click to select a song
        </span>
      </div>
    )
  }

  return (
    <div
      className="slot-card-filled flex w-full max-w-[600px] self-center items-center gap-3 rounded-xl bg-white px-4 py-4 text-left shadow-[0_1px_4px_rgba(0,0,0,0.1)] text-zinc-800 transition"
      data-testid={`slot-${slotIndex}`}
      data-song-id={song.songId}
    >
      <span className="inline-block w-[30px] shrink-0 text-center text-base font-bold text-brand-pink">
        {position}
      </span>
      <span className="playlist-name flex-1 text-base font-medium" data-testid={`slot-name-${slotIndex}`}>
        {song.title}
      </span>
      <button
        type="button"
        className="clear-button ml-2 h-[24px] w-[24px] flex items-center justify-center rounded-md hover:bg-gray-100 transition text-zinc-600 hover:text-brand-pink"
        aria-label={`Remove song from slot ${position}`}
        data-testid={`slot-clear-${slotIndex}`}
        onClick={(e) => {
          e.stopPropagation()
          onClearClick(slotIndex)
        }}
      >
        ✕
      </button>
    </div>
  )
}
