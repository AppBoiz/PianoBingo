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
      <div className="nav-bar relative flex h-28 w-full items-center justify-center px-4 md:px-6" data-testid="header">
        <div className="back-container nav-bar-left absolute left-4 flex items-center md:left-6">
          <button
            className="rounded-full px-3 py-2 text-2xl font-bold text-brand-pink transition hover:bg-brand-pink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink/40 md:text-[30px]"
            onClick={backAction}
            data-action="back"
          >
            Back
          </button>
        </div>
        <h1 className="px-20 text-center text-3xl font-semibold tracking-tight text-black md:text-[45px]">{title}</h1>
        {rightContent && <div className="nav-bar-right absolute right-4 text-lg font-bold text-zinc-700 md:right-6">{rightContent}</div>}
      </div>
    )
  }

  return (
    <div className="nav-bar flex w-full items-center justify-between gap-4 px-4 py-3 md:px-6" data-testid="header">
      <button
        className="rounded-full px-3 py-2 text-2xl font-bold text-brand-pink transition hover:bg-brand-pink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink/40 md:text-[30px]"
        onClick={backAction}
        data-action="back"
      >
        Back
      </button>
      <h1 className="flex-1 text-center text-2xl font-semibold tracking-tight text-black md:text-4xl">{title}</h1>
      {rightContent && <div>{rightContent}</div>}
    </div>
  )
}
