"use client"
import { Badge } from "@/components/ui/badge"

import { useState, useEffect, useCallback } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"

import { CreateGroupDialog } from "@/components/create-group-dialog"
import { EditGroupDialog } from "@/components/edit-group-dialog"

// Definindo o tipo para um usuário, baseado na sua resposta da API
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
export default function GroupsPage() {
  const router = useRouter()

  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)

  const fetchGroups = useCallback(async () => {
    setIsLoadingGroups(true)
    const accessToken = Cookies.get("access_token")

    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grupos/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!res.ok) {
        throw new Error("Falha ao buscar grupos.")
      }

      const data: Group[] = await res.json()
      setGroups(data)
    } catch (error: any) {
      toast.error("Erro ao carregar grupos", {
        description: error.message,
      })
    } finally {
      setIsLoadingGroups(false)
    }
  }, [router])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  if (isLoadingGroups) {
    return <div className="text-center">Carregando grupos...</div>
  }

  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {groups.map((group) => (
        <EditGroupDialog key={group.id} group={group} onGroupUpdated={fetchGroups}>
          <Card className="cursor-pointer transition-transform duration-300 ease-in-out hover:scale-101">
            <CardHeader>
              <CardTitle>{group.nome}</CardTitle>
              <CardDescription>
                {group.permissoes.length} permissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {group.permissoes.map((permission) => (
                  <Badge key={permission.id} variant="secondary">
                    {permission.nome}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </EditGroupDialog>
      ))}
      <CreateGroupDialog onGroupCreated={fetchGroups} />
    </div>
  )
}