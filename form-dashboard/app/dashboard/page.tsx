"use client"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useNavigation } from "@/components/navigation-provider"
import UsersPage from "@/components/pages/users-page/users-page"
import GroupsPage from "@/components/pages/groups-page/groups-page"

export default function Page() {
  const { activeTitle } = useNavigation()

  const renderContent = () => {
    switch (activeTitle) {
      case "Dashboard":
        return (
        <>
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div>
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
        </>
      )
      case "Usuários":
        return <UsersPage />
      case "Grupos e Permissões":
        return <GroupsPage/>
      default:
          return (
            <div className="flex h-full min-h-[50vh] items-center justify-center rounded-xl border border-dashed">
            <span className="text-xl font-medium">{activeTitle}</span>
          </div>
          )
    }
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {activeTitle !== "Dashboard" && (
                <>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbPage>{activeTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                  {/* <BreadcrumbSeparator className="hidden md:block" /> */}
                </>
              )}
              {/* <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem> */}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{renderContent()}</div>
    </SidebarInset>
  )
}