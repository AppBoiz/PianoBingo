import type { ReactNode } from 'react'

interface PageLayoutProps {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  rootId?: string
  rootClassName?: string
  mainClassName?: string
  skipMainWrapper?: boolean
}

export default function PageLayout({
  header,
  footer,
  children,
  rootId = 'app',
  rootClassName,
  mainClassName = 'main-content',
  skipMainWrapper = false,
}: PageLayoutProps) {
  return (
    <div id={rootId} className={rootClassName}>
      {header}
      {skipMainWrapper ? children : <div className={mainClassName}>{children}</div>}
      {footer}
    </div>
  )
}
