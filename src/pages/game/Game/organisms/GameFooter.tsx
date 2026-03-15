interface GameFooterProps {
  onNextSong: () => void
}

export default function GameFooter({ onNextSong }: GameFooterProps) {
  return (
    <footer>
      <button onClick={onNextSong}>Next Song</button>
    </footer>
  )
}
