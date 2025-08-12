import { cookies } from "next/headers"

import { AppSidebar } from "@/components/app-sidebar"
import type { User } from "@/app/types/user"
import { SidebarProvider } from "@/components/ui/sidebar"
import { NavigationProvider } from "@/components/navigation-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const userCookie = (await cookieStore).get("user")

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

  const user: User = userCookie ? JSON.parse(userCookie.value) : defaultUser

  return (
    <SidebarProvider>
      <NavigationProvider>
        <AppSidebar user={user} />
        {children}
      </NavigationProvider>
    </SidebarProvider>
  )
}