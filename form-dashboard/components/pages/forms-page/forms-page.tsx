"use client"
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
import { CreateFormDialog } from "@/components/create-form-dialog";
import type { Form } from "@/app/types/forms";

export default function FormsPage() {
  const router = useRouter()

  const [forms, setForms] = useState<Form[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchForms = useCallback(async () => {
    setIsLoading(true)
    const accessToken = Cookies.get("access_token")

    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/formularios/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!res.ok) {
        throw new Error("Falha ao buscar formulários.")
      }

      const data: Form[] = await res.json()
      setForms(data)
    } catch (error: any) {
      toast.error("Erro ao carregar formulários", {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchForms()
  }, [fetchForms])

  if (isLoading) {
    return <div className="text-center">Carregando formulários...</div>
  }

  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {forms.map((form) => (
        <Card
          key={form.id}
          className="cursor-pointer transition-transform duration-300 ease-in-out hover:scale-101"
          onClick={() => router.push(`/dashboard/forms/${form.id}`)}
        >
          <CardHeader>
            <CardTitle className="truncate">{form.titulo}</CardTitle>
            <CardDescription className="truncate">{form.descricao}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between text-sm text-muted-foreground">
            <span>{form.perguntas.length} perguntas</span>
            <span>
              {new Date(form.criado_em).toLocaleDateString("pt-BR")}
            </span>
          </CardContent>
        </Card>
      ))}
      <CreateFormDialog onFormCreated={fetchForms} />
    </div>
  )
}