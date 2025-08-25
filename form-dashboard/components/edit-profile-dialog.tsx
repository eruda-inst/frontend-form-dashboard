"use client"

import { useState, useRef } from "react"
import type { User } from "@/app/types/user"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Check, Loader2, Smile, Pencil } from "lucide-react"

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isAvatarHovered, setIsAvatarHovered] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Form fields state
  const [editedName, setEditedName] = useState(user.nome)
  const [editedEmail, setEditedEmail] = useState(user.email)
  const [editedImagem, setEditedImagem] = useState(user.imagem)
  const [editedGenero, setEditedGenero] = useState(user.genero)

  // Password change state
  const [newPassword, setNewPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("arquivo", file)

    setIsUploading(true)
    const accessToken = Cookies.get("access_token")
    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      setIsUploading(false)
      return
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/usuarios/me/imagem`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        },
      )

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Falha ao carregar imagem.")
      }

      const data = await res.json()
      setEditedImagem(data.imagem)
      const updatedUser = { ...user, imagem: data.imagem };
      Cookies.set("user", JSON.stringify(updatedUser), { expires: 7, path: '/' });


      toast.success("Imagem de perfil atualizada com sucesso!")
      router.refresh()
    } catch (error: any) {
      toast.error("Erro ao carregar imagem", { description: error.message })
    } finally {
      setIsUploading(false)
    }
  }

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
         Perfil e Conta
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
            <div className="flex items-center gap-4 mb-4">
                <div
                  className="relative cursor-pointer"
                  onMouseEnter={() => setIsAvatarHovered(true)}
                  onMouseLeave={() => setIsAvatarHovered(false)}
                  onClick={handleAvatarClick}
                >
                  <Avatar className="h-20 w-20">
                      <AvatarImage src={editedImagem} alt={editedName} />
                      <AvatarFallback className="text-2xl">
                          {getInitials(editedName)}
                      </AvatarFallback>
                  </Avatar>
                  {(isAvatarHovered || isUploading) && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                      {isUploading ? (
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      ) : (
                        <Pencil className="h-8 w-8 text-white" />
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                    disabled={isUploading}
                  />
                </div>
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
            <div className="grid gap-2">
              <Label>Senha</Label>
              <Input
                type="password"
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isUpdatingPassword}
              />
              
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
