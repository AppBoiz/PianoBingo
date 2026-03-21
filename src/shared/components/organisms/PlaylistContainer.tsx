import type { CSSProperties, ReactNode, Ref } from 'react'

interface PlaylistContainerProps {
  children: ReactNode
  containerId?: string
  className?: string
  containerRef?: Ref<HTMLDivElement>
  style?: CSSProperties
}

export default function PlaylistContainer({ children, containerId, className, containerRef, style }: PlaylistContainerProps) {
  const classes = [
    'playlist-container scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-400/50 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div id={containerId} data-testid="list" ref={containerRef} className={classes} style={style}>
      {children}
    </div>
  )
}
