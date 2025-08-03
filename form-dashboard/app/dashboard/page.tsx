"use client"
import { Badge } from "@/components/ui/badge"



import { useState, useEffect } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useNavigation } from "@/components/navigation-provider"
import { toast } from "sonner"

// Definindo o tipo para um usuário, baseado na sua resposta da API
type User = {
  id: string
  nome: string
  username: string
  email: string
  imagem: string
  genero: string
  grupo: {
    id: string
    nome: string
  }
}

export default function Page() {
  const { activeTitle } = useNavigation()
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  // Função para extrair as iniciais do nome
  const getInitials = (name: string) => {
    if (!name) return ""
    const names = name.split(" ")
    const firstInitial = names[0]?.[0] || ""
    const lastInitial =
      names.length > 1 ? names[names.length - 1]?.[0] || "" : ""
    return `${firstInitial}${lastInitial}`.toUpperCase()
  }

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      const accessToken = Cookies.get("accessToken")

      if (!accessToken) {
        toast.error("Sessão expirada. Por favor, faça login novamente.")
        router.push("/login")
        return
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!res.ok) {
          throw new Error("Falha ao buscar usuários.")
        }

        const data: User[] = await res.json()
        setUsers(data)
      } catch (error: any) {
        toast.error("Erro ao carregar usuários", {
          description: error.message,
        })
      } finally {
        setIsLoadingUsers(false)
      }
    }

    if (activeTitle === "Usuários e Grupos") {
      fetchUsers()
    }
  }, [activeTitle, router])

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
      case "Usuários e Grupos":
        if (isLoadingUsers) {
          return <div className="text-center">Carregando usuários...</div>
        }
        return (
          <div className="grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {users.map((user) => (
              <Card key={user.id} style={{backgroundImage: `url(${user.imagem})`}} className="border-0 backdrop-blur-sm overflow-hidden p-0 bg-cover cursor-pointer flex flex-col transition-transform duration-300 ease-in-out hover:scale-105">
                <div className="bg-transparent backdrop-blur-2xl  z-0 w-full h-full absolute"></div>
                <div className="bg-card opacity-60 backdrop-blur-2xl  z-0 w-full h-full absolute"></div>
                <CardHeader  className="z-1 p-6 flex flex-col items-center text-center">
                  <div className="flex">


                  <Avatar className="mb-2 h-20 w-20">
                    <AvatarImage src={user.imagem} alt={user.nome} />
                    <AvatarFallback>{getInitials(user.nome)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2 h-full justify-center pl-6 items-left text-left">

                    
                  <CardTitle>{user.nome} <span className="opacity-70 text-accent-foreground font-thin">

                    @{user.username}
                  </span>
                    </CardTitle>
                  <CardDescription>
                    <Badge variant="default">{user.grupo.nome}</Badge>

                  </CardDescription>
                  </div>
                  </div>
                </CardHeader>
                

              </Card>
            ))}
          </div>
        )
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