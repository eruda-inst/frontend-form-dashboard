"use client"
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react"

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

const NavigationContext = createContext<NavigationContextValue | undefined>(
  undefined,
)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeTitle, setActiveTitle] = useState("Formulários")
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { title: "Formulários" },
  ])

  return (
    <NavigationContext.Provider
      value={{ activeTitle, setActiveTitle, breadcrumbs, setBreadcrumbs }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider")
  }
  return context
}
