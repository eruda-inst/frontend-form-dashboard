'use client'

import { usePathname, useRouter } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  permissions,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    permission?: string // Optional permission required to see the item
    items?: {
      title: string
      url: string
    }[]
  }[]
  permissions: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()

  const hasPermission = (permission?: string) => {
    // If no permission is required, show the item
    if (!permission) return true
    // Otherwise, check if the user has the required permission
    return permissions.includes(permission)
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items
          .filter((item) => hasPermission(item.permission))
          .map((item) => (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={pathname.startsWith(item.url)}
            >
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={pathname === item.url}
                  onClick={() => {
                    router.push(item.url)
                  }}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  router.push(subItem.url)
                                }}
                              >
                                <span>{subItem.title}</span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
