import type { ReactNode } from 'react'
import EditableTextInput from '../../../../shared/components/atoms/EditableTextInput'

interface PlaylistRowProps {
  value: string
  onRename: (value: string) => void
  actions: ReactNode
}

export default function PlaylistRow({ value, onRename, actions }: PlaylistRowProps) {
  return (
    <div className="playlist-row">
      <EditableTextInput
        className="playlist-name-input"
        value={value}
        onCommit={onRename}
      />
      <div className="playlist-actions">{actions}</div>
    </div>
  )
}
