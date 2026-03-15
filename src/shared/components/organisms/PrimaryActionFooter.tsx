interface PrimaryActionFooterProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

export default function PrimaryActionFooter({ label, onClick, disabled = false }: PrimaryActionFooterProps) {
  return (
    <div className="footer">
      <button className="primary-btn" disabled={disabled} onClick={onClick}>
        {label}
      </button>
    </div>
  )
}
