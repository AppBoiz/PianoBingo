import type { ReactNode } from 'react'

interface WelcomeAction {
  id: string
  label: string
  onClick: () => void
}

interface WelcomeActionGroupProps {
  logo: ReactNode
  actions: WelcomeAction[]
  banner: ReactNode
}

export default function WelcomeActionGroup({ logo, actions, banner }: WelcomeActionGroupProps) {
  return (
    <>
      <div className="logo-container">{logo}</div>
      {actions.map((action) => (
        <button key={action.id} data-action={action.id} onClick={action.onClick}>{action.label}</button>
      ))}
      {banner}
    </>
  )
}
