import React from 'react'
import type { Song } from '../../../../shared/types/models'
import SlotCard from '../molecules/SlotCard'

interface PackSlotsProps {
  displaySlots: (Song | null)[]
  onSlotSelect: (slotIndex: number) => void
  onSlotClear: (slotIndex: number) => void
}

export default function PackSlots({
  displaySlots,
  onSlotSelect,
  onSlotClear,
}: PackSlotsProps) {
  return (
    <div className="pack-slots flex flex-col w-full gap-3 items-center max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
      {displaySlots.map((song, index) => (
        <SlotCard
          key={index}
          song={song}
          slotIndex={index}
          onSelectClick={onSlotSelect}
          onClearClick={onSlotClear}
        />
      ))}
    </div>
  )
}
