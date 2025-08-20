"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import { AppSidebar } from "@/components/app-sidebar"
import type { User } from "@/app/types/user"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { NavigationProvider } from "@/components/navigation-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { MenubarProvider } from "@/components/menubar-context"

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User>(defaultUser); // Initialize with default user
  const router = useRouter(); // Import useRouter

  useEffect(() => {
    const fetchUser = async () => {
      const access_token = Cookies.get("access_token");
      if (!access_token) {
        // If no access token, user is not logged in, redirect to login
        router.push("/login");
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          console.error("NEXT_PUBLIC_API_URL is not defined in environment variables.");
          // Handle error, maybe redirect to an error page or show a message
          return;
        }
        const response = await fetch(`${apiUrl}/usuarios/me`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        if (response.ok) {
          const userData: User = await response.json();
          setUser(userData);
        } else if (response.status === 401) {
          // Token expired or invalid, redirect to login
          router.push("/login");
        } else {
          console.error("Failed to fetch user data:", response.statusText);
          // Optionally, set an error state or display a message
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Optionally, set an error state or display a message
      }
    };

    fetchUser();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <SidebarProvider>
      <NavigationProvider>
        <MenubarProvider>
          <AppSidebar user={user} />
          <SidebarInset>
            <DashboardHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</main>
          </SidebarInset>
        </MenubarProvider>
      </NavigationProvider>
    </SidebarProvider>
  )
}
