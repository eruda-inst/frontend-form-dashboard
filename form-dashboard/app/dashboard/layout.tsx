"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { NavigationProvider } from "@/components/navigation-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { MenubarProvider } from "@/components/menubar-context"
import { DashboardProvider } from "@/components/dashboard-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const access_token = Cookies.get("access_token");
      if (!access_token) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  return (
    <SidebarProvider>
      <NavigationProvider>
        <MenubarProvider>
          <DashboardProvider>
            <AppSidebar />
            <SidebarInset>
              <DashboardHeader />
              <main className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</main>
            </SidebarInset>
          </DashboardProvider>
        </MenubarProvider>
      </NavigationProvider>
    </SidebarProvider>
  )
}