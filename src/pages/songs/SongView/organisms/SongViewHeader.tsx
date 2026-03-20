import IconButton from '../../../../shared/components/atoms/IconButton'

interface SongViewHeaderProps {
  title: string
  onBack: () => void
}

export default function SongViewHeader({ title, onBack }: SongViewHeaderProps) {
  return (
    <nav data-testid="header">
      <IconButton actionId="back" onClick={onBack} icon="Back" />
      <h1 id="title">{title}</h1>
    </nav>
  )
}
