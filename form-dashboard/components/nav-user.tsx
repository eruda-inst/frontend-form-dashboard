"use client"

import { useState, useEffect } from "react"
import type { User } from "@/app/types/user"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"

import { Button } from "./ui/button"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  Smile,
  LogOut,
  UserRoundPen,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({ user }: { user: User }) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  // Estados para o logout
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Estados para o Dialog de Edição
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Estados para os campos do formulário de edição
  const [editedName, setEditedName] = useState(user.name)
  const [editedEmail, setEditedEmail] = useState(user.email)
  const [editedUsername, setEditedUsername] = useState(user.username)
  const [editedGenero, setEditedGenero] = useState(user.genero)
  const [editedImagem, setEditedImagem] = useState(user.avatar)


  const [newPassword, setNewPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast.warning("A nova senha não pode estar em branco.")
      return
    }
    setIsUpdatingPassword(true)
    const accessToken = Cookies.get("accessToken")

    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      setIsUpdatingPassword(false)
      return
    }

    try {
      // Primeiro, obtemos o ID do usuário logado para garantir que temos o ID correto.
      const meResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!meResponse.ok) {
        throw new Error("Não foi possível obter os dados do usuário atual.")
      }
      const currentUser = await meResponse.json()
      const userId = currentUser.id

      // Agora, fazemos a chamada PATCH para a rota específica de senha.
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${userId}/senha`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            senha: newPassword,
          }),
        }
      )

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Falha ao atualizar a senha.")
      }

      toast.success("Senha atualizada com sucesso!")
      setNewPassword("") // Limpa o campo de senha após o sucesso
    } catch (error: any) {
      toast.error("Erro ao atualizar senha", { description: error.message })
    } finally {
      setIsUpdatingPassword(false) // Reseta o estado de carregamento
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Faz a chamada para a nossa API de logout, que por sua vez
      // se comunica com o backend e limpa os cookies.
      await fetch("/api/logout", {
        method: "POST",
      })
    } catch (error) {
      console.error("Falha ao chamar a API de logout:", error)
    } finally {
      // Independentemente do resultado da API, redirecionamos o usuário.
      router.push("/login")
    }
  }

  const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsUpdating(true)
    setUpdateError(null)

    
    const accessToken = Cookies.get("accessToken")
    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      return
    }
    const userCurrentDataUpdate = await fetch (
      `${process.env.NEXT_PUBLIC_API_URL}/me`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    if (!userCurrentDataUpdate.ok) {
      throw new Error("Não foi possível obter os dados do usuário atual para atualização.")
    }
    const refreshedUser = await userCurrentDataUpdate.json();

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${refreshedUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            nome: editedName,
            email: editedEmail,
            username: editedUsername,
            genero: editedGenero,
            imagem: editedImagem,
            // Mantemos os valores que não são editáveis no formulário
            nivel: user.nivel,
            ativo: true,
            grupo_id: user.grupo_id,
          }),
        }
      )

      if (!res.ok) {
        const errorData = await res.json()
        // Formata erros de validação 422
        if (res.status === 422 && errorData.detail) {
          const formattedErrors = errorData.detail
            .map((d: any) => `${d.loc[1]}: ${d.msg}`)
            .join("\n")
          throw new Error(formattedErrors)
        }
        throw new Error(errorData.detail || "Falha ao atualizar perfil.")
      }

      // Atualiza o cookie 'user' com os novos dados
      const updatedUser = { ...user, name: editedName, email: editedEmail, username: editedUsername, genero: editedGenero, avatar: editedImagem };
      Cookies.set("user", JSON.stringify(updatedUser), { expires: 7, path: '/' });

      toast.success("Perfil atualizado com sucesso!")
      setIsDialogOpen(false) // Fecha o dialog
      router.refresh() // Recarrega os Server Components para refletir a mudança
    } catch (err: any) {
      setUpdateError(err.message)
      toast.error("Erro ao atualizar", { description: err.message })
    } finally {
      setIsUpdating(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return ""
    const names = name.split(" ")
    const firstInitial = names[0]?.[0] || ""
    const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] || "" : ""
    return `${firstInitial}${lastInitial}`.toUpperCase()
  }

  return (
    <SidebarMenu >
      <SidebarMenuItem >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer" asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
              <Avatar className="h-8 w-8 rounded-2xl">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.grupo}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.grupo}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/* <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
                </DropdownMenuItem> */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DialogTrigger className="w-full cursor-pointer"><DropdownMenuItem className=" cursor-pointer">
                <Smile />
                
                  Editar Perfil
                
              </DropdownMenuItem></DialogTrigger> 
              {/* <DropdownMenuItem>
                <CreditCard />
                Billing
                </DropdownMenuItem> */}
              
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className=" cursor-pointer"
              onSelect={(e) => {
                e.preventDefault()
                handleLogout()
              }}
              disabled={isLoggingOut}
              >
              <LogOut />
              {isLoggingOut ? "Saindo..." : "Sair"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

       
          <DialogContent>
            <Avatar className="h-24 w-24 ">
                <AvatarImage src={user.avatar} alt={user.name}></AvatarImage>
              </Avatar>
              
              <DialogHeader>
              <DialogTitle>Editar Perfil</DialogTitle>
              
              <DialogDescription>
                Faça alterações no seu perfil aqui. Clique em salvar quando terminar.
              </DialogDescription>

              <div className="flex-col justify-center w-full">
                
              </div>
              
            </DialogHeader>
            <form onSubmit={handleUpdateProfile}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imagem">Link Foto de Perfil</Label>
                  <Input
                    id="imagem"
                    value={editedImagem}
                    onChange={(e) => setEditedImagem(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Gênero</Label>
                  <RadioGroup value={editedGenero} onValueChange={setEditedGenero}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="masculino" id="r1" className="cursor-pointer" />
                      <Label htmlFor="r1">Masculino</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="feminino" id="r2" className="cursor-pointer" />
                      <Label htmlFor="r2">Feminino</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="outro" id="r3" className="cursor-pointer"/>
                      <Label htmlFor="r3">Outro</Label>
                    </div>
                  </RadioGroup>
                </div>
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
                type="button" // Impede o envio do formulário principal
                className="cursor-pointer border-l-0 rounded-l-none"
                variant={"outline"}
                onClick={handleChangePassword}
                disabled={isUpdatingPassword || !newPassword.trim()}
              >
                {isUpdatingPassword ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Check />
                )}
              </Button>
              </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full cursor-pointer" disabled={isUpdating}>
                  {isUpdating ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
              </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
