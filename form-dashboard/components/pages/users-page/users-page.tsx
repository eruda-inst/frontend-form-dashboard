"use client"
import { Badge } from "@/components/ui/badge"

import { useState, useEffect, useCallback } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreateUserDialog } from "@/components/create-user-dialog"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Definindo o tipo para um usuário, baseado na sua resposta da API
type User = {
  id: string
  nome: string
  username: string
  email: string
  imagem: string
  genero: string
  nivel: string
  grupo: {
    id: string
    nome: string
  }
}

export default function UsersPage() {
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [deactivatingUserId, setDeactivatingUserId] = useState<string | null>(null)

  const getInitials = (name: string) => {
    if (!name) return ""
    const names = name.split(" ")
    const firstInitial = names[0]?.[0] || ""
    const lastInitial =
      names.length > 1 ? names[names.length - 1]?.[0] || "" : ""
    return `${firstInitial}${lastInitial}`.toUpperCase()
  }

  const fetchUsers = useCallback(async () => {
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
  }, [router])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleUserCreated = () => {
    fetchUsers()
  }

  const handleDeactivateUser = async (userToDeactivate: User) => {
    setDeactivatingUserId(userToDeactivate.id)
    const accessToken = Cookies.get("accessToken")

    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      setDeactivatingUserId(null)
      return
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${userToDeactivate.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            nome: userToDeactivate.nome,
            email: userToDeactivate.email,
            username: userToDeactivate.username,
            nivel: userToDeactivate.nivel,
            genero: userToDeactivate.genero,
            imagem: userToDeactivate.imagem,
            grupo_id: userToDeactivate.grupo.id,
            ativo: false, // A mudança principal para desativar
          }),
        }
      )

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Falha ao desativar usuário.")
      }

      toast.success(`Usuário ${userToDeactivate.nome} desativado com sucesso!`)
      fetchUsers() // Atualiza a lista para remover o usuário desativado
    } catch (error: any) {
      toast.error("Erro ao desativar usuário", { description: error.message })
    } finally {
      setDeactivatingUserId(null)
    }
  }

  if (isLoadingUsers) {
    return <div className="text-center">Carregando usuários...</div>
  }

  return (
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {users.map((user) => (
          <Dialog>
            <DialogTrigger asChild>
          <Card key={user.id} style={{backgroundImage: `url(${user.imagem})`}   } className="border-2 border-secondary  backdrop-blur-sm overflow-hidden p-0 bg-cover cursor-pointer flex flex-col transition-transform duration-300 ease-in-out hover:scale-105">
            <div className=" bg-transparent  backdrop-blur-2xl z-2 w-full h-full absolute"></div>
            <div className="bg-card opacity-60 z-1 w-full h-full absolute"></div>
            <CardHeader  className="z-3 p-6 flex flex-col items-center text-center">
              <div className="flex">
                <Avatar className="mb-2 h-20 w-20">
                  <AvatarImage src={user.imagem} alt={user.nome} />
                  <AvatarFallback>{getInitials(user.nome)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2 h-full justify-center pl-6 items-left text-left">
                  <CardTitle>{user.nome} <span className="opacity-70 text-accent-foreground">
                    @{user.username}
                  </span>
                  </CardTitle>
                  <CardDescription >
                    <Badge variant="default">{user.grupo.nome}</Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
          </DialogTrigger>
            <DialogContent className="overflow-hidden bg-transparent">
      <div className=" bg-transparent  backdrop-blur-2xl -z-1 w-full h-16 absolute"></div>
      <div className=" bg-card opacity-60  backdrop-blur-2xl -z-1 w-full h-16 absolute"></div>
      <div style={{backgroundImage: `url(${user.imagem})`}} className="backdrop-blur-2xl -z-2 w-full h-16 absolute"></div>
      <div className="bg-card -z-3 w-full h-full absolute"></div>
    <DialogHeader >
      <Avatar className="z-10 mb-2 h-20 w-20">
                  <AvatarImage src={user.imagem} alt={user.nome} />
                  <AvatarFallback>{getInitials(user.nome)}</AvatarFallback>
                </Avatar>
      <DialogTitle>{user.nome} <span className="opacity-70 text-accent-foreground">
        
        @{user.username}
        </span> 
        
        </DialogTitle>
      <DialogDescription className="flex flex-col gap-2">
        <Badge variant="default">{user.grupo.nome}</Badge> 
      </DialogDescription>
    </DialogHeader>
    <Button
      className="cursor-pointer"
      variant={"destructive"}
      onClick={() => handleDeactivateUser(user)}
      disabled={deactivatingUserId === user.id}
    >
      {deactivatingUserId === user.id ? "Desativando..." : "Desativar Usuário"}
    </Button>
  </DialogContent>
          </Dialog>
        ))}
      </div>
      <CreateUserDialog onUserCreated={handleUserCreated} />
    </>
  )
}