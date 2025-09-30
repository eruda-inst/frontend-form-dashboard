"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useNavigation } from "@/components/navigation-provider"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { MenubarItemData, MenubarMenuData, MenubarContentItem } from "@/app/types/menubar";
import { useMenubar } from "@/components/menubar-context";
import { useDashboard } from "@/components/dashboard-context";
import { User } from "@/app/types/user";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { cn } from "@/lib/utils"

// Define the interfaces for the menubar data structure


interface DashboardHeaderProps {
  className?: string;
  style?: React.CSSProperties;
}

// Helper function to render menubar items recursively
const renderMenubarItems = (items: MenubarContentItem[]) => {
  return items.map((item, index) => {
    // Type guard to check if it's a MenubarMenuData (nested menu)
    if ('content' in item && Array.isArray(item.content)) {
      // If it has 'content' and it's an array, it's a MenubarMenuData
      return (
        <MenubarMenu key={index}>
          <MenubarTrigger>{item.trigger}</MenubarTrigger>
          <MenubarContent>
            {renderMenubarItems(item.content)}
          </MenubarContent>
        </MenubarMenu>
      );
    } else {
      // If it doesn't have 'content' or 'content' is not an array, it must be a MenubarItemData
      const menuItem = item as MenubarItemData; // Explicit type assertion

      if (menuItem.separator) {
        return <MenubarSeparator key={index} />;
      }
      if (menuItem.component) {
        return <MenubarItem key={index}>{menuItem.component}</MenubarItem>;
      }
      return (
        <MenubarItem key={index} onClick={menuItem.onClick}>
          {menuItem.label} {menuItem.shortcut && <MenubarShortcut>{menuItem.shortcut}</MenubarShortcut>}
        </MenubarItem>
      );
    }
  });
};

export function DashboardHeader({ className, style }: DashboardHeaderProps) {
  const { breadcrumbs } = useNavigation()
  const { menubarData } = useMenubar();
  const { usersInRoom } = useDashboard();
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const usersWithImages = usersInRoom.map(userInRoom => {
    const foundUser = allUsers.find(user => user.username === userInRoom.username);
    const image = foundUser ? foundUser.imagem : "/default-avatar.png";
    
    return {
      ...userInRoom,
      image: image
    };
  });

  

  return (
    <header
      style={style}
      className={cn("flex h-16 shrink-0 items-center gap-2 justify-between pr-3", className)}
    >
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem className="hidden md:flex">
                  {crumb.url && index < breadcrumbs.length - 1 ? (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.url}>{crumb.title}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex gap-2">
        <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
          {usersWithImages.map((user, index) => (
            <Avatar key={index}>
              <AvatarImage src={user.image} alt={user.username} />
              <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          ))}
        </div>
{menubarData && menubarData.length > 0 && (
          <Menubar>
            {menubarData.map((menu, index) => (
              <MenubarMenu key={index}>
                <MenubarTrigger>{menu.trigger}</MenubarTrigger>
                <MenubarContent>
                  {renderMenubarItems(menu.content)}
                </MenubarContent>
              </MenubarMenu>
            ))}
          </Menubar>
        )}

      </div>
        
        
    </header>
  )
}