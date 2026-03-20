interface PackSelectHeaderProps {
  onBack: () => void
}

export default function PackSelectHeader({ onBack }: PackSelectHeaderProps) {
  return (
    <div className="back-container" data-testid="header">
      <button data-action="back" onClick={onBack}>Back</button>
    </div>
  )
}
