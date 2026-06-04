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
      <div className="logo-container relative z-10 px-0 pb-12 pt-[clamp(48px,7vh,80px)]">{logo}</div>
      {actions.map((action) => (
        <button
          key={action.id}
          className="relative z-10 mb-6 h-20 w-full max-w-[315px] rounded-[20px] bg-brand-pink text-[clamp(1.35rem,2vw,1.875rem)] font-semibold text-white shadow-lg transition hover:bg-brand-pinkDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink/40 md:mb-10 md:h-[84px]"
          data-action={action.id}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ))}
      {banner}
    </>
  )
}
