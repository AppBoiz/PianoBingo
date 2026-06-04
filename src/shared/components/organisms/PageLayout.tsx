import type { ReactNode } from 'react'

interface PageLayoutProps {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  rootId?: string
  rootTestId?: string
  rootClassName?: string
  mainClassName?: string
  skipMainWrapper?: boolean
}

export default function PageLayout({
  header,
  footer,
  children,
  rootId = 'app',
  rootTestId,
  rootClassName,
  mainClassName = 'main-content',
  skipMainWrapper = false,
}: PageLayoutProps) {
  const rootClasses = [
    'flex h-[100dvh] min-h-screen w-full flex-col bg-white text-zinc-800',
    rootClassName,
  ].filter(Boolean).join(' ')
  const mainClasses = [
    'main-content flex min-h-0 flex-1 flex-col overflow-hidden',
    mainClassName,
  ].filter(Boolean).join(' ')

  return (
    <div id={rootId} className={rootClasses} data-testid={rootTestId}>
      {header}
      {skipMainWrapper ? children : <div className={mainClasses} data-testid="body">{children}</div>}
      {footer}
    </div>
  )
}
