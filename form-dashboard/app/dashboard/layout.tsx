import { cookies } from "next/headers"

import { AppSidebar } from "@/components/app-sidebar"
import type { User } from "@/app/types/user"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { NavigationProvider } from "@/components/navigation-provider"
import { DashboardHeader } from "@/components/dashboard-header"

// Fornece um usuário padrão caso o cookie não exista
const defaultUser: User = {
  id: "default",
  name: "Convidado",
  email: "guest@example.com",
  avatar: "",
  grupo: "Convidado",
  username: "guest",
  genero: "outro",
  grupo_id: "default",
  nivel: "user",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const userCookie = (await cookieStore).get("user")

  const user: User = userCookie ? JSON.parse(userCookie.value) : defaultUser

  return (
    <SidebarProvider>
      <NavigationProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</main>
        </SidebarInset>
      </NavigationProvider>
    </SidebarProvider>
  )
}
