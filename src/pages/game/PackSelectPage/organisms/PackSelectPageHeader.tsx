interface PackSelectHeaderProps {
  onBack: () => void
}

export default function PackSelectPageHeader({ onBack }: PackSelectHeaderProps) {
  return (
    <div className="back-container relative z-10 flex w-full items-center px-4 py-6 md:px-10 md:py-[30px]" data-testid="header">
      <button
        className="rounded-full px-3 py-2 text-2xl font-bold text-brand-pink transition hover:bg-brand-pink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink/40 md:text-[30px]"
        data-action="back"
        onClick={onBack}
      >
        Back
      </button>
    </div>
  )
}
