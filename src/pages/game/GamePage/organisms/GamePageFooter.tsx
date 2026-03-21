interface GameFooterProps {
  onNextSong: () => void
}

export default function GamePageFooter({ onNextSong }: GameFooterProps) {
  return (
    <footer data-testid="footer">
      <button data-action="next-song" onClick={onNextSong}>Next Song</button>
    </footer>
  )
}
