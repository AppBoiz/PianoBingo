import React from 'react'

interface HeaderProps {
  title: string
  backAction: () => void
  rightContent?: React.ReactNode
  withContainers?: boolean
}

export default function Header({ title, backAction, rightContent, withContainers = true }: HeaderProps) {
  if (withContainers) {
    return (
      <div className="nav-bar" data-testid="header">
        <div className="back-container nav-bar-left">
          <button onClick={backAction} data-action="back">Back</button>
        </div>
        <h1>{title}</h1>
        {rightContent && <div className="nav-bar-right">{rightContent}</div>}
      </div>
    )
  }

  return (
    <div className="nav-bar" data-testid="header">
      <button onClick={backAction} data-action="back">Back</button>
      <h1>{title}</h1>
      {rightContent && <div>{rightContent}</div>}
    </div>
  )
}
