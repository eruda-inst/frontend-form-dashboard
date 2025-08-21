"use client"
import React from "react"
import { User } from "@/app/types/user"

interface DashboardContextProps {
  selectedItem: string | null
  setSelectedItem: (item: string | null) => void
  usersInRoom: User[]
  setUsersInRoom: (users: User[]) => void
}

const DashboardContext = React.createContext<DashboardContextProps | undefined>(undefined)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null)
  const [usersInRoom, setUsersInRoom] = React.useState<User[]>([])

  return (
    <DashboardContext.Provider value={{ selectedItem, setSelectedItem, usersInRoom, setUsersInRoom }}>
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