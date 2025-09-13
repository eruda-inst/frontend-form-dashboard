"use client"

import { useEffect } from "react"
import { useNavigation } from "@/components/navigation-provider"
import UsersPage from "@/components/pages/users-page/users-page"
import GroupsPage from "@/components/pages/groups-page/groups-page"
import FormsPage from "@/components/pages/forms-page/forms-page"

export default function Page() {
  const { activeTitle } = useNavigation()

  

  switch (activeTitle) {
    case "Dashboard":
      return (
        <>
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div>
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
        </>
      )
    case "Usuários":
      return <UsersPage />
    case "Grupos e Permissões":
      return <GroupsPage />
    case "Formulários":
      return <FormsPage />
    default:
      return (
        <div className="flex h-full min-h-[50vh] items-center justify-center rounded-xl border border-dashed">
          <span className="text-xl font-medium">{activeTitle}</span>
        </div>
      )
  }
}