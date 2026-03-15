import IconButton from '../atoms/IconButton'

interface SongViewHeaderProps {
  title: string
  onBack: () => void
}

export default function SongViewHeader({ title, onBack }: SongViewHeaderProps) {
  return (
    <nav>
      <IconButton onClick={onBack} icon="Back" />
      <h1 id="title">{title}</h1>
    </nav>
  )
}
