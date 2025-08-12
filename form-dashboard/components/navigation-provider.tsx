"use client"
import * as React from "react"

export interface BreadcrumbItem {
  title: string
  url?: string
}

interface NavigationContextValue {
  activeTitle: string
  setActiveTitle: (title: string) => void
  breadcrumbs: BreadcrumbItem[]
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void
}

const NavigationContext = React.createContext<NavigationContextValue | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeTitle, setActiveTitle] = React.useState("Dashboard")
  const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbItem[]>([])

  return (
    <NavigationContext.Provider
      value={{ activeTitle, setActiveTitle, breadcrumbs, setBreadcrumbs }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = React.useContext(NavigationContext)
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider")
  }
  return context
}