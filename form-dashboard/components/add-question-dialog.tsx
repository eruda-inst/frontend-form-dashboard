"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { toast } from "sonner"
import { Plus, Loader2, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { Form, Pergunta, TipoPergunta } from "@/app/types/forms"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AddQuestionDialogProps {
  formId: string
  onQuestionAdded: (newQuestion: Pergunta) => void
}

export function AddQuestionDialog({
  formId,
  onQuestionAdded,
}: AddQuestionDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [novaPerguntaTexto, setNovaPerguntaTexto] = useState("")
  const [isFinishing, setIsFinishing] = useState(false)
  const [novaPerguntaObrigatoria, setNovaPerguntaObrigatoria] = useState(true)
  const [tiposPergunta, setTiposPergunta] = useState<
    { value: string; label: string }[]
  >([])
  const [isLoadingTipos, setIsLoadingTipos] = useState(true)
  const [novaPerguntaTipo, setNovaPerguntaTipo] =
    useState<TipoPergunta>("texto_simples")
  const [novaAlternativa, setNovaAlternativa] = useState<{
    [key: string]: string
  }>({})
  const [npsEscala, setNpsEscala] = useState({ min: 0, max: 10 })

  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (isOpen) {
      const accessToken = Cookies.get("access_token")
      if (!accessToken) {
        toast.error("Sessão expirada. Por favor, faça login novamente.")
        router.push("/login")
        return
      }

      const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL
      if (!wsBaseUrl) {
        toast.error("Erro de configuração: URL do WebSocket não definida.")
        return
      }

      const wsUrl = `${wsBaseUrl}/ws/formularios/${formId}?access_token=${accessToken}`
      const socket = new WebSocket(wsUrl)
      ws.current = socket

      socket.onopen = () => toast.info("Conectado para edição em tempo real.")

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.conteudo && Array.isArray(data.conteudo.perguntas)) {
          setPerguntas(data.conteudo.perguntas)
        } else if (data.conteudo) {
          setPerguntas(data.conteudo)
        }
      }

      
      

      return () => {
        if (ws.current) {
          ws.current.close()
          ws.current = null
        }
      }
    }
  }, [isOpen, formId, router])

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
      if (!res.ok) throw new Error("Falha ao buscar os tipos de pergunta.")
      const data = await res.json()
      setTiposPergunta(data)
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "Ocorreu um erro desconhecido."
      toast.error("Erro ao carregar tipos de pergunta", { description })
    } finally {
      setIsLoadingTipos(false)
    }
  }, [router])

  useEffect(() => {
    if (isOpen) fetchTiposPergunta()
  }, [isOpen, fetchTiposPergunta])

  const sendWebSocketMessage = (message: object) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      toast.error("A conexão para edição não está ativa.")
      return false
    }
    ws.current.send(JSON.stringify(message))
    return true
  }

  const handleAddPergunta = () => {
    if (!novaPerguntaTexto.trim()) {
      toast.warning("O texto da pergunta não pode estar em branco.")
      return
    }

    let newQuestionPayload: any = {
      texto: novaPerguntaTexto,
      tipo: novaPerguntaTipo,
      obrigatoria: novaPerguntaObrigatoria,
      ordem_exibicao: perguntas.length + 1,
    }

    if (
      novaPerguntaTipo === "caixa_selecao" ||
      novaPerguntaTipo === "multipla_escolha"
    ) {
      newQuestionPayload.opcoes = []
    } else if (novaPerguntaTipo === "nps") {
      newQuestionPayload.escala_min = npsEscala.min
      newQuestionPayload.escala_max = npsEscala.max
    }

    const message = {
      tipo: "update_formulario",
      conteudo: {
        perguntas_adicionadas: [newQuestionPayload],
      },
    }

    if (sendWebSocketMessage(message)) {
      setNovaPerguntaTexto("")
    }
  }

  const handleRemovePergunta = (perguntaId: string) => {
    const message = {
      tipo: "update_formulario",
      conteudo: {
        perguntas_removidas: [perguntaId],
      },
    }
    sendWebSocketMessage(message)
  }

  const handleAddAlternativa = (perguntaId: string) => {
    const alternativaText = novaAlternativa[perguntaId]?.trim()
    if (!alternativaText) {
      toast.warning("O texto da alternativa não pode estar em branco.")
      return
    }

    const perguntaToUpdate = perguntas.find((p) => p.id === perguntaId)
    if (perguntaToUpdate && "opcoes" in perguntaToUpdate) {
      const updatedOptions = [
        ...perguntaToUpdate.opcoes,
        { texto: alternativaText },
      ]

      const questionPayload = {
        id: perguntaToUpdate.id,
        texto: perguntaToUpdate.texto,
        tipo: perguntaToUpdate.tipo,
        obrigatoria: perguntaToUpdate.obrigatoria,
        ordem_exibicao: perguntas.findIndex((p) => p.id === perguntaId) + 1,
        opcoes: updatedOptions,
      }

      const message = {
        tipo: "update_formulario",
        conteudo: {
          perguntas_editadas: [questionPayload],
        },
      }
      if (sendWebSocketMessage(message)) {
        setNovaAlternativa((prev) => ({ ...prev, [perguntaId]: "" }))
      }
    }
  }

  const handleRemoveAlternativa = (
    perguntaId: string,
    indexToRemove: number
  ) => {
    const perguntaToUpdate = perguntas.find((p) => p.id === perguntaId)
    if (perguntaToUpdate && "opcoes" in perguntaToUpdate) {
      const updatedOptions = perguntaToUpdate.opcoes.filter(
        (_, index) => index !== indexToRemove
      )

      const questionPayload = {
        id: perguntaToUpdate.id,
        texto: perguntaToUpdate.texto,
        tipo: perguntaToUpdate.tipo,
        obrigatoria: perguntaToUpdate.obrigatoria,
        ordem_exibicao: perguntas.findIndex((p) => p.id === perguntaId) + 1,
        opcoes: updatedOptions,
      }

      const message = {
        tipo: "update_formulario",
        conteudo: {
          perguntas_editadas: [questionPayload],
        },
      }
      sendWebSocketMessage(message)
    }
  }

  const handleFinish = () => {
    setIsOpen(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          setPerguntas([])
          if (ws.current) {
            ws.current.close()
          }
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-6 z-50 cursor-pointer shadow-lg">
          Nova pergunta
          <Plus className="h-6 w-6" />
          <span className="sr-only">Nova Pergunta</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Pergunta</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para adicionar uma nova pergunta ao
            formulário.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h3 className="font-medium text-lg">Perguntas</h3>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {perguntas.map((pergunta, index) => (
                <div
                  key={pergunta.id}
                  className="p-3 border rounded-lg space-y-3 bg-muted/50"
                >
                  <div className="flex justify-between items-start">
                    <Label className="font-normal text-base">
                      {index + 1}. {pergunta.texto}
                    </Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => handleRemovePergunta(pergunta.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {(pergunta.tipo === "multipla_escolha" ||
                    pergunta.tipo === "caixa_selecao") &&
                    "opcoes" in pergunta &&
                    Array.isArray(pergunta.opcoes) && (
                      <div className="pl-4 space-y-2">
                        {pergunta.opcoes.map((opcao, opIndex: number) => (
                          <div
                            key={opIndex}
                            className="flex items-center gap-2"
                          >
                            <Badge variant="secondary" className="font-normal">
                              {opcao.texto}
                            </Badge>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveAlternativa(pergunta.id, opIndex)
                              }
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <div className="flex">
                          <Input
                            className="rounded-r-none h-8"
                            type="text"
                            placeholder="Nova alternativa"
                            value={novaAlternativa[pergunta.id] || ""}
                            onChange={(e) =>
                              setNovaAlternativa((prev) => ({
                                ...prev,
                                [pergunta.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              handleAddAlternativa(pergunta.id)
                            }
                          />
                          <Button
                            type="button"
                            className="cursor-pointer border-l-0 rounded-l-none h-8"
                            variant={"outline"}
                            onClick={() => handleAddAlternativa(pergunta.id)}
                          >
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
                  <Input
                    id="nova-pergunta"
                    type="text"
                    placeholder="Ex: Qual sua cor favorita?"
                    value={novaPerguntaTexto}
                    onChange={(e) => setNovaPerguntaTexto(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddPergunta()}
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Checkbox
                    id="obrigatoria"
                    checked={novaPerguntaObrigatoria}
                    onCheckedChange={(checked) =>
                      setNovaPerguntaObrigatoria(Boolean(checked))
                    }
                  />
                  <Label htmlFor="obrigatoria" className="font-normal">
                    Obrigatória
                  </Label>
                </div>
              </div>

              {novaPerguntaTipo === "nps" && (
                <div className="flex items-end gap-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="nps-min">Escala Mínima</Label>
                    <Input
                      id="nps-min"
                      type="number"
                      value={npsEscala.min}
                      onChange={(e) =>
                        setNpsEscala((prev) => ({
                          ...prev,
                          min: Number(e.target.value),
                        }))
                      }
                      className="w-28"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="nps-max">Escala Máxima</Label>
                    <Input
                      id="nps-max"
                      type="number"
                      value={npsEscala.max}
                      onChange={(e) =>
                        setNpsEscala((prev) => ({
                          ...prev,
                          max: Number(e.target.value),
                        }))
                      }
                      className="w-28"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="grid gap-1.5">
                  <Label>Tipo</Label>
                  <Select
                    value={novaPerguntaTipo}
                    onValueChange={(value: TipoPergunta) =>
                      setNovaPerguntaTipo(value)
                    }
                  >
                    <SelectTrigger
                      className="w-[180px]"
                      disabled={isLoadingTipos}
                    >
                      <SelectValue
                        placeholder={
                          isLoadingTipos
                            ? "Carregando..."
                            : "Tipo de pergunta"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposPergunta.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (char) => char.toUpperCase())}
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
              {isFinishing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Finalizar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
