interface PackSelectHeaderProps {
  onBack: () => void
}

export default function PackSelectHeader({ onBack }: PackSelectHeaderProps) {
  return (
    <div className="back-container">
      <button onClick={onBack}>Back</button>
    </div>
  )
}
