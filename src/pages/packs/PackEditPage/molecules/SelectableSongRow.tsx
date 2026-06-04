import type { MouseEvent } from 'react'
import CheckboxControl from '../../../../shared/components/atoms/CheckboxControl'

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
      className={`playlist-row flex w-full max-w-[600px] self-center items-center gap-3 rounded-xl bg-white px-4 py-4 text-left shadow-[0_1px_4px_rgba(0,0,0,0.1)] transition ${isSelected ? 'text-zinc-800' : 'unchecked text-zinc-400 opacity-50'}`}
      data-testid={`row-${songId}`}
      data-song-id={songId}
      onClick={handleRowClick}
    >
      <span className={`drag-handle inline-block w-[30px] shrink-0 text-center text-base font-bold ${isSelected ? 'text-brand-pink' : 'text-zinc-400'}`} data-testid="handle">{position ?? '\u00A0'}</span>
      <span className="playlist-name flex-1 text-base font-medium" data-testid="name">{title}</span>
      <CheckboxControl
        className="playlist-checkbox relative h-[22px] w-[22px] cursor-pointer appearance-none rounded-md border-2 border-brand-pink transition checked:bg-brand-pink checked:after:absolute checked:after:left-[3px] checked:after:top-[-1px] checked:after:text-base checked:after:font-bold checked:after:text-white checked:after:content-['✓']"
        data-testid="checkbox"
        checked={isSelected}
        onChange={onToggle}
      />
    </div>
  )
}
