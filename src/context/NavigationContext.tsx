import React, { createContext, useContext } from 'react'
import { useNavigate } from 'react-router-dom'

const PAGE = {
  GAME: '/pdf-reader',
  WELCOME: '/',
  PACK_SELECT: '/pack-select',
  GAME_HISTORY: '/game-history',
  PACK_MANAGEMENT: '/pack-management',
  PACK_EDIT: '/pack-edit',
  SONG_MANAGEMENT: '/song-management',
  SONG_VIEW: '/song-view'
} as const

type PageKey = keyof typeof PAGE
type PagePath = typeof PAGE[PageKey]

type NavigationContextValue = {
  PAGE: typeof PAGE
  loadPage: (page: PageKey | PagePath | string) => void
}

function isPageKey(page: string): page is PageKey {
  return page in PAGE
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }){
  const navigate = useNavigate()

  const loadPage = (page: PageKey | PagePath | string) => {
    // Accept either a PAGE key (e.g. 'PACK_SELECT') or a route path ('/pack-select')
    if (!page) return
    if (page.startsWith('/')) return navigate(page)
    const mapped = isPageKey(page) ? PAGE[page] : undefined
    if (mapped) return navigate(mapped)
    // fallback: try to navigate directly
    navigate(page)
  }

  return (
    <NavigationContext.Provider value={{ PAGE, loadPage }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation(){
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider')
  return ctx
}
