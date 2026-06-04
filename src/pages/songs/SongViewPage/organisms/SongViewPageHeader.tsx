import IconButton from '../../../../shared/components/atoms/IconButton'

interface SongViewHeaderProps {
  onBack: () => void
}

export default function SongViewPageHeader({ onBack }: SongViewHeaderProps) {
  return (
    <nav className="flex w-full items-center justify-start px-4 py-3 md:px-6" data-testid="header">
      <IconButton
        className="rounded-full px-3 py-2 text-2xl font-bold text-brand-pink transition hover:bg-brand-pink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink/40 md:text-[30px]"
        actionId="back"
        onClick={onBack}
        icon="Back"
      />
    </nav>
  )
}
