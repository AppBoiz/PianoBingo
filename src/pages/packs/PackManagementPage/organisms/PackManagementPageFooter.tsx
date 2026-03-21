interface PackManagementFooterProps {
  onCreateNewPack: () => void
}

export default function PackManagementPageFooter({ onCreateNewPack }: PackManagementFooterProps) {
  return (
    <div className="flex w-full items-center justify-center px-4 py-4">
      <button
        className="create-button rounded-lg bg-fuchsia-600 px-5 py-2.5 text-base font-semibold text-white shadow-md transition hover:bg-fuchsia-700"
        data-action="create-pack"
        onClick={onCreateNewPack}
      >
        Create New
      </button>
    </div>
  )
}
