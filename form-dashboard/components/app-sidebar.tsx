"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  ClipboardPenLine,
  LayoutDashboard,
  Users,
  Cable,
  UserCog
} from "lucide-react"
import type { User } from "@/app/types/user"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { versionString, versionNotes } from "../versionNotes"
import { usePermissions } from "./permissions-context"
// import Separator from "@/components/ui/separator"
const navMain = [
    {
      title: "Formulários",
      url: "/formularios",
      icon: ClipboardPenLine,
      permission: "Ver formulários",
    },
    {
      title: "Usuários",
      url: "/usuarios",
      icon: Users,
      permission: "Ver usuários",
    },
    {
      title: "Grupos e Permissões",
      url: "/grupos-e-permissoes",
      icon: UserCog,
      permission: "Ver grupos",
    },
    // {
    //   title: "Integrações",
    //   url: "/integracoes",
    //   icon: Cable,
    //   permission: "Ver integrações",
    // }
  ]
const navSecondary = [
    {
      title: versionString,
      url: "#",
      icon: LifeBuoy,
    },
  ]
const projects = [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ]

import { Skeleton } from "@/components/ui/skeleton";

// ... (rest of the imports)

// ... (navMain, navSecondary, projects constants)

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { permissions, loading } = usePermissions()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        {mounted && (
          <Image 
            src={`/logo-candol-${resolvedTheme === "dark" ? "white" : "black"}.png`}
            alt="Logo Candol"
            width={150}
            height={40}
            className="mx-2 my-4"
          />
        )}
      </SidebarHeader>
      <SidebarContent>
        {loading ? (
          <div className="space-y-2 px-2 mt-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <NavMain items={navMain} permissions={permissions} />
        )}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
