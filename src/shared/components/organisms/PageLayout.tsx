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
  return (
    <div id={rootId} className={rootClassName} data-testid={rootTestId}>
      {header}
      {skipMainWrapper ? children : <div className={mainClassName} data-testid="body">{children}</div>}
      {footer}
    </div>
  )
}
