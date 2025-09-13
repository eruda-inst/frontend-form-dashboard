"use client"
import React from "react"
import { User } from "@/app/types/user"

interface DashboardContextProps {
  selectedItem: string | null
  setSelectedItem: (item: string | null) => void
  usersInRoom: User[]
  setUsersInRoom: (users: User[]) => void
  user: User | null
  setUser: (user: User | null) => void
  isLoadingUser: boolean
  setIsLoadingUser: (isLoading: boolean) => void
}

const DashboardContext = React.createContext<DashboardContextProps | undefined>(undefined)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null)
  const [usersInRoom, setUsersInRoom] = React.useState<User[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = React.useState(true)

  return (
    <DashboardContext.Provider value={{
      selectedItem,
      setSelectedItem,
      usersInRoom,
      setUsersInRoom,
      user,
      setUser,
      isLoadingUser,
      setIsLoadingUser,
    }}>
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