import { cookies } from "next/headers"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { NavigationProvider } from "@/components/navigation-provider"

// Define um tipo para o objeto do usuário para clareza
type User = {
  name: string
  email: string
  avatar: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const userCookie = cookieStore.get("user")

  // Fornece um usuário padrão caso o cookie não exista
  const defaultUser: User = {
    name: "Guest",
    email: "guest@example.com",
    avatar: "", // Usar string vazia para que o AvatarFallback funcione
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
