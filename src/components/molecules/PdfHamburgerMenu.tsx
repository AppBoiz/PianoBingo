import type { MouseEvent } from 'react'

interface PdfMenuAction {
  id: string
  label: string
  onClick: () => void
  className?: string
}

interface PdfHamburgerMenuProps {
  actions: PdfMenuAction[]
}

export default function PdfHamburgerMenu({ actions }: PdfHamburgerMenuProps) {
  function handleActionClick(event: MouseEvent<HTMLAnchorElement>, action: PdfMenuAction) {
    event.preventDefault()
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
