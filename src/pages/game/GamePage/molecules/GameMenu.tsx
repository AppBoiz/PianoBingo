import { useState, type ChangeEvent, type MouseEvent } from 'react'

interface GameMenuAction {
  id: string
  label: string
  onClick: () => void
  className?: string
  disabled?: boolean
}

interface GameMenuProps {
  actions: GameMenuAction[]
}

export default function GameMenu({ actions }: GameMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  function handleActionClick(event: MouseEvent<HTMLButtonElement>, action: GameMenuAction) {
    event.preventDefault()
    if (action.disabled) {
      return
    }

    setIsOpen(false)
    action.onClick()
  }

  function handleToggleChange(event: ChangeEvent<HTMLInputElement>) {
    setIsOpen(event.currentTarget.checked)
  }

  return (
    <div className="checkboxNav relative flex justify-center p-4" data-testid="menu-wrapper">
      <div className="checkBoxBox relative flex h-[35px] w-[35px] items-center justify-center rounded-md bg-brand-pink">
        <input
          type="checkbox"
          id="menu-toggle"
          data-testid="menu-toggle-checkbox"
          className="sr-only"
          checked={isOpen}
          onChange={handleToggleChange}
        />
        <label
          className="hamburger flex cursor-pointer flex-col gap-[5px]"
          htmlFor="menu-toggle"
          data-testid="menu-toggle"
        >
          <span className={`bar block h-[3px] w-6 bg-white transition ${isOpen ? 'translate-y-2 rotate-45' : ''}`}></span>
          <span className={`bar block h-[3px] w-6 bg-white transition ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`bar block h-[3px] w-6 bg-white transition ${isOpen ? '-translate-y-2 -rotate-45' : ''}`}></span>
        </label>
        <div
          className={`menu absolute right-0 top-full z-[100] mt-2 w-52 rounded-xl bg-zinc-50 py-2 shadow-[0_8px_12px_rgba(0,0,0,0.3)] transition-all duration-300 ${isOpen ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-2 opacity-0 pointer-events-none'}`}
          data-testid="menu"
        >
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={[
                'block w-full px-4 py-3 text-left text-zinc-600 transition hover:bg-zinc-100',
                action.className === 'red' ? 'text-[#E96262]' : '',
                action.disabled ? 'cursor-not-allowed text-zinc-400 hover:bg-transparent' : '',
              ].filter(Boolean).join(' ')}
              data-action={action.id}
              aria-disabled={action.disabled ? 'true' : undefined}
              disabled={action.disabled}
              onClick={(event) => handleActionClick(event, action)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
