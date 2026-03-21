interface GameFooterProps {
  onNextSong: () => void
  disabled?: boolean
}

export default function GamePageFooter({ onNextSong, disabled = false }: GameFooterProps) {
  return (
    <footer data-testid="footer">
      <button data-action="next-song" disabled={disabled} onClick={onNextSong}>Next Song</button>
    </footer>
  )
}
