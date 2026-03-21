import type { MouseEvent } from 'react'

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
  function handleActionClick(event: MouseEvent<HTMLAnchorElement>, action: GameMenuAction) {
    event.preventDefault()
    if (action.disabled) {
      return
    }

    const toggle = document.getElementById('menu-toggle') as HTMLInputElement | null
    if (toggle) toggle.checked = false
    action.onClick()
  }

  return (
    <div className="checkboxNav" data-testid="menu-wrapper">
      <div className="checkBoxBox">
        <input type="checkbox" id="menu-toggle" data-testid="menu-toggle-checkbox" />
        <label className="hamburger" htmlFor="menu-toggle" data-testid="menu-toggle">
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </label>
        <div className="menu" data-testid="menu">
          {actions.map((action) => (
            <a
              key={action.id}
              href="#"
              className={action.disabled ? `${action.className ?? ''} disabled`.trim() : action.className}
              data-action={action.id}
              aria-disabled={action.disabled ? 'true' : undefined}
              tabIndex={action.disabled ? -1 : undefined}
              onClick={(event) => handleActionClick(event, action)}
            >
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
