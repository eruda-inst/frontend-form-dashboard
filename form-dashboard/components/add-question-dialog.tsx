"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { toast } from "sonner"
import { Plus, Loader2, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { Pergunta, TipoPergunta } from "@/app/types/forms"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "./ui/textarea"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { ScrollArea } from "./ui/scroll-area"

interface AddQuestionDialogProps {
  onQuestionAdded: (newQuestion: Partial<Pergunta>) => void
  targetBlockId: string | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  sendMessage: (message: object) => void
  lastOrder: number
}

// This is a simplified version of the RenderQuestion component
const QuestionPreview = ({
  pergunta,
}: {
  pergunta: Partial<Pergunta>
}) => {
  switch (pergunta.tipo) {
    case "texto_simples":
      return <Input placeholder="Resposta curta" disabled />
    case "texto_longo":
      return <Textarea placeholder="Resposta longa" disabled />
    case "data":
      return <Input type="date" disabled />
    case "email":
      return <Input type="email" placeholder="exemplo@email.com" disabled />
    case "telefone":
      return <Input type="tel" placeholder="(99) 99999-9999" disabled />
    case "cnpj":
      return <Input type="text" placeholder="00.000.000/0000-00" disabled />
    case "numero":
    case "nps":
      return <Input type="number" placeholder="0" disabled />
    case "multipla_escolha":
      if ("opcoes" in pergunta && pergunta.opcoes && pergunta.opcoes.length > 0) {
        return (
          <ScrollArea className="h-24">
            <RadioGroup disabled className="pr-4">
              {pergunta.opcoes.map((opcao, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={opcao.texto}
                    id={`preview-${index}`}
                  />
                  <Label htmlFor={`preview-${index}`} className="font-normal">
                    {opcao.texto}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </ScrollArea>
        )
      }
      return <p className="text-sm text-muted-foreground">Adicione opções para este tipo de pergunta.</p>
    case "caixa_selecao":
      if ("opcoes" in pergunta && pergunta.opcoes && pergunta.opcoes.length > 0) {
        return (
          <ScrollArea className="h-24">
            <div className="space-y-2 pr-4">
              {pergunta.opcoes.map((opcao, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox id={`preview-${index}`} disabled />
                  <Label htmlFor={`preview-${index}`} className="font-normal">
                    {opcao.texto}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        )
      }
      return <p className="text-sm text-muted-foreground">Adicione opções para este tipo de pergunta.</p>
    default:
      return (
        <p className="text-sm text-muted-foreground">
          Selecione um tipo de pergunta.
        </p>
      )
  }
}


export function AddQuestionDialog({
  onQuestionAdded,
  targetBlockId,
  isOpen,
  onOpenChange,
  sendMessage,
  lastOrder,
}: AddQuestionDialogProps) {
  const router = useRouter()
  const [novaPerguntaTexto, setNovaPerguntaTexto] = useState("")
  const [novaPerguntaDescricao, setNovaPerguntaDescricao] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [novaPerguntaObrigatoria, setNovaPerguntaObrigatoria] = useState(true)
  const [tiposPergunta, setTiposPergunta] = useState<
    { value: string; label: string }[]
  >([])
  const [isLoadingTipos, setIsLoadingTipos] = useState(true)
  const [novaPerguntaTipo, setNovaPerguntaTipo] =
    useState<TipoPergunta>("texto_simples")
  const [opcoes, setOpcoes] = useState<{ texto: string }[]>([])
  const [novaOpcao, setNovaOpcao] = useState("")
  const [npsEscala, setNpsEscala] = useState({ min: 0, max: 10 })

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
    if (isOpen) {
        fetchTiposPergunta()
        // Reset state on open
        setNovaPerguntaTexto("")
        setNovaPerguntaDescricao("")
        setNovaPerguntaTipo("texto_simples")
        setNovaPerguntaObrigatoria(true)
        setOpcoes([])
        setNovaOpcao("")
        setNpsEscala({ min: 0, max: 10 })
    }
  }, [isOpen, fetchTiposPergunta])

  const handleAddPergunta = () => {
    if (!novaPerguntaTexto.trim()) {
      toast.warning("O texto da questão não pode estar em branco.")
      return
    }

    setIsAdding(true)

    let newQuestionPayload: any = {
      bloco_id: targetBlockId,
      texto: novaPerguntaTexto,
      descricao: novaPerguntaDescricao.trim() || null,
      tipo: novaPerguntaTipo,
      obrigatoria: novaPerguntaObrigatoria,
      ordem_exibicao: lastOrder + 1,
    }

    if (
      novaPerguntaTipo === "caixa_selecao" ||
      novaPerguntaTipo === "multipla_escolha"
    ) {
      if (opcoes.length === 0) {
        toast.warning("Adicione ao menos uma opção para este tipo de pergunta.")
        setIsAdding(false)
        return
      }
      newQuestionPayload.opcoes = opcoes
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

    sendMessage(message)
    toast.success("Questão adicionada com sucesso!")
    onQuestionAdded(newQuestionPayload)
    onOpenChange(false)
    setIsAdding(false)
  }

  const handleAddOpcao = () => {
    if (novaOpcao.trim()) {
      setOpcoes([...opcoes, { texto: novaOpcao.trim() }])
      setNovaOpcao("")
    }
  }

  const handleRemoveOpcao = (indexToRemove: number) => {
    setOpcoes(opcoes.filter((_, index) => index !== indexToRemove))
  }

  const previewPergunta: Partial<Pergunta> = {
    texto: novaPerguntaTexto || "Sua pergunta aqui...",
    descricao: novaPerguntaDescricao || null,
    tipo: novaPerguntaTipo,
    opcoes: opcoes,
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Questão</DialogTitle>
          <DialogDescription>
            Crie e configure a nova questão para o seu formulário.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Preview Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-lg">Preview</h4>
            <div className="p-4 border rounded-lg bg-muted/50 min-h-[100px] flex flex-col justify-center">
                <Label className="font-semibold text-base mb-1">{previewPergunta.texto}</Label>
                {previewPergunta.descricao && (
                    <p className="text-sm text-muted-foreground mb-3">{previewPergunta.descricao}</p>
                )}
                <QuestionPreview pergunta={previewPergunta} />
            </div>
          </div>

          {/* Form Section */}
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="nova-pergunta">Texto da Questão</Label>
              <Input
                id="nova-pergunta"
                type="text"
                placeholder="Ex: Qual sua cor favorita?"
                value={novaPerguntaTexto}
                onChange={(e) => setNovaPerguntaTexto(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
                <Label htmlFor="nova-pergunta-descricao">Descrição (Opcional)</Label>
                <Textarea
                    id="nova-pergunta-descricao"
                    placeholder="Forneça um contexto ou instruções adicionais para esta pergunta."
                    value={novaPerguntaDescricao}
                    onChange={(e) => setNovaPerguntaDescricao(e.target.value)}
                />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
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

                <div className="grid gap-1.5">
                    <Label className="sr-only">Tipo</Label>
                    <Select
                        value={novaPerguntaTipo}
                        onValueChange={(value: TipoPergunta) => {
                            setNovaPerguntaTipo(value)
                            setOpcoes([]) // Reset options when type changes
                        }}
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
            </div>

            {novaPerguntaTipo === "nps" && (
              <div className="flex items-end gap-2 border-t pt-4">
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

            {(novaPerguntaTipo === "multipla_escolha" ||
              novaPerguntaTipo === "caixa_selecao") && (
              <div className="space-y-3 border-t pt-4">
                <Label>Opções</Label>
                <ScrollArea className="h-32">
                  <div className="space-y-2 pr-4">
                      {opcoes.map((opcao, index) => (
                          <div key={index} className="flex items-center gap-2">
                              <Input value={opcao.texto} readOnly className="bg-muted/50" />
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveOpcao(index)}>
                                  <X className="h-4 w-4" />
                              </Button>
                          </div>
                      ))}
                  </div>
                </ScrollArea>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Nova opção"
                    value={novaOpcao}
                    onChange={(e) => setNovaOpcao(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddOpcao()}
                  />
                  <Button type="button" variant="outline" onClick={handleAddOpcao}>
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Opção
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAddPergunta} disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Adicionar Questão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}