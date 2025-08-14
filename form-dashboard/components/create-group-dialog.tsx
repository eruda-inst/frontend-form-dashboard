"use client"

import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { toast } from "sonner"
import { Plus, Loader2, Check, ChevronsUpDown, X } from "lucide-react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const createGroupSchema = z.object({
  nome: z.string().min(1, { message: "O nome do grupo não pode estar em branco." }),
})

type Permission = {
  id: string
  codigo: string
  nome: string
}

type CreateGroupForm = z.infer<typeof createGroupSchema>

interface CreateGroupDialogProps {
  onGroupCreated: () => void
}

export function CreateGroupDialog({ onGroupCreated }: CreateGroupDialogProps) {

  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPermissionsPopoverOpen, setIsPermissionsPopoverOpen] = useState(false)
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const fetchPermissions = useCallback(async () => {
    setIsLoadingPermissions(true)
    const accessToken = Cookies.get("access_token")

    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/permissoes/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!res.ok) {
        throw new Error("Falha ao buscar permissões.")
      }

      const data: Permission[] = await res.json()
      setPermissions(data)
    } catch (error: any) {
      toast.error("Erro ao carregar permissões", {
        description: error.message,
      })
    } finally {
      setIsLoadingPermissions(false)
    }
  }, [router])

  useEffect(() => {
    if (isOpen) {
      fetchPermissions()
    }
  }, [isOpen, fetchPermissions])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      nome: "",
    },
  })

  const handleCreateGroup = async (data: CreateGroupForm) => {
    const accessToken = Cookies.get("access_token")
    if (!accessToken) {
      toast.error("Sessão expirada.")
      router.push("/login")
      return
    }

    try {
      // Etapa 1: Criar o grupo apenas com o nome para obter o ID
      const createGroupRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/grupos/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ nome: data.nome }),
        }
      )

      if (!createGroupRes.ok) {
        const errorData = await createGroupRes.json()
        throw new Error(errorData.detail || "Falha ao criar o grupo.")
      }

      const newGroup = await createGroupRes.json()
      const groupId = newGroup.id

      // Etapa 2: Se houver permissões, fazer o PUT para atualizá-las
      if (selectedPermissions.length > 0) {
        const permissoesCodigos = permissions
          .filter((p) => selectedPermissions.includes(p.id))
          .map((p) => p.codigo)

        const updatePermissionsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/grupos/${groupId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              nome: data.nome, // A API de PUT também espera o nome
              permissoes_codigos: permissoesCodigos,
            }),
          }
        )

        if (!updatePermissionsRes.ok) {
          const errorData = await updatePermissionsRes.json()
          throw new Error(
            errorData.detail ||
              "Grupo criado, mas falha ao atribuir permissões."
          )
        }
      }

      toast.success(`Grupo "${data.nome}" criado com sucesso!`)
      reset()
      setSelectedPermissions([])
      onGroupCreated() // Atualiza a lista de grupos na página pai
      setIsOpen(false) // Fecha o diálogo
    } catch (error: any) {
      toast.error("Erro ao criar grupo", { description: error.message })
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          setSelectedPermissions([])
          reset()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer fixed bottom-6 right-6 z-50 shadow-lg">
          Novo grupo
          <Plus className="h-6 w-6" />
          <span className="sr-only">Novo Grupo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para criar um novo grupo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleCreateGroup)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nome" className="text-right">
              Nome
            </Label>
            <div className="col-span-3">
              <Input id="nome" {...register("nome")} />
              {errors.nome && (
                <p className="text-sm text-red-500 mt-1">{errors.nome.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="permissoes" className="text-right pt-2">
              Permissões
            </Label>
            <div className="col-span-3">
              {selectedPermissions.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedPermissions.map((id) => {
                    const permission = permissions.find((p) => p.id === id)
                    if (!permission) return null
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {permission.nome}
                        <button
                          type="button"
                          aria-label={`Remover ${permission.nome}`}
                          className="rounded-full hover:bg-muted-foreground/20 transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                          onClick={() =>
                            setSelectedPermissions(
                              selectedPermissions.filter((pId) => pId !== id)
                            )
                          }
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
              <Popover
                open={isPermissionsPopoverOpen}
                onOpenChange={setIsPermissionsPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPermissionsPopoverOpen}
                    className="w-full justify-between"
                    disabled={isLoadingPermissions}
                  >
                    {isLoadingPermissions ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Carregando...</span>
                      </div>
                    ) : (
                      <span className="truncate">
                        {selectedPermissions.length > 0
                          ? `${selectedPermissions.length} permiss${selectedPermissions.length > 1 ? "ões" : "ão"} selecionada${selectedPermissions.length > 1 ? "s" : ""}`
                          : "Selecione as permissões..."}
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Buscar permissão..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>Nenhuma permissão encontrada.</CommandEmpty>
                      <CommandGroup>
                        {permissions.map((permission) => (
                          <CommandItem
                            key={permission.id}
                            value={permission.nome}
                            onSelect={() => {
                              const isSelected = selectedPermissions.includes(permission.id)
                              if (isSelected) {
                                setSelectedPermissions(selectedPermissions.filter((id) => id !== permission.id))
                              } else {
                                setSelectedPermissions([...selectedPermissions, permission.id])
                              }
                            }}
                          >
                            {permission.nome}
                            <Check
                              className={cn("ml-auto h-4 w-4", selectedPermissions.includes(permission.id) ? "opacity-100" : "opacity-0")}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isSubmitting ? "Criando..." : "Criar Grupo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}