import type { ReactNode } from 'react'
import EditableTextInput from '../../../../shared/components/atoms/EditableTextInput'

interface PlaylistRowProps {
  value: string
  onRename: (value: string) => void
  actions: ReactNode
  rowTestId?: string
}

export default function PlaylistRow({ value, onRename, actions, rowTestId }: PlaylistRowProps) {
  return (
    <div className="playlist-row" data-testid={rowTestId}>
      <EditableTextInput
        className="playlist-name-input"
        value={value}
        onCommit={onRename}
      />
      <div className="playlist-actions">{actions}</div>
    </div>
  )
}
