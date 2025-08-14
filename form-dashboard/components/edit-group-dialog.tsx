"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { toast } from "sonner"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type Permission = {
  id: string
  codigo: string
  nome: string
}

type Group = {
  id: string
  nome: string
  permissoes: Permission[]
}

interface EditGroupDialogProps {
  group: Group
  onGroupUpdated: () => void
  children: React.ReactNode
}

export function EditGroupDialog({
  group,
  onGroupUpdated,
  children,
}: EditGroupDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for permissions
  const [isPermissionsPopoverOpen, setIsPermissionsPopoverOpen] = useState(false)
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true)
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])

  const fetchPermissions = useCallback(async () => {
    setIsLoadingPermissions(true)
    const accessToken = Cookies.get("access_token")
    if (!accessToken) {
      toast.error("Sessão expirada.")
      router.push("/login")
      return
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/permissoes/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error("Falha ao buscar permissões.")
      const data: Permission[] = await res.json()
      setAllPermissions(data)
    } catch (error: any) {
      toast.error("Erro ao carregar permissões", {
        description: error.message,
      })
    } finally {
      setIsLoadingPermissions(false)
    }
  }, [router])

  // Initialize selected permissions when the dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPermissionIds(group.permissoes.map((p) => p.id))
      if (allPermissions.length === 0) {
        fetchPermissions()
      } else {
        setIsLoadingPermissions(false)
      }
    }
  }, [isOpen, group.permissoes, fetchPermissions, allPermissions.length])

  const handleUpdateGroup = async () => {
    setIsSubmitting(true)
    const accessToken = Cookies.get("access_token")
    if (!accessToken) {
      toast.error("Sessão expirada.")
      router.push("/login")
      return
    }

    try {
      const permissoesCodigos = allPermissions
        .filter((p) => selectedPermissionIds.includes(p.id))
        .map((p) => p.codigo)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/grupos/${group.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            nome: group.nome, // A API de PUT também espera o nome
            permissoes_codigos: permissoesCodigos,
          }),
        }
      )

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(
          errorData.detail || "Falha ao atualizar as permissões do grupo."
        )
      }

      toast.success(`Permissões do grupo "${group.nome}" atualizadas!`)
      onGroupUpdated()
      setIsOpen(false)
    } catch (error: any) {
      toast.error("Erro ao atualizar grupo", { description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar permissões de {group.nome}</DialogTitle>
          <DialogDescription>
            Selecione ou remova as permissões para este grupo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid items-start gap-4">
            <Label htmlFor="permissoes" className="pt-2">
              Permissões
            </Label>
            <div className="col-span-3">
              {selectedPermissionIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedPermissionIds.map((id) => {
                    const permission = allPermissions.find((p) => p.id === id)
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
                            setSelectedPermissionIds(
                              selectedPermissionIds.filter((pId) => pId !== id)
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
                        {selectedPermissionIds.length > 0
                          ? `${selectedPermissionIds.length} permiss${
                              selectedPermissionIds.length > 1 ? "ões" : "ão"
                            } selecionada${
                              selectedPermissionIds.length > 1 ? "s" : ""
                            }`
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
                        {allPermissions.map((permission) => (
                          <CommandItem
                            key={permission.id}
                            value={permission.nome}
                            onSelect={() => {
                              const isSelected = selectedPermissionIds.includes(
                                permission.id
                              )
                              if (isSelected) {
                                setSelectedPermissionIds(
                                  selectedPermissionIds.filter(
                                    (id) => id !== permission.id
                                  )
                                )
                              } else {
                                setSelectedPermissionIds([
                                  ...selectedPermissionIds,
                                  permission.id,
                                ])
                              }
                            }}
                          >
                            {permission.nome}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                selectedPermissionIds.includes(permission.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
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
        </div>
        <DialogFooter>
          <Button onClick={handleUpdateGroup} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
