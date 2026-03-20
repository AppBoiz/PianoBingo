interface PackManagementFooterProps {
  onCreateNewPack: () => void
}

export default function PackManagementFooter({ onCreateNewPack }: PackManagementFooterProps) {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem 0' }}>
      <button className="create-button" data-action="create-pack" onClick={onCreateNewPack}>Create New</button>
    </div>
  )
}
