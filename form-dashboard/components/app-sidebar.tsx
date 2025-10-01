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
    },
    {
      title: "Usuários",
      url: "/usuarios",
      icon: Users,
    },
    {
      title: "Grupos e Permissões",
      url: "/grupos-e-permissoes",
      icon: UserCog,
    },
    {
      title: "Integrações",
      url: "/integracoes",
      icon: Cable,
    }
    // {
    //   title: "Models",
    //   url: "#",
    //   icon: Bot,
    //   items: [
    //     {
    //       title: "Genesis",
    //       url: "#",
    //     },
    //     {
    //       title: "Explorer",
    //       url: "#",
    //     },
    //     {
    //       title: "Quantum",
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Documentation",
    //   url: "#",
    //   icon: BookOpen,
    //   items: [
    //     {
    //       title: "Introduction",
    //       url: "#",
    //     },
    //     {
    //       title: "Get Started",
    //       url: "#",
    //     },
    //     {
    //       title: "Tutorials",
    //       url: "#",
    //     },
    //     {
    //       title: "Changelog",
    //       url: "#",
    //     },
    //   ],
    // },
    
   
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

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { permissions, loading } = usePermissions()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading) {
      console.log("Permissions loaded in AppSidebar:", permissions)
    }
  }, [loading, permissions])

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
        <NavMain items={navMain} />
        {/* <NavProjects projects={projects}/> */}
        
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
