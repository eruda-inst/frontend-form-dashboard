"use client"
import React from "react"

interface DashboardContextProps {
  selectedItem: string | null
  setSelectedItem: (item: string | null) => void
}

const DashboardContext = React.createContext<DashboardContextProps | undefined>(undefined)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null)
  return (
    <DashboardContext.Provider value={{ selectedItem, setSelectedItem }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = React.useContext(DashboardContext)
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider")
  }
  return context
}
