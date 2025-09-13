"use client"
import { useState, useEffect } from "react"
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

export default function Page() {
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
      toast.error("Erro de configuração: URL do WebSocket não definida.")
      setIsLoading(false)
      return
    }

    const wsUrl = `${wsBaseUrl}/ws/formularios/?access_token=${accessToken}`
    const socket = new WebSocket(wsUrl)

    

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        

        if (data.tipo === "lista_inicial" && data.conteudo && Array.isArray(data.conteudo.itens)) {
          setForms(data.conteudo.itens);
          setIsLoading(false);
        } else if (data.tipo === "form_updated" && data.conteudo) {
          setForms(prevForms => {
            const existingFormIndex = prevForms.findIndex(f => f.id === data.conteudo.id);
            if (existingFormIndex > -1) {
              const updatedForms = [...prevForms];
              updatedForms[existingFormIndex] = data.conteudo;
              return updatedForms;
            } else {
              return [...prevForms, data.conteudo];
            }
          });
        } else if (data.tipo === "form_deleted" && data.conteudo && data.conteudo.id) {
          setForms(prevForms => prevForms.filter(f => f.id !== data.conteudo.id));
        }
      } catch (e) {
        
      }
    }

    

    

    return () => {
      socket.close()
    }
  }, [router])

  const handleFormCreated = (newForm: Form) => {
    toast.success("Formulário criado com sucesso!");
    setForms(prevForms => [...prevForms, newForm]);
  };

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
            onClick={() => router.push(`/formularios/${form.id}`)}
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
      <CreateFormDialog onFormCreated={handleFormCreated} /> 
    </div>
  )
}
