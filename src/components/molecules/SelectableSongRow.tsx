import type { MouseEvent } from 'react'
import CheckboxControl from '../atoms/CheckboxControl'

interface SelectableSongRowProps {
  songId: number
  title: string
  position: number | null
  isSelected: boolean
  onToggle: () => void
}

export default function SelectableSongRow({
  songId,
  title,
  position,
  isSelected,
  onToggle,
}: SelectableSongRowProps) {
  function handleRowClick(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).classList.contains('playlist-checkbox')) {
      return
    }

    onToggle()
  }

  return (
    <div
      className={`playlist-row ${isSelected ? '' : 'unchecked'}`}
      data-song-id={songId}
      onClick={handleRowClick}
    >
      <span className="drag-handle">{position ?? '\u00A0'}</span>
      <span className="playlist-name">{title}</span>
      <CheckboxControl
        className="playlist-checkbox"
        checked={isSelected}
        onChange={onToggle}
      />
    </div>
  )
}
