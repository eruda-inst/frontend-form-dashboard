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

  useEffect(() => {
    const accessToken = Cookies.get("access_token")

    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      setIsLoading(false)
      return
    }

    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL
    if (!wsBaseUrl) {
      console.error("A variável de ambiente NEXT_PUBLIC_WS_URL não está definida.")
      toast.error("Erro de configuração: URL do WebSocket não definida.")
      setIsLoading(false)
      return
    }

    const wsUrl = `${wsBaseUrl}/ws/formularios/?access_token=${accessToken}`
    const socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      setIsLoading(false)
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        // Assuming the message directly contains the array of forms
        if (Array.isArray(data)) {
          setForms(data)
        } else if (data.tipo === "initial_forms" && Array.isArray(data.conteudo)) {
          // If the message is structured with a type and content
          setForms(data.conteudo);
        } else if (data.tipo === "form_updated" && data.conteudo) {
          // Handle individual form updates
          setForms(prevForms => {
            const existingFormIndex = prevForms.findIndex(f => f.id === data.conteudo.id);
            if (existingFormIndex > -1) {
              const updatedForms = [...prevForms];
              updatedForms[existingFormIndex] = data.conteudo;
              return updatedForms;
            } else {
              return [...prevForms, data.conteudo]; // Add new form
            }
          });
        } else if (data.tipo === "form_deleted" && data.conteudo && data.conteudo.id) {
          // Handle form deletion
          setForms(prevForms => prevForms.filter(f => f.id !== data.conteudo.id));
        }
      } catch (e) {
        console.error("Erro ao processar mensagem WebSocket:", e)
        toast.error("Falha ao processar dados recebidos do servidor.")
      }
    }

    socket.onerror = (event) => {
      console.error("WebSocket erro:", event)
      toast.error("Erro na conexão com o servidor de formulários.")
      setIsLoading(false)
    }

    socket.onclose = () => {
      console.log("WebSocket desconectado.")
      // Optionally try to reconnect or show a message
    }

    return () => {
      socket.close()
    }
  }, [router])

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
            <CreateFormDialog onFormCreated={() => toast.success("Formulário criado com sucesso!")} /> 
    </div>
  )
}
