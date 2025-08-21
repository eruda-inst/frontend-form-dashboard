"use client"

import { useState } from "react"
import type { User } from "@/app/types/user"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,  DialogContent,  DialogDescription,  DialogHeader,  DialogTitle,  DialogTrigger,  DialogFooter,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Check, Loader2, Smile } from "lucide-react"

// Helper function to get initials from a name
const getInitials = (name: string) => {
  if (!name) return ""
  const names = name.split(" ")
  const firstInitial = names[0]?.[0] || ""
  const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] || "" : ""
  return `${firstInitial}${lastInitial}`.toUpperCase()
}

export function EditProfileDialog({ user }: { user: User }) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Form fields state
  const [editedName, setEditedName] = useState(user.nome)
  const [editedEmail, setEditedEmail] = useState(user.email)
  const [editedImagem, setEditedImagem] = useState(user.imagem)
  const [editedGenero, setEditedGenero] = useState(user.genero)

  // Password change state
  const [newPassword, setNewPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

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
        `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${user.id}/senha`,
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

  const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsUpdating(true)

    const accessToken = Cookies.get("access_token")
    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      return
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            nome: editedName,
            email: editedEmail,
            username: user.username, // username is not editable in this form
            genero: editedGenero,
            imagem: editedImagem,
            ativo: true,
          }),
        },
      )

      if (!res.ok) {
        const errorData = await res.json()
        if (res.status === 422 && errorData.detail) {
          const formattedErrors = errorData.detail
            .map((d: any) => `${d.loc[1]}: ${d.msg}`)
            .join("\n")
          throw new Error(formattedErrors)
        }
        throw new Error(errorData.detail || "Falha ao atualizar perfil.")
      }

      const updatedUser = { ...user, name: editedName, email: editedEmail, genero: editedGenero, avatar: editedImagem };
      Cookies.set("user", JSON.stringify(updatedUser), { expires: 7, path: '/' });

      toast.success("Perfil atualizado com sucesso!")
      setIsDialogOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error("Erro ao atualizar", { description: err.message })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(e) => e.preventDefault()} // Prevents DropdownMenu from closing
        >
          <Smile />
          Editar Perfil
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
            <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-20 w-20 ">
                    <AvatarImage src={editedImagem} alt={editedName} />
                    <AvatarFallback className="text-2xl">
                        {getInitials(editedName)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <DialogTitle>Editar Perfil</DialogTitle>
                    <DialogDescription>
                        Faça alterações no seu perfil aqui. Clique em salvar quando terminar.
                    </DialogDescription>
                </div>
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
                  <RadioGroupItem value="masculino" id="r1" />
                  <Label htmlFor="r1">Masculino</Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="feminino" id="r2" />
                  <Label htmlFor="r2">Feminino</Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="outro" id="r3" />
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
                type="button"
                className="border-l-0 rounded-l-none"
                variant={"outline"}
                onClick={handleChangePassword}
                disabled={isUpdatingPassword || !newPassword.trim()}
              >
                {isUpdatingPassword ? <Loader2 className="animate-spin" /> : <Check />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isUpdating}>
              {isUpdating ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
