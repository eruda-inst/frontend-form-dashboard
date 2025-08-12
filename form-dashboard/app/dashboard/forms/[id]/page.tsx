"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { toast } from "sonner"
import type { Form, Pergunta } from "@/app/types/forms"
import { useNavigation } from "@/components/navigation-provider"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

// Componente auxiliar para renderizar cada tipo de pergunta
const RenderQuestion = ({ pergunta }: { pergunta: Pergunta }) => {
  switch (pergunta.tipo) {
    case "texto-curto":
      return <Input placeholder="Resposta curta" disabled />
    case "texto-longo":
      return <Textarea placeholder="Resposta longa" disabled />
    case "data":
      return <Input type="date" disabled />
    case "numero":
      return <Input type="number" placeholder="0" disabled />
    case "multipla-escolha":
      if ("opcoes" in pergunta) {
        return (
          <RadioGroup disabled>
            {pergunta.opcoes.map((opcao, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={opcao} id={`${pergunta.id}-${index}`} />
                <Label htmlFor={`${pergunta.id}-${index}`} className="font-normal">
                  {opcao}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )
      }
      return null
    case "caixa-de-selecao":
      if ("opcoes" in pergunta) {
        return (
          <div className="space-y-2">
            {pergunta.opcoes.map((opcao, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox id={`${pergunta.id}-${index}`} disabled />
                <Label htmlFor={`${pergunta.id}-${index}`} className="font-normal">
                  {opcao}
                </Label>
              </div>
            ))}
          </div>
        )
      }
      return null
    case "lista-suspensa":
      if ("opcoes" in pergunta) {
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {pergunta.opcoes.map((opcao, index) => (
                <SelectItem key={index} value={opcao}>
                  {opcao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
      return null
    default:
      return (
        <p className="text-sm text-muted-foreground">
          Tipo de pergunta não suportado.
        </p>
      )
  }
}

export default function FormDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { setBreadcrumbs } = useNavigation()
  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const id = params.id as string

  const fetchForm = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    const accessToken = Cookies.get("accessToken")
    if (!accessToken) {
      toast.error("Sessão expirada.")
      router.push("/login")
      return
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/formularios/${id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Falha ao buscar o formulário.")
      }
      const data: Form = await res.json()
      setForm(data)
    } catch (err: any) {
      setError(err.message)
      toast.error("Erro ao carregar formulário", { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchForm()
  }, [fetchForm])

  useEffect(() => {
    if (form) {
      setBreadcrumbs([
        { title: "Formulários", url: "/dashboard" },
        { title: form.titulo },
      ])
    }
    return () => {
      setBreadcrumbs([{ title: "Formulários" }])
    }
  }, [form, setBreadcrumbs])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>Carregando formulário...</span>
      </div>
    )
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Erro: {error}</div>
  }

  if (!form) {
    return <div className="p-4 text-center">Formulário não encontrado.</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="p-0">
        <CardHeader className="border-b bg-muted/30 p-6">
          <CardTitle className="text-2xl">{form.titulo}</CardTitle>
          <CardDescription className="text-base">
            {form.descricao}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Criado em: {new Date(form.criado_em).toLocaleDateString("pt-BR")}
          </p>
        </CardContent>
      </Card>

      {form.perguntas.length > 0 ? (
        form.perguntas.map((pergunta, index) => (
          <Card key={pergunta.id}>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                {index + 1}. {pergunta.pergunta}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RenderQuestion pergunta={pergunta} />
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Este formulário ainda não possui perguntas.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

