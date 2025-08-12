"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { toast } from "sonner"
import { Plus, Loader2, X, Check } from "lucide-react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
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
  const [novaPerguntaTipo, setNovaPerguntaTipo] =
    useState<TipoPergunta>("texto-curto")
  const [novaAlternativa, setNovaAlternativa] = useState<{
    [key: string]: string
  }>({})

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    getValues,
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
  })

  const handleAddPergunta = () => {
    if (!novaPerguntaTexto.trim()) {
      toast.warning("O texto da pergunta não pode estar em branco.")
      return
    }

    // TODO: Implementar WebSocket para enviar a nova pergunta.
    // A conexão seria algo como: /ws/formularios/{createdFormId}
    // O payload seria: { pergunta: novaPerguntaTexto, tipo: novaPerguntaTipo }

    // A construção explícita do objeto `newQuestion` é necessária porque o TypeScript
    // tem dificuldade em inferir corretamente a união discriminada `Pergunta`
    // quando um spread condicional `{...()}` é usado. Esta abordagem garante
    // que o objeto corresponda perfeitamente a `PerguntaComOpcoes` ou `PerguntaSemOpcoes`.
    let newQuestion: Pergunta
    if (
      novaPerguntaTipo === "caixa-de-selecao" ||
      novaPerguntaTipo === "lista-suspensa" ||
      novaPerguntaTipo === "multipla-escolha"
    ) {
      newQuestion = {
        id: `temp-${Date.now()}`,
        pergunta: novaPerguntaTexto,
        tipo: novaPerguntaTipo,
        opcoes: [],
      }
    } else {
      newQuestion = {
        id: `temp-${Date.now()}`,
        pergunta: novaPerguntaTexto,
        tipo: novaPerguntaTipo,
      }
    }

    setPerguntas([...perguntas, newQuestion])
    setNovaPerguntaTexto("") // Limpa o input
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
            opcoes: [...p.opcoes, alternativaText],
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
            (_: string, index: number) => index !== indexToRemove
          )
          return { ...p, opcoes: novasOpcoes }
        }
        return p
      })
    )
  }

  const handleCreateForm = async (data: CreateFormValues) => {
    const accessToken = Cookies.get("accessToken")
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
    } catch (error: any) {
      toast.error("Erro ao criar formulário", { description: error.message })
    }
  }

  const handleFinish = async () => {
    if (!createdFormId) {
      toast.error("ID do formulário não encontrado. Não é possível salvar as perguntas.")
      return
    }
    setIsFinishing(true)
    const accessToken = Cookies.get("accessToken")
    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      setIsFinishing(false)
      return
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/formularios/${createdFormId}`,
        {
          method: "PUT", // Ou PATCH, dependendo da sua API
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            titulo: getValues("titulo"),
            descricao: getValues("descricao"),
            perguntas: perguntas.map(({ id, ...rest }) => rest),
          }),
        }
      )

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Falha ao salvar as perguntas.")
      }

      toast.success("Formulário salvo com sucesso!")
      onFormCreated()
      setIsOpen(false)
    } catch (error: any) {
      toast.error("Erro ao finalizar", { description: error.message })
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
                        {pergunta.opcoes.map((opcao: string, opIndex: number) => (
                          <div key={opIndex} className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-normal">{opcao}</Badge>
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

              {/* Adicionar nova pergunta */}
              <div className="flex items-end gap-2 border-t pt-4">
                <div className="grid gap-1.5 flex-1">
                  <Label htmlFor="nova-pergunta">Texto da Pergunta</Label>
                  <Input id="nova-pergunta" type="text" placeholder="Ex: Qual sua cor favorita?" value={novaPerguntaTexto} onChange={(e) => setNovaPerguntaTexto(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddPergunta()} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Tipo</Label>
                  <Select value={novaPerguntaTipo} onValueChange={(value: TipoPergunta) => setNovaPerguntaTipo(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo de pergunta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="texto-curto">Texto Curto</SelectItem>
                      <SelectItem value="texto-longo">Texto Longo</SelectItem>
                      <SelectItem value="multipla-escolha">Múltipla Escolha</SelectItem>
                      <SelectItem value="caixa-de-selecao">Caixa de Seleção</SelectItem>
                      <SelectItem value="lista-suspensa">Lista Suspensa</SelectItem>
                      <SelectItem value="data">Data</SelectItem>
                      <SelectItem value="numero">Número</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={handleAddPergunta}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar
                </Button>
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