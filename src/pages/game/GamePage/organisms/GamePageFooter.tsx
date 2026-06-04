interface GameFooterProps {
  onNextSong: () => void
  disabled?: boolean
}

export default function GamePageFooter({ onNextSong, disabled = false }: GameFooterProps) {
  return (
    <footer className="flex w-full items-center justify-center px-4 pb-4 pt-2" data-testid="footer">
      <button
        className="rounded-xl bg-brand-pink px-8 py-3 text-base font-bold text-white shadow-md transition hover:bg-brand-pinkDark disabled:cursor-not-allowed disabled:bg-brand-pinkSoft disabled:opacity-70"
        data-action="next-song"
        disabled={disabled}
        onClick={onNextSong}
      >
        Next Song
      </button>
    </footer>
  )
}
