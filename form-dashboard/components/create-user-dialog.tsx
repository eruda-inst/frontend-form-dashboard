"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { toast } from "sonner"
import { Plus, Loader2, Check, ChevronsUpDown } from "lucide-react"
 



import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Group = {
  id: string
  nome: string
}

interface CreateUserDialogProps {
  onUserCreated: () => void
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Estados do formulário
  const [nome, setNome] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [genero, setGenero] = useState("outro")
  const [imagem, setImagem] = useState("")
  const [grupoId, setGrupoId] = useState("")

  // Estado para a lista de grupos
  const [grupos, setGrupos] = useState<Group[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)

  // Busca os grupos quando o diálogo é aberto
  const fetchGroups = useCallback(async () => {
    setIsLoadingGroups(true)
    const accessToken = Cookies.get("accessToken")
    if (!accessToken) {
      toast.error("Sessão expirada.")
      router.push("/login")
      return
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grupos/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error("Falha ao buscar grupos.")
      const data: Group[] = await res.json()
      setGrupos(data)
    } catch (error: any) {
      toast.error("Erro ao carregar grupos", { description: error.message })
    } finally {
      setIsLoadingGroups(false)
    }
  }, [router])

  useEffect(() => {
    if (isOpen) {
      fetchGroups()
    }
  }, [isOpen, fetchGroups])

  const resetForm = () => {
    setNome("")
    setUsername("")
    setEmail("")
    setSenha("")
    setGenero("outro")
    setImagem("")
    setGrupoId("")
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsCreating(true)

    const accessToken = Cookies.get("accessToken")
    if (!accessToken) {
      toast.error("Sessão expirada.")
      router.push("/login")
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome,
          username,
          genero,
          imagem,
          email,
          senha,
          grupo_id: grupoId,
          ativo: true,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        if (res.status === 422 && errorData.detail) {
          const formattedErrors = errorData.detail
            .map((d: any) => `${d.loc[1]}: ${d.msg}`)
            .join("\n")
          throw new Error(formattedErrors)
        }
        throw new Error(errorData.detail || "Falha ao criar usuário.")
      }

      toast.success("Usuário criado com sucesso!")
      resetForm()
      setIsOpen(false)
      onUserCreated() // Chama o callback para atualizar a lista
    } catch (error: any) {
      toast.error("Erro ao criar usuário", {
        description: error.message,
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.warning("O nome do grupo não pode estar em branco.")
      return
    }
    setIsCreatingGroup(true)
    const accessToken = Cookies.get("accessToken")
    if (!accessToken) {
      toast.error("Sessão expirada.")
      router.push("/login")
      setIsCreatingGroup(false)
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grupos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ nome: newGroupName }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Falha ao criar o grupo.")
      }

      toast.success(`Grupo "${newGroupName}" criado com sucesso!`)
      setNewGroupName("") // Limpa o input
      await fetchGroups() // Re-busca os grupos para atualizar a lista
    } catch (error: any) {
      toast.error("Erro ao criar grupo", { description: error.message })
    } finally {
      setIsCreatingGroup(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer fixed bottom-6 right-6 z-50 shadow-lg">
          Novo usuário
          <Plus className="h-6 w-6" />
          <span className="sr-only">Novo Usuário</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para criar um novo usuário.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nome" className="text-right">
              Nome
            </Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="senha" className="text-right">
              Senha
            </Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="imagem" className="text-left">
              Imagem URL
            </Label>
            <Input
              id="imagem"
              value={imagem}
              onChange={(e) => setImagem(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Gênero</Label>
            <RadioGroup
              value={genero}
              onValueChange={setGenero}
              className="col-span-3 flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="masculino" id="g-masc" />
                <Label htmlFor="g-masc">Masculino</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="feminino" id="g-fem" />
                <Label htmlFor="g-fem">Feminino</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="outro" id="g-outro" />
                <Label htmlFor="g-outro">Outro</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="grupo" className="text-right">
              Grupo
            </Label>
            <Select onValueChange={setGrupoId} value={grupoId} required>
              <SelectTrigger className="col-span-3 w-full">
                <SelectValue
                  placeholder={isLoadingGroups ? "Carregando..." : "Selecione um grupo"}
                />
              </SelectTrigger>
              <SelectContent>
                {grupos.map((grupo) => (
                  <SelectItem key={grupo.id} value={grupo.id}>
                    {grupo.nome}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <div className="flex p-1">
                  <Input
                    placeholder="Novo Grupo"
                    className="h-8 rounded-r-none border-r-0 focus-visible:ring-0"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    disabled={isCreatingGroup}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleCreateGroup()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant={"default"}
                    className="h-8 cursor-pointer rounded-l-none"
                    onClick={handleCreateGroup}
                    disabled={isCreatingGroup || !newGroupName.trim()}
                  >
                    {isCreatingGroup ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isCreating || isLoadingGroups}>
              {isCreating ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}