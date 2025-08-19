"use client"
import { useState, useEffect, useCallback } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { CreateFormDialog } from "@/components/create-form-dialog"
import type { Form } from "@/app/types/forms"

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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/formularios/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

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
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>Carregando formulários...</span>
      </div>
    )
  }

  return (
    <div className="grid auto-rows-min gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {forms.length > 0 ? (
        forms.map((form) => (
          <Card
            key={form.id}
            className="cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105"
            onClick={() => router.push(`/dashboard/forms/${form.id}`)}
          >
            <CardHeader>
              <CardTitle className="truncate">{form.titulo}</CardTitle>
              <CardDescription className="truncate">
                {form.descricao}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between text-sm text-muted-foreground">
              <span>{form.perguntas.length} perguntas</span>
              <span>
                {new Date(form.criado_em).toLocaleDateString("pt-BR")}
              </span>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="col-span-full flex h-full min-h-[40vh] items-center justify-center rounded-xl border border-dashed">
          <p className="text-muted-foreground">
            Nenhum formulário encontrado.
          </p>
        </div>
      )}
      <CreateFormDialog onFormCreated={fetchForms} />
    </div>
  )
}
