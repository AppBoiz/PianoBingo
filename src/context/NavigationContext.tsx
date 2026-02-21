import React, { createContext, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { PAGE as LEGACY_PAGE } from '../services/navigation/legacyNavigation'

type NavigationContextValue = {
  PAGE: Record<string, string>
  loadPage: (page: string) => void
}

const PAGE = LEGACY_PAGE

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }){
  const navigate = useNavigate()

  const loadPage = (page: string) => {
    // Accept either a PAGE key (e.g. 'PACK_SELECT') or a route path ('/pack-select')
    if (!page) return
    if (page.startsWith('/')) return navigate(page)
    const mapped = (PAGE as any)[page]
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
