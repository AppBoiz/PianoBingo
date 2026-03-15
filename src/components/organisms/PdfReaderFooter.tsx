interface PdfReaderFooterProps {
  onNextSong: () => void
}

export default function PdfReaderFooter({ onNextSong }: PdfReaderFooterProps) {
  return (
    <footer>
      <button onClick={onNextSong}>Next Song</button>
    </footer>
  )
}
