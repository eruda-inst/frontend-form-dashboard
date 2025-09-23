"use client"

import { useState, useEffect, useCallback } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

import { toast } from "sonner"

import { CreateUserDialog } from "@/components/create-user-dialog"
import { UsersList } from "@/components/users/users-list"

// Definindo o tipo para um usuário, baseado na sua resposta da API
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

export default function UsersPage() {
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [deactivatingUserId, setDeactivatingUserId] = useState<string | null>(
    null
  )
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [updatingPasswordUserId, setUpdatingPasswordUserId] = useState<
    string | null
  >(null)

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    setIsLoadingUsers(true)
      const accessToken = Cookies.get("access_token")

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
        signal, // Passa o AbortSignal para o fetch
      })

      if (!res.ok) {
        throw new Error("Falha ao buscar usuários.")
      }

      const data: User[] = await res.json()
      setUsers(data)
    } catch (error: any) {
      if (error.name === "AbortError") {
        
        return // Não mostra toast se a requisição foi abortada
      }
      toast.error("Erro ao carregar usuários", {
        description: error.message,
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }, [router])

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    fetchUsers(signal)

    return () => {
      // Cancela a requisição quando o componente é desmontado
      controller.abort()
    }
  }, [fetchUsers])

  const handleUserCreated = () => {
    fetchUsers()
  }

  const handleChangePassword = async (userId: string) => {
    if (!newPassword.trim()) {
      toast.warning("A nova senha não pode estar em branco.")
      return
    }
    setUpdatingPasswordUserId(userId)
    const accessToken = Cookies.get("access_token")

    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      setUpdatingPasswordUserId(null)
      return
    }

    try {
      // A API está sendo chamada para uma atualização parcial (PATCH apenas com a senha).
      // Isso é mais seguro e eficiente do que enviar todos os dados do usuário.
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
      setUpdatingPasswordUserId(null) // Reseta o estado de carregamento
    }
  }

  const handleDeactivateUser = async (userToDeactivate: User) => {
    setDeactivatingUserId(userToDeactivate.id)
    const accessToken = Cookies.get("access_token")

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
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
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
      <UsersList
        users={users}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        updatingPasswordUserId={updatingPasswordUserId}
        handleChangePassword={handleChangePassword}
        deactivatingUserId={deactivatingUserId}
        deleteConfirmation={deleteConfirmation}
        setDeleteConfirmation={setDeleteConfirmation}
        handleDeactivateUser={handleDeactivateUser}
      />
      <CreateUserDialog onUserCreated={handleUserCreated} />
    </>
  )
}
