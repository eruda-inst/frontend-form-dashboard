"use client"

import { useState } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// This type is specific to the data structure received in this component.
// It can be centralized if other components use the exact same structure.
type User = {
  id: string
  nome: string
  username: string
  email: string
  imagem: string
  genero: string
  nivel: string
  ativo: boolean
  grupo: {
    id: string
    nome: string
  }
}

interface UserActionsDialogProps {
  user: User
  onActionComplete: () => void
}

const getInitials = (name: string) => {
  if (!name) return ""
  const names = name.split(" ")
  const firstInitial = names[0]?.[0] || ""
  const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] || "" : ""
  return `${firstInitial}${lastInitial}`.toUpperCase()
}

export function UserActionsDialog({ user, onActionComplete }: UserActionsDialogProps) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast.warning("A nova senha não pode estar em branco.")
      return
    }
    setIsUpdatingPassword(true)
    const accessToken = Cookies.get("access_token")

    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      setIsUpdatingPassword(false)
      return
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${user.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ senha: newPassword }),
        },
      )

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Falha ao atualizar a senha.")
      }

      toast.success("Senha atualizada com sucesso!")
      setNewPassword("")
    } catch (error: any) {
      toast.error("Erro ao atualizar senha", { description: error.message })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleDeactivateUser = async () => {
    setIsDeactivating(true)
    const accessToken = Cookies.get("access_token")

    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      setIsDeactivating(false)
      return
    }

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${user.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )
      toast.success(`Usuário ${user.nome} desativado com sucesso!`)
      onActionComplete() // Refresh the user list in the parent component
    } catch (error: any) {
      toast.error("Erro ao desativar usuário", { description: error.message })
    } finally {
      setIsDeactivating(false)
    }
  }

  return (
    <Dialog onOpenChange={(open) => !open && setNewPassword("")}>
      <DialogTrigger asChild>
        <Card
          style={{ backgroundImage: `url(${user.imagem})` }}
          className="border-2 border-secondary backdrop-blur-sm overflow-hidden p-0 bg-cover cursor-pointer flex flex-col transition-transform duration-300 ease-in-out hover:scale-105"
        >
          <div className="bg-transparent backdrop-blur-2xl z-2 w-full h-full absolute"></div>
          <div className="bg-card opacity-60 z-1 w-full h-full absolute"></div>
          <CardHeader className="z-3 p-6 flex flex-col items-left text-center">
            <div className="flex">
              <Avatar className="mb-2 h-20 w-20">
                <AvatarImage src={user.imagem} alt={user.nome} />
                <AvatarFallback>{getInitials(user.nome)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2 h-full justify-center pl-6 items-left text-left">
                <CardTitle>
                  {user.nome}{" "}
                  <span className="opacity-70 text-accent-foreground">
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
      </DialogTrigger>
      <DialogContent className="overflow-hidden bg-transparent">
        <div className="bg-transparent backdrop-blur-2xl -z-1 w-full h-16 absolute"></div>
        <div className="bg-card opacity-60 backdrop-blur-2xl -z-1 w-full h-16 absolute"></div>
        <div
          style={{ backgroundImage: `url(${user.imagem})` }}
          className="backdrop-blur-2xl -z-2 w-full h-16 absolute"
        ></div>
        <div className="bg-card -z-3 w-full h-full absolute"></div>
        <DialogHeader>
          <Avatar className="z-10 mb-2 h-20 w-20">
            <AvatarImage src={user.imagem} alt={user.nome} />
            <AvatarFallback>{getInitials(user.nome)}</AvatarFallback>
          </Avatar>
          <DialogTitle>
            {user.nome}{" "}
            <span className="opacity-70 text-accent-foreground">
              @{user.username}
            </span>
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-2">
            <Badge variant="default">{user.grupo.nome}</Badge>
          </DialogDescription>
        </DialogHeader>
        <div className="flex">
          <Input
            className="rounded-r-none"
            type="password"
            placeholder="Nova senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isUpdatingPassword}
          />
          <Button
            className="border-l-0 rounded-l-none"
            variant={"outline"}
            onClick={handleChangePassword}
            disabled={isUpdatingPassword || !newPassword.trim()}
          >
            {isUpdatingPassword ? <Loader2 className="animate-spin" /> : <Check />}
          </Button>
        </div>
        <Button
          variant={"destructive"}
          onClick={handleDeactivateUser}
          disabled={isDeactivating}
        >
          {isDeactivating ? "Desativando..." : "Desativar Usuário"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
