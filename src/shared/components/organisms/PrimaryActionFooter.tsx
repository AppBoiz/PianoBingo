interface PrimaryActionFooterProps {
  label: string
  onClick: () => void
  disabled?: boolean
  actionId?: string
}

export default function PrimaryActionFooter({ label, onClick, disabled = false, actionId }: PrimaryActionFooterProps) {
  return (
    <div className="footer">
      <button className="primary-btn" data-action={actionId} data-testid="primary-action" disabled={disabled} onClick={onClick}>
        {label}
      </button>
    </div>
  )
}
