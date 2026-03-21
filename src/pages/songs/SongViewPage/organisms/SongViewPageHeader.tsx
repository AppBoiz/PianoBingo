import IconButton from '../../../../shared/components/atoms/IconButton'

interface SongViewHeaderProps {
  onBack: () => void
}

export default function SongViewPageHeader({ onBack }: SongViewHeaderProps) {
  return (
    <nav data-testid="header">
      <IconButton actionId="back" onClick={onBack} icon="Back" />
    </nav>
  )
}
