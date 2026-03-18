import type { MouseEvent } from 'react'

interface GameMenuAction {
  id: string
  label: string
  onClick: () => void
  className?: string
}

interface GameMenuProps {
  actions: GameMenuAction[]
}

export default function GameMenu({ actions }: GameMenuProps) {
  function handleActionClick(event: MouseEvent<HTMLAnchorElement>, action: GameMenuAction) {
    event.preventDefault()
    const toggle = document.getElementById('menu-toggle') as HTMLInputElement | null
    if (toggle) toggle.checked = false
    action.onClick()
  }

  return (
    <div className="checkboxNav">
      <div className="checkBoxBox">
        <input type="checkbox" id="menu-toggle" />
        <label className="hamburger" htmlFor="menu-toggle">
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </label>
        <div className="menu">
          {actions.map((action) => (
            <a
              key={action.id}
              href="#"
              className={action.className}
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
