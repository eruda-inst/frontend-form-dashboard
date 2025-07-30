"use client"
import * as React from "react"

interface NavigationContextValue {
  activeTitle: string
  setActiveTitle: (title: string) => void
}

const NavigationContext = React.createContext<NavigationContextValue | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeTitle, setActiveTitle] = React.useState("Dashboard")
  return (
    <NavigationContext.Provider value={{ activeTitle, setActiveTitle }}>
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