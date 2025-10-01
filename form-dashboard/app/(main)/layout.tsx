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
import { useTheme } from "next-themes";

// ... dentro do seu componente


export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { resolvedTheme } = useTheme();

  return (
    <SidebarProvider className="h-screen overflow-hidden">
        <MenubarProvider>
          <DashboardProvider>
            <NavigationProvider>
              <UserFetcher>
                <AppSidebar />
                <SidebarInset className="overflow-scroll">
                  <DashboardHeader 
                    style={{ background: "linear-gradient(to bottom, var(--background) 50%, transparent)" }}
                    className="sticky top-0 z-10 "
                  />
                  <main className="">
                    <div className="flex flex-1 h-full flex-col gap-4 p-4 pb-4">
                      {children}
                    </div>
                  </main>
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
