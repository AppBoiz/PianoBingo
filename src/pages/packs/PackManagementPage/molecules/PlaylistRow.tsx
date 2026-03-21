import type { ReactNode } from 'react'
import EditableTextInput from '../../../../shared/components/atoms/EditableTextInput'

interface PlaylistRowProps {
  value: string
  onRename: (value: string) => void
  actions: ReactNode
  rowTestId?: string
  rowClassName?: string
}

export default function PlaylistRow({ value, onRename, actions, rowTestId, rowClassName }: PlaylistRowProps) {
  const classes = [
    'playlist-row flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.1)]',
    rowClassName,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} data-testid={rowTestId}>
      <EditableTextInput
        className="playlist-name-input flex-1 border-none bg-transparent px-2 py-1 text-base text-zinc-800 outline-none transition focus:bg-zinc-50 focus-visible:border-b focus-visible:border-zinc-400"
        value={value}
        onCommit={onRename}
      />
      <div className="playlist-actions flex shrink-0 items-center gap-2">{actions}</div>
    </div>
  )
}
