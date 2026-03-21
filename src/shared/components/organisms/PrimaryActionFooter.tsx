interface PrimaryActionFooterProps {
  label: string
  onClick: () => void
  disabled?: boolean
  actionId?: string
}

export default function PrimaryActionFooter({ label, onClick, disabled = false, actionId }: PrimaryActionFooterProps) {
  return (
    <div className="footer sticky bottom-0 flex w-full justify-center border-t border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur" data-testid="footer">
      <button
        className="primary-btn rounded-xl bg-brand-pink px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-brand-pinkDark active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-brand-pinkSoft disabled:opacity-70"
        data-action={actionId}
        data-testid="primary-action"
        disabled={disabled}
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  )
}
