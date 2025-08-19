"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { toast } from "sonner"
import { Plus, Loader2, X } from "lucide-react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Checkbox } from "@/components/ui/checkbox"
import type { Pergunta, TipoPergunta } from "@/app/types/forms"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const createFormSchema = z.object({
  titulo: z.string().min(1, { message: "O título não pode estar em branco." }),
  descricao: z
    .string()
    .min(1, { message: "A descrição não pode estar em branco." }),
})

type CreateFormValues = z.infer<typeof createFormSchema>

interface CreateFormDialogProps {
  onFormCreated: () => void
}

export function CreateFormDialog({ onFormCreated }: CreateFormDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [createdFormId, setCreatedFormId] = useState<string | null>(null)
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [novaPerguntaTexto, setNovaPerguntaTexto] = useState("")
  const [isFinishing, setIsFinishing] = useState(false)
  const [novaPerguntaObrigatoria, setNovaPerguntaObrigatoria] = useState(true)
  const [tiposPergunta, setTiposPergunta] = useState<
    { value: string; label: string }[]
  >([])
  const [isLoadingTipos, setIsLoadingTipos] = useState(true)
  const [novaPerguntaTipo, setNovaPerguntaTipo] = useState<TipoPergunta>("texto_simples")
  const [novaAlternativa, setNovaAlternativa] = useState<{
    [key: string]: string
  }>({})
  const [npsEscala, setNpsEscala] = useState({ min: 0, max: 10 })

  const ws = useRef<WebSocket | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    getValues,
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
  })

  useEffect(() => {
    if (step === 2 && createdFormId && !ws.current) {
      const accessToken = Cookies.get("access_token")
      if (!accessToken) {
        toast.error("Sessão expirada. Por favor, faça login novamente.")
        router.push("/login")
        return
      }

      const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL
      console.log("CreateFormDialog: Lendo NEXT_PUBLIC_WS_URL do ambiente:", wsBaseUrl);
      if (!wsBaseUrl) {
        console.error("A variável de ambiente NEXT_PUBLIC_WS_URL não está definida.")
        toast.error("Erro de configuração", {
          description: "A URL do WebSocket não foi configurada corretamente.",
        })
        return
      }

      // Para autenticar a conexão WebSocket, o token é enviado como um query parameter.
      // O navegador não enviará o cookie 'access_token' de localhost para um domínio diferente (IP).
      const wsUrl = `${wsBaseUrl}/ws/formularios/${createdFormId}?access_token=${accessToken}`
      console.log("CreateFormDialog: Tentando conectar a:", wsUrl);
      const socket = new WebSocket(wsUrl)

      socket.onopen = () => {
        console.log("WebSocket conectado.")
        // A autenticação é feita via token na URL.
        toast.info("Conectado para edição em tempo real.")
      }
      socket.onclose = () => {
        console.log("WebSocket desconectado.")
      }
      socket.onerror = (error) => {
        console.error("WebSocket erro:", error)
        toast.error("Erro na conexão em tempo real.")
      }

      ws.current = socket

      return () => {
        ws.current?.close()
        ws.current = null
      }
    }
  }, [step, createdFormId, router])

  const fetchTiposPergunta = useCallback(async () => {
    setIsLoadingTipos(true)
    try {
      const accessToken = Cookies.get("access_token")
      if (!accessToken) {
        toast.error("Sessão expirada.")
        router.push("/login")
        return
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/formularios/tipos-perguntas/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      if (!res.ok) {
        throw new Error("Falha ao buscar os tipos de pergunta.")
      }
      const data = await res.json()
      setTiposPergunta(data)
    } catch (error) {
      let description = "Ocorreu um erro desconhecido."
      if (error instanceof Error) {
        description = error.message
      }
      toast.error("Erro ao carregar tipos de pergunta", { description })
    } finally {
      setIsLoadingTipos(false)
    }
  }, [router])

  useEffect(() => {
    if (isOpen) fetchTiposPergunta()
  }, [isOpen, fetchTiposPergunta])

  const handleAddPergunta = () => {
    if (!novaPerguntaTexto.trim()) {
      toast.warning("O texto da pergunta não pode estar em branco.")
      return
    }

    let newQuestion: Pergunta
    if (
      novaPerguntaTipo === "caixa_selecao" ||
      novaPerguntaTipo === "multipla_escolha"
    ) {
      newQuestion = {
        id: `temp-${Date.now()}`,
        pergunta: novaPerguntaTexto,
        tipo: novaPerguntaTipo,
        obrigatoria: novaPerguntaObrigatoria,
        opcoes: [],
      }
    } else if (novaPerguntaTipo === "nps") {
      newQuestion = {
        id: `temp-${Date.now()}`,
        pergunta: novaPerguntaTexto,
        tipo: novaPerguntaTipo,
        obrigatoria: novaPerguntaObrigatoria,
        escala_min: npsEscala.min,
        escala_max: npsEscala.max,
      }
    } else {
      newQuestion = {
        id: `temp-${Date.now()}`,
        pergunta: novaPerguntaTexto,
        tipo: novaPerguntaTipo,
        obrigatoria: novaPerguntaObrigatoria,
      }
    }

    setPerguntas([...perguntas, newQuestion])
    setNovaPerguntaTexto("")
  }

  const handleRemovePergunta = (perguntaId: string) => {
    setPerguntas(perguntas.filter((p) => p.id !== perguntaId))
  }

  const handleAddAlternativa = (perguntaId: string) => {
    const alternativaText = novaAlternativa[perguntaId]?.trim()
    if (!alternativaText) {
      toast.warning("O texto da alternativa não pode estar em branco.")
      return
    }

    setPerguntas(
      perguntas.map((p) => {
        if (p.id === perguntaId && "opcoes" in p) {
          return {
            ...p,
            opcoes: [...p.opcoes, { texto: alternativaText }],
          }
        }
        return p
      })
    )
    setNovaAlternativa((prev) => ({ ...prev, [perguntaId]: "" }))
  }

  const handleRemoveAlternativa = (perguntaId: string, indexToRemove: number) => {
    setPerguntas(
      perguntas.map((p) => {
        if (p.id === perguntaId && "opcoes" in p) {
          const novasOpcoes = p.opcoes.filter(
            (_, index: number) => index !== indexToRemove
          )
          return { ...p, opcoes: novasOpcoes }
        }
        return p
      })
    )
  }

  const handleCreateForm = async (data: CreateFormValues) => {
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
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...data,
            perguntas: [], // Na primeira etapa, sempre enviamos perguntas vazias
          }),
        }
      )

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Falha ao criar o formulário.")
      }

      const newForm = await res.json()
      setCreatedFormId(newForm.id)
      setStep(2) // Avança para a etapa de adicionar perguntas

      toast.success(`Formulário "${data.titulo}" criado!`, {
        description: "Agora adicione as perguntas.",
      })
    } catch (error) {
      let description = "Ocorreu um erro desconhecido."
      if (error instanceof Error) {
        description = error.message
      }
      toast.error("Erro ao criar formulário", { description })
    }
  }

  const handleFinish = async () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      toast.error("A conexão para edição não está ativa. Tente novamente.")
      return
    }

    setIsFinishing(true)

    try {
      const payload = {
        tipo: "update_formulario",
        conteudo: {
          titulo: getValues("titulo"),
          descricao: getValues("descricao"),
          perguntas_adicionadas: perguntas.map((p, index) => {
            const baseQuestion = {
              texto: p.pergunta,
              tipo: p.tipo,
              obrigatoria: p.obrigatoria,
              ordem_exibicao: index + 1,
            }
            if (p.tipo === "nps") {
              return { ...baseQuestion, escala_min: p.escala_min, escala_max: p.escala_max }
            }
            if ("opcoes" in p) {
              return { ...baseQuestion, opcoes: p.opcoes }
            }
            return baseQuestion
          }),
        },
      }

      ws.current.send(JSON.stringify(payload))

      toast.success("Alterações enviadas com sucesso!")
      onFormCreated()
      setIsOpen(false)
    } catch (error) {
      let description = "Ocorreu um erro desconhecido."
      if (error instanceof Error) {
        description = error.message
      }
      toast.error("Erro ao finalizar", { description })
    } finally {
      setIsFinishing(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          setPerguntas([])
          setStep(1)
          setCreatedFormId(null)
          reset()
          ws.current?.close()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-6 z-50 cursor-pointer shadow-lg">
          Novo formulário
          <Plus className="h-6 w-6" />
          <span className="sr-only">Novo Formulário</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Formulário</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para criar um novo formulário.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <form onSubmit={handleSubmit(handleCreateForm)} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" placeholder="Ex: Pesquisa de Satisfação" {...register("titulo")} />
              {errors.titulo && (<p className="mt-1 text-sm text-red-500">{errors.titulo.message}</p>)}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o objetivo deste formulário."
                {...register("descricao")}
              />
              {errors.descricao && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.descricao.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar e adicionar perguntas
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 2 && (
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="font-medium text-lg">Perguntas</h3>
              </div>

              {/* Lista de perguntas adicionadas */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {perguntas.map((pergunta, index) => (
                  <div key={pergunta.id} className="p-3 border rounded-lg space-y-3 bg-muted/50">
                    <div className="flex justify-between items-start">
                      <Label className="font-normal text-base">
                        {index + 1}. {pergunta.pergunta}
                      </Label>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleRemovePergunta(pergunta.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {"opcoes" in pergunta && (
                      <div className="pl-4 space-y-2">
                        {pergunta.opcoes.map((opcao, opIndex: number) => (
                          <div key={opIndex} className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-normal">{opcao.texto}</Badge>
                            <button type="button" onClick={() => handleRemoveAlternativa(pergunta.id, opIndex)} className="text-muted-foreground hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <div className="flex">
                          <Input className="rounded-r-none h-8" type="text" placeholder="Nova alternativa" value={novaAlternativa[pergunta.id] || ""} onChange={(e) => setNovaAlternativa((prev) => ({ ...prev, [pergunta.id]: e.target.value, }))} onKeyDown={(e) => e.key === "Enter" && handleAddAlternativa(pergunta.id)} />
                          <Button type="button" className="cursor-pointer border-l-0 rounded-l-none h-8" variant={"outline"} onClick={() => handleAddAlternativa(pergunta.id)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-end gap-2">
                  <div className="grid gap-1.5 flex-1">
                    <Label htmlFor="nova-pergunta">Texto da Pergunta</Label>
                    <Input id="nova-pergunta" type="text" placeholder="Ex: Qual sua cor favorita?" value={novaPerguntaTexto} onChange={(e) => setNovaPerguntaTexto(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddPergunta()} />
                  </div>
                  <div className="flex items-center gap-2 pb-2">
                    <Checkbox id="obrigatoria" checked={novaPerguntaObrigatoria} onCheckedChange={(checked) => setNovaPerguntaObrigatoria(Boolean(checked))} />
                    <Label htmlFor="obrigatoria" className="font-normal">Obrigatória</Label>
                  </div>
                </div>

                {novaPerguntaTipo === 'nps' && (
                  <div className="flex items-end gap-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor="nps-min">Escala Mínima</Label>
                      <Input
                        id="nps-min"
                        type="number"
                        value={npsEscala.min}
                        onChange={(e) => setNpsEscala(prev => ({ ...prev, min: Number(e.target.value) }))}
                        className="w-28"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="nps-max">Escala Máxima</Label>
                      <Input
                        id="nps-max"
                        type="number"
                        value={npsEscala.max}
                        onChange={(e) => setNpsEscala(prev => ({ ...prev, max: Number(e.target.value) }))}
                        className="w-28"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2">
                <div className="grid gap-1.5">
                  <Label>Tipo</Label>
                  <Select value={novaPerguntaTipo} onValueChange={(value: TipoPergunta) => setNovaPerguntaTipo(value)}>
                    <SelectTrigger className="w-[180px]" disabled={isLoadingTipos}>
                      <SelectValue placeholder={isLoadingTipos ? "Carregando..." : "Tipo de pergunta"} />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposPergunta.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (char) =>
                              char.toUpperCase()
                            )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={handleAddPergunta}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar
                </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleFinish} disabled={isFinishing}>
                {isFinishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finalizar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}