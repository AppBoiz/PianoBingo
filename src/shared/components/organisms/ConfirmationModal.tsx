import { useNavigation } from '../../context/NavigationContext'
import { PAGE_NAME } from '../../constants/navigation'
import { Modal } from './Modal'

interface ConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
}

export function ConfirmationModal({ open, onOpenChange, title }: ConfirmationModalProps) {
  const { loadPage } = useNavigation()

  const endGame = () => {
      onOpenChange(false)
      loadPage(PAGE_NAME.WELCOME)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title}>
      <div className="flex justify-center gap-4">
        <button
          type="button"
          className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-lg bg-brand-pink px-4 py-2 font-medium text-white transition hover:bg-brand-pinkDark"
          onClick={endGame}
        >
          End game
        </button>
      </div>
    </Modal>
  )
}