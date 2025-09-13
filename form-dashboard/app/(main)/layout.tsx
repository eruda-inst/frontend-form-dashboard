'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { MenubarProvider } from "@/components/menubar-context"
import { DashboardProvider, useDashboard } from "@/components/dashboard-context"
import { NavigationProvider } from "@/components/navigation-provider"
import Cookies from "js-cookie"
import { toast } from "sonner"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
        <MenubarProvider>
          <DashboardProvider>
            <NavigationProvider>
              <UserFetcher>
                <AppSidebar />
                <SidebarInset>
                  <DashboardHeader />
                  <main className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</main>
                </SidebarInset>
              </UserFetcher>
            </NavigationProvider>
          </DashboardProvider>
        </MenubarProvider>
    </SidebarProvider>
  )
}

function UserFetcher({ children }: { children: React.ReactNode }) {
  const { setUser, setIsLoadingUser } = useDashboard()
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const userCookie = Cookies.get("user")
      const accessToken = Cookies.get("access_token")

      if (userCookie && accessToken) {
        try {
          const userData = JSON.parse(userCookie)
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${userData.id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          )
          if (!response.ok) {
            throw new Error("Failed to fetch user data")
          }
          const data = await response.json()
          setUser(data)
        } catch (error) {
          toast.error("Failed to load user profile.")
          router.push("/login")
        } finally {
          setIsLoadingUser(false)
        }
      } else {
        setIsLoadingUser(false)
        router.push("/login")
      }
    }

    fetchUser()
  }, [setUser, setIsLoadingUser, router])

  return <>{children}</>
}
