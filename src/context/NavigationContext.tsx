import React, { createContext, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { PAGE } from '../constants/navigation'
import type { PageKey, PagePath } from '../constants/navigation'

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
