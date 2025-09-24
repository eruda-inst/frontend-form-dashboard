"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Cookies from "js-cookie"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react"
import type { CheckedState } from "@radix-ui/react-checkbox"

import { useMenubar } from "@/components/menubar-context"
import { useNavigation } from "@/components/navigation-provider"
import { useFormWebSocket } from "@/app/hooks/useFormWebSocket"
import { MenubarMenuData } from "@/app/types/menubar"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

interface FormPermission {
  id: string
  formulario_id: string
  grupo_id: string
  grupo_nome: string
  pode_ver: boolean
  pode_editar: boolean
  pode_apagar: boolean
}

interface GroupOption {
  id: string
  nome: string
}

type PermissionField = "pode_ver" | "pode_editar" | "pode_apagar"

type NewPermissionState = {
  pode_ver: boolean
  pode_editar: boolean
  pode_apagar: boolean
}

const INITIAL_NEW_PERMISSION: NewPermissionState = {
  pode_ver: true,
  pode_editar: false,
  pode_apagar: false,
}

export default function FormPermissionsPage() {
  const params = useParams()
  const router = useRouter()
  const formularioId = params.id as string

  const { setMenubarData } = useMenubar()
  const { setPageBreadcrumbs } = useNavigation()

  const accessToken = Cookies.get("access_token") || null
  const { form, isLoading: isLoadingForm, error: formError } = useFormWebSocket(
    formularioId,
    accessToken,
  )

  const [permissions, setPermissions] = useState<FormPermission[]>([])
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true)
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [isGroupPopoverOpen, setIsGroupPopoverOpen] = useState(false)
  const [newPermissionState, setNewPermissionState] = useState<NewPermissionState>(
    INITIAL_NEW_PERMISSION,
  )
  const [updatingGroupIds, setUpdatingGroupIds] = useState<string[]>([])
  const [isAddingPermission, setIsAddingPermission] = useState(false)

  useEffect(() => {
    const menubarData: MenubarMenuData[] = [
      {
        trigger: "Configurações",
        content: [
          {
            label: "Gestão de Questões",
            onClick: () => router.push(`/formularios/${formularioId}/edit-questions`),
          },
          {
            label: "Operabilidades",
            onClick: () => router.push(`/formularios/${formularioId}/operabilities`),
          },
          {
            label: "Permissões",
            onClick: () => router.push(`/formularios/${formularioId}/permissions`),
          },
        ],
      },
      {
        trigger: "Respostas",
        content: [
          {
            label: "Visualizar",
            onClick: () => router.push(`/formularios/${formularioId}/visualizar-respostas`),
          },
          {
            label: "Exportar",
            onClick: () => router.push(`/formularios/${formularioId}/export`),
          },
        ],
      },
    ]

    setMenubarData(menubarData)

    return () => {
      setMenubarData([])
    }
  }, [formularioId, router, setMenubarData])

  useEffect(() => {
    if (!form) return

    const formTitle =
      form.titulo.length > 20
        ? `${form.titulo.substring(0, 20)}...`
        : form.titulo

    setPageBreadcrumbs([
      { title: formTitle, url: `/formularios/${formularioId}` },
      { title: "Permissões" },
    ])
  }, [form, formularioId, setPageBreadcrumbs])

  const markGroupAsUpdating = (groupId: string) => {
    setUpdatingGroupIds((prev) =>
      prev.includes(groupId) ? prev : [...prev, groupId],
    )
  }

  const unmarkGroupAsUpdating = (groupId: string) => {
    setUpdatingGroupIds((prev) => prev.filter((id) => id !== groupId))
  }

  const fetchPermissions = useCallback(async () => {
    if (!formularioId) {
      setIsLoadingPermissions(false)
      return
    }

    if (!API_BASE_URL) {
      toast.error("Configuração da API não encontrada.")
      setIsLoadingPermissions(false)
      return
    }

    setIsLoadingPermissions(true)
    const token = Cookies.get("access_token")

    if (!token) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      setIsLoadingPermissions(false)
      return
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/permissoes/${formularioId}/acl`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(
          errorData?.detail || "Falha ao carregar permissões do formulário.",
        )
      }

      const data: FormPermission[] = await res.json()
      setPermissions(data)
    } catch (error: any) {
      toast.error("Erro ao carregar permissões", {
        description: error.message,
      })
    } finally {
      setIsLoadingPermissions(false)
    }
  }, [formularioId, router])

  const fetchGroups = useCallback(async () => {
    if (!API_BASE_URL) {
      toast.error("Configuração da API não encontrada.")
      setIsLoadingGroups(false)
      return
    }

    setIsLoadingGroups(true)
    const token = Cookies.get("access_token")

    if (!token) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      setIsLoadingGroups(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/grupos/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.detail || "Falha ao buscar grupos.")
      }

      const data = (await res.json()) as Array<{ id: string; nome: string }>
      setGroups(data.map((group) => ({ id: group.id, nome: group.nome })))
    } catch (error: any) {
      toast.error("Erro ao carregar grupos", {
        description: error.message,
      })
    } finally {
      setIsLoadingGroups(false)
    }
  }, [router])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const unassignedGroups = useMemo(() => {
    const assignedIds = new Set(permissions.map((permission) => permission.grupo_id))
    return groups.filter((group) => !assignedIds.has(group.id))
  }, [groups, permissions])

  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) return null
    return groups.find((group) => group.id === selectedGroupId) ?? null
  }, [groups, selectedGroupId])

  const sortedPermissions = useMemo(
    () =>
      [...permissions].sort((a, b) =>
        a.grupo_nome.localeCompare(b.grupo_nome, "pt-BR"),
      ),
    [permissions],
  )

  const updatePermission = useCallback(
    async (permission: FormPermission, field: PermissionField, value: boolean) => {
      if (!API_BASE_URL) {
        toast.error("Configuração da API não encontrada.")
        return
      }

      markGroupAsUpdating(permission.grupo_id)
      setPermissions((prev) =>
        prev.map((item) =>
          item.grupo_id === permission.grupo_id
            ? { ...item, [field]: value }
            : item,
        ),
      )

      const token = Cookies.get("access_token")
      if (!token) {
        toast.error("Sessão expirada. Por favor, faça login novamente.")
        router.push("/login")
        setPermissions((prev) =>
          prev.map((item) =>
            item.grupo_id === permission.grupo_id ? permission : item,
          ),
        )
        unmarkGroupAsUpdating(permission.grupo_id)
        return
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/permissoes/${formularioId}/acl`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              grupo_id: permission.grupo_id,
              grupo_nome: permission.grupo_nome,
              pode_ver: field === "pode_ver" ? value : permission.pode_ver,
              pode_editar:
                field === "pode_editar" ? value : permission.pode_editar,
              pode_apagar:
                field === "pode_apagar" ? value : permission.pode_apagar,
            }),
          },
        )

        if (!res.ok) {
          const errorData = await res.json().catch(() => null)
          throw new Error(
            errorData?.detail || "Falha ao atualizar permissão do grupo.",
          )
        }

        const updatedPermission: FormPermission = await res.json()
        setPermissions((prev) =>
          prev.map((item) =>
            item.grupo_id === updatedPermission.grupo_id
              ? updatedPermission
              : item,
          ),
        )
        toast.success(`Permissões de ${updatedPermission.grupo_nome} atualizadas.`)
      } catch (error: any) {
        toast.error("Não foi possível atualizar a permissão", {
          description: error.message,
        })
        setPermissions((prev) =>
          prev.map((item) =>
            item.grupo_id === permission.grupo_id ? permission : item,
          ),
        )
      } finally {
        unmarkGroupAsUpdating(permission.grupo_id)
      }
    },
    [formularioId, router],
  )

  const handlePermissionToggle = (
    permission: FormPermission,
    field: PermissionField,
    state: CheckedState,
  ) => {
    if (state === "indeterminate") return
    updatePermission(permission, field, state)
  }

  const handleNewPermissionChange = (
    field: PermissionField,
    state: CheckedState,
  ) => {
    if (state === "indeterminate") return
    setNewPermissionState((prev) => ({ ...prev, [field]: state }))
  }

  const handleAddPermission = async () => {
    if (!selectedGroupId) {
      toast.warning("Selecione um grupo para adicionar permissões.")
      return
    }

    if (!API_BASE_URL) {
      toast.error("Configuração da API não encontrada.")
      return
    }

    const selected = selectedGroup
    if (!selected) return

    const token = Cookies.get("access_token")
    if (!token) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      return
    }

    setIsAddingPermission(true)

    try {
      const res = await fetch(
        `${API_BASE_URL}/permissoes/${formularioId}/acl`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            grupo_id: selected.id,
            grupo_nome: selected.nome,
            pode_ver: newPermissionState.pode_ver,
            pode_editar: newPermissionState.pode_editar,
            pode_apagar: newPermissionState.pode_apagar,
          }),
        },
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(
          errorData?.detail || "Falha ao adicionar permissões para o grupo.",
        )
      }

      const createdPermission: FormPermission = await res.json()
      setPermissions((prev) => [...prev, createdPermission])
      setSelectedGroupId(null)
      setNewPermissionState(INITIAL_NEW_PERMISSION)
      setIsGroupPopoverOpen(false)
      toast.success(`Grupo ${selected.nome} adicionado às permissões.`)
    } catch (error: any) {
      toast.error("Não foi possível adicionar o grupo", {
        description: error.message,
      })
    } finally {
      setIsAddingPermission(false)
    }
  }

  if (isLoadingForm) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>Carregando formulário...</span>
      </div>
    )
  }

  if (formError) {
    return <div className="p-4 text-center text-red-500">Erro: {formError}</div>
  }

  if (!form) {
    return <div className="p-4 text-center">Formulário não encontrado.</div>
  }

  return (
    <>
      <div className="w-full border-b py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl tracking-tight">{form.titulo}</h1>
          <p className="text-lg text-muted-foreground mt-2">{form.descricao}</p>
          <p className="text-sm text-muted-foreground">
            Criado em: {new Date(form.criado_em).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Permissões por grupo</CardTitle>
            <CardDescription>
              Defina quais grupos podem visualizar, editar ou remover dados deste formulário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPermissions ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span>Carregando permissões...</span>
              </div>
            ) : permissions.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">
                  Nenhum grupo possui permissões configuradas para este formulário.
                </p>
                <p className="text-sm text-muted-foreground">
                  Utilize a seção abaixo para adicionar grupos com acesso.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-full">Grupo</TableHead>
                    <TableHead className="w-[140px] text-center">Pode ver</TableHead>
                    <TableHead className="w-[140px] text-center">Pode editar</TableHead>
                    <TableHead className="w-[140px] text-center">Pode apagar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPermissions.map((permission) => {
                    const isUpdating = updatingGroupIds.includes(permission.grupo_id)
                    return (
                      <TableRow key={permission.grupo_id}>
                        <TableCell className="font-medium">
                          {permission.grupo_nome}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.pode_ver}
                            onCheckedChange={(state) =>
                              handlePermissionToggle(permission, "pode_ver", state)
                            }
                            disabled={isUpdating}
                            aria-label={`Permitir visualização para ${permission.grupo_nome}`}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.pode_editar}
                            onCheckedChange={(state) =>
                              handlePermissionToggle(permission, "pode_editar", state)
                            }
                            disabled={isUpdating}
                            aria-label={`Permitir edição para ${permission.grupo_nome}`}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.pode_apagar}
                            onCheckedChange={(state) =>
                              handlePermissionToggle(permission, "pode_apagar", state)
                            }
                            disabled={isUpdating}
                            aria-label={`Permitir exclusão para ${permission.grupo_nome}`}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adicionar grupo</CardTitle>
            <CardDescription>
              Escolha um grupo e defina as permissões iniciais. Você pode ajustar depois na tabela acima.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Popover
                open={isGroupPopoverOpen}
                onOpenChange={(open) => setIsGroupPopoverOpen(open)}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between sm:w-[320px]"
                    disabled={isLoadingGroups || unassignedGroups.length === 0}
                  >
                    {isLoadingGroups ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Carregando grupos...
                      </span>
                    ) : selectedGroup ? (
                      selectedGroup.nome
                    ) : unassignedGroups.length === 0 ? (
                      "Todos os grupos já possuem permissões"
                    ) : (
                      "Selecione um grupo"
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 sm:w-[320px]">
                  <Command>
                    <CommandInput placeholder="Buscar grupo..." />
                    <CommandList>
                      <CommandEmpty>Nenhum grupo encontrado.</CommandEmpty>
                      <CommandGroup>
                        {unassignedGroups.map((group) => (
                          <CommandItem
                            key={group.id}
                            value={group.id}
                            onSelect={(value) => {
                              setSelectedGroupId((current) =>
                                current === value ? null : value,
                              )
                              setIsGroupPopoverOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedGroupId === group.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {group.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="flex flex-1 flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={newPermissionState.pode_ver}
                    onCheckedChange={(state) =>
                      handleNewPermissionChange("pode_ver", state)
                    }
                  />
                  Pode ver
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={newPermissionState.pode_editar}
                    onCheckedChange={(state) =>
                      handleNewPermissionChange("pode_editar", state)
                    }
                  />
                  Pode editar
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={newPermissionState.pode_apagar}
                    onCheckedChange={(state) =>
                      handleNewPermissionChange("pode_apagar", state)
                    }
                  />
                  Pode apagar
                </label>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleAddPermission}
              disabled={!selectedGroupId || isAddingPermission}
            >
              {isAddingPermission ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar grupo
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
