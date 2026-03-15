import type { CSSProperties, ReactNode, Ref } from 'react'

interface PlaylistContainerProps {
  children: ReactNode
  containerId?: string
  className?: string
  containerRef?: Ref<HTMLDivElement>
  style?: CSSProperties
}

export default function PlaylistContainer({ children, containerId, className, containerRef, style }: PlaylistContainerProps) {
  const classes = className ? `playlist-container ${className}` : 'playlist-container'

  return (
    <div id={containerId} ref={containerRef} className={classes} style={style}>
      {children}
    </div>
  )
}
