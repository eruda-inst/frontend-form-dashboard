"use client"

import { useMenubar } from "@/components/menubar-context"
import { MenubarMenuData } from "@/app/types/menubar"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState, useRef, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Cookies from "js-cookie"
import type { Pergunta, Bloco } from "@/app/types/forms"
import { useFormWebSocket } from "@/app/hooks/useFormWebSocket"
import { AddQuestionDialog } from "@/components/add-question-dialog"
import { AddBlockDialog } from "@/components/add-block-dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { GripVertical, Loader2, Trash, Download } from "lucide-react"
import { useNavigation } from "@/components/navigation-provider"
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { FloatingActionButtons } from "@/components/floating-action-buttons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- Tipos --- 
interface SortableQuestionProps {
  pergunta: Pergunta;
  onUpdate: (id: string, texto: string) => void;
  handleDelete: (id: string) => void;
  pendingDeletion: string[];
  deleteConfirmation: string;
  setDeleteConfirmation: (value: string) => void;
  isDragging?: boolean;
}

// --- Componentes Auxiliares ---

const RenderQuestion = ({ pergunta }: { pergunta: Pergunta }) => {
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
      if ("opcoes" in pergunta) {
        return (
          <RadioGroup disabled>
            {pergunta.opcoes.map((opcao, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={opcao.texto}
                  id={`${pergunta.id}-${index}`}
                />
                <Label htmlFor={`${pergunta.id}-${index}`} className="font-normal">
                  {opcao.texto}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )
      }
      return null
    case "caixa_selecao":
      if ("opcoes" in pergunta) {
        return (
          <div className="space-y-2">
            {pergunta.opcoes.map((opcao, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox id={`${pergunta.id}-${index}`} disabled />
                <Label htmlFor={`${pergunta.id}-${index}`} className="font-normal">
                  {opcao.texto}
                </Label>
              </div>
            ))}
          </div>
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

const EditableQuestion = ({
  pergunta,
  onUpdate,
}: {
  pergunta: Pergunta
  onUpdate: (id: string, texto: string) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(pergunta.texto)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [isEditing])

  useEffect(() => {
    setText(pergunta.texto)
  }, [pergunta.texto])

  const handleUpdate = () => {
    setIsEditing(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value
    setText(newText)
    if (newText.trim() !== pergunta.texto) {
      onUpdate(pergunta.id, newText.trim())
    }
  }

  return (
    <div onClick={() => setIsEditing(true)} className="cursor-pointer">
      {isEditing ? (
        <Input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          onBlur={handleUpdate}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleUpdate()
            }
          }}
          className="text-lg font-medium"
        />
      ) : (
        <CardTitle className="text-lg font-medium break-words">
          {pergunta.texto}
        </CardTitle>
      )}
    </div>
  )
}

const EditableBlockHeader = ({
  bloco,
  onUpdate,
}: {
  bloco: Bloco
  onUpdate: (id: string, newValues: { titulo?: string; descricao?: string }) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [titulo, setTitulo] = useState(bloco.titulo)
  const [descricao, setDescricao] = useState(bloco.descricao)

  const handleSave = () => {
    setIsEditing(false)
    const updates: { titulo?: string; descricao?: string } = {}
    if (titulo.trim() !== bloco.titulo) {
      updates.titulo = titulo.trim()
    }
    if (descricao?.trim() !== bloco.descricao) {
      updates.descricao = descricao?.trim()
    }
    if (Object.keys(updates).length > 0) {
      onUpdate(bloco.id, updates)
    }
  }

  return (
    <div className="w-full" onClick={() => setIsEditing(true)}>
      {isEditing ? (
        <div className="space-y-2">
          <Input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="text-2xl font-bold tracking-tight text-accent-foreground"
          />
          <Textarea
            value={descricao || ""}
            onChange={(e) => setDescricao(e.target.value)}
            onBlur={handleSave}
            placeholder="Descrição do bloco (opcional)"
            className="text-muted-foreground"
          />
        </div>
      ) : (
        <div className="w-full">
          <h2 className="text-2xl font-bold tracking-tight text-accent-foreground break-words">
            {bloco.titulo}
          </h2>
          {bloco.descricao && (
            <p className="text-muted-foreground mt-1 break-words">
              {bloco.descricao}
            </p>
          )}
        </div>
      )}
    </div>
  )
}


// --- Componentes de Drag-and-Drop ---

function SortableQuestion({ 
  pergunta, 
  onUpdate, 
  handleDelete, 
  pendingDeletion, 
  deleteConfirmation, 
  setDeleteConfirmation,
  isDragging
}: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSourceDragging,
  } = useSortable({ id: pergunta.id, data: { type: "Question", pergunta } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 250ms ease-in-out",
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
       <div {...attributes} {...listeners} className="p-2 cursor-grab">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <Card
        className={`z-50 group relative transition-all duration-500 flex-grow ${
          pendingDeletion.includes(pergunta.id)
            ? "opacity-0 scale-90"
            : "opacity-100 scale-100"
        } ${isDragging ? "shadow-lg" : ""} ${
          isSourceDragging ? "opacity-50" : ""
        }`}
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="cursor-pointer absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser desfeita. Isso irá deletar
                permanentemente esta pergunta do formulário.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                Para confirmar, digite <strong>deletar</strong> abaixo:
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(pergunta.id)}>
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <CardHeader>
          <div className="w-full overflow-hidden">
            <EditableQuestion
              pergunta={pergunta}
              onUpdate={onUpdate}
            />
          </div>
        </CardHeader>
        <CardContent>
          <RenderQuestion pergunta={pergunta} />
        </CardContent>
      </Card>
    </div>
  )
}

const Block = ({ bloco, questions, questionProps, onUpdateBlock, onDeleteBlock }: { 
  bloco: Bloco, 
  questions: Pergunta[], 
  questionProps: {
    onUpdate: (id: string, newText: string) => void
    handleDelete: (id:string) => void
    pendingDeletion: string[]
    deleteConfirmation: string
    setDeleteConfirmation: (value: string) => void
  },
  onUpdateBlock: (id: string, newValues: { titulo?: string; descricao?: string }) => void,
  onDeleteBlock: (id: string) => void,
}) => {
    const { isOver, setNodeRef } = useDroppable({ id: bloco.id });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    return (
        <div ref={setNodeRef} className={`p-6 rounded-lg border-2 bg-accent/10 transition-colors ${isOver ? 'border-primary' : 'border-accent'}`}>
            <div className="flex justify-between items-start gap-4">
              <EditableBlockHeader bloco={bloco} onUpdate={onUpdateBlock} />
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0 text-muted-foreground hover:text-destructive">
                          <Trash className="h-5 w-5" />
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Deletar bloco?</AlertDialogTitle>
                          <AlertDialogDescription>
                              Todas as perguntas neste bloco serão movidas para o primeiro bloco do formulário. Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteBlock(bloco.id)} className="bg-destructive hover:bg-destructive/90">
                              Deletar Bloco
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
            </div>
            <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                <div className="mt-6 space-y-4 min-h-[6rem]">
                    {questions.length > 0 ? (
                        questions.map(pergunta => <SortableQuestion key={pergunta.id} pergunta={pergunta} {...questionProps} />)
                    ) : (
                        <div className="flex items-center justify-center text-center h-24">
                            <p className="text-sm text-muted-foreground">Solte uma pergunta aqui</p>
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    )
}

// --- Página Principal ---

export default function FormDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  // --- State --- 
  const [pendingDeletion, setPendingDeletion] = useState<string[]>([])
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>("")
  const [questions, setQuestions] = useState<Pergunta[]>([])
  const [activeQuestion, setActiveQuestion] = useState<Pergunta | null>(null)
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [formato, setFormato] = useState("csv");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [fuso, setFuso] = useState("");
  const [separador, setSeparador] = useState(",");
  const [apenasAtivas, setApenasAtivas] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // --- Hooks ---
  const { setMenubarData } = useMenubar()
  const access_token = Cookies.get("access_token") || null
  const { form, isLoading, error, sendMessage } = useFormWebSocket(id, access_token)
  const { setPageBreadcrumbs } = useNavigation()

  // --- Memoização para Estrutura de Dados ---
  const containers = useMemo(() => {
    if (!form) return { root: [] };
    const containerMap: { [key: string]: Pergunta[] } = { root: [] };
    if (form.blocos) {
      form.blocos.forEach(bloco => containerMap[bloco.id] = []);
    }
    questions.forEach(q => {
      const containerId = q.bloco_id || "root";
      if (containerMap.hasOwnProperty(containerId)) {
        containerMap[containerId].push(q);
      } else {
        containerMap.root.push(q); // Fallback for questions with invalid bloco_id
      }
    });
    return containerMap;
  }, [questions, form?.blocos]);

  // --- Effects ---
  useEffect(() => {
    if (form) {
      const blockOrder = form.blocos?.map((b) => b.id) || []
      const getBlockIndex = (bloco_id: string | null | undefined) => {
        if (!bloco_id) return blockOrder.length // root items last
        const index = blockOrder.indexOf(bloco_id)
        return index === -1 ? blockOrder.length : index
      }

      const sortedQuestions = [...form.perguntas].sort((a, b) => {
        const blockIndexA = getBlockIndex(a.bloco_id)
        const blockIndexB = getBlockIndex(b.bloco_id)
        if (blockIndexA !== blockIndexB) {
          return blockIndexA - blockIndexB
        }
        return a.ordem_exibicao - b.ordem_exibicao
      })

      setQuestions(sortedQuestions)
      const formTitle =
        form.titulo.length > 20
          ? `${form.titulo.substring(0, 20)}...`
          : form.titulo
      setPageBreadcrumbs([
        { title: formTitle, url: `/formularios/${id}` },
        { title: "Gestão de Questões" },
      ])
    }
  }, [form, id, setPageBreadcrumbs])

  useEffect(() => {
    const menubarData: MenubarMenuData[] = [
      {
        trigger: "Configurações",
        content: [
          {
            label: "Gestão de Questões",
            onClick: () => router.push(`/formularios/${id}/edit-questions`),
          },
          {
            label: "Operabilidades",
            onClick: () => router.push(`/formularios/${id}/operabilities`),
          },
          {
            label: "Permissões",
            onClick: () => router.push(`/formularios/${id}/permissions`),
          },
        ],
      },
      {
        trigger: "Respostas",
        content: [
          {
            label: "Visualizar",
            onClick: () =>
              router.push(`/formularios/${id}/visualizar-respostas`),
          },
          {
            label: "Exportar",
            onClick: () => setIsExportDialogOpen(true),
          },
        ],
      },
    ]
    setMenubarData(menubarData)

    return () => {
      setMenubarData([]) // Clear menubar data when component unmounts
    }
  }, [id, router, setMenubarData])

  // --- Handlers ---
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (formato) params.append("formato", formato);
      if (inicio) params.append("inicio", new Date(inicio).toISOString());
      if (fim) params.append("fim", new Date(fim).toISOString());
      if (fuso) params.append("fuso", fuso);
      if (separador && formato === 'csv') params.append("separador", separador);
      if (apenasAtivas) params.append("apenas_ativas", "true");

      const url = `/formularios/${id}/export?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error("Export failed", response);
        return;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : 'export';

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);

      setIsExportDialogOpen(false);
    } catch (error) {
      console.error("Error during export:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateQuestion = (questionId: string, newText: string) => {
    if (form) {
      const message = {
        tipo: "update_formulario",
        conteudo: {
          perguntas_editadas: [
            {
              id: questionId,
              texto: newText,
            },
          ],
        },
      }
      sendMessage(message)
    }
  }

  const handleUpdateBlock = (blockId: string, newValues: { titulo?: string; descricao?: string }) => {
    const message = {
        tipo: "update_formulario",
        conteudo: {
            blocos_editados: [
                {
                    id: blockId,
                    ...newValues,
                },
            ],
        },
    };
    sendMessage(message);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!form || !form.blocos) return;

    if (form.blocos.length <= 1) {
        alert("Você não pode deletar o último bloco do formulário.");
        return;
    }

    const targetBlock = form.blocos.find(b => b.id !== blockId);
    if (!targetBlock) return;

    const questionsToMove = containers[blockId] || [];
    const perguntas_editadas = questionsToMove.map(q => ({
        id: q.id,
        bloco_id: targetBlock.id,
    }));

    const message = {
        tipo: "update_formulario",
        conteudo: {
            blocos_removidos: [blockId],
            ...(perguntas_editadas.length > 0 && { perguntas_editadas }),
        },
    };

    setQuestions(currentQuestions => {
        return currentQuestions.map(q => {
            if (q.bloco_id === blockId) {
                return { ...q, bloco_id: targetBlock.id };
            }
            return q;
        });
    });

    sendMessage(message);
  };


  const handleUnicoPorChaveModoChange = (value: string) => {
    if (form) {
      const message = {
        tipo: "update_formulario",
        conteudo: {
          unico_por_chave_modo: value,
        },
      }
      sendMessage(message)
    }
  }

  const handleDeleteQuestion = (questionId: string) => {
    if (!form) return

    setPendingDeletion((prev) => [...prev, questionId])

    setTimeout(() => {
      const message = {
        tipo: "update_formulario",
        conteudo: {
          perguntas_removidas: [questionId],
        },
      }
      sendMessage(message)
    }, 500)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  function findContainer(id: string) {
    if (id === "root" || form?.blocos?.some(b => b.id === id)) {
      return id
    }
    return questions.find((q) => q.id === id)?.bloco_id || "root"
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    setActiveQuestion(questions.find(q => q.id === active.id) || null)
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!form) return

    const { active, over } = event
    setActiveQuestion(null)

    if (!over || active.id === over.id) return

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId)
    const overContainer = findContainer(overId)

    if (activeContainer !== overContainer) {
      const activeQuestion = questions.find((q) => q.id === activeId)
      if (!activeQuestion) return

      // Optimistic UI Update
      setQuestions((currentQuestions) => {
        const sourceItems = currentQuestions.filter(
          (q) => (q.bloco_id || "root") === activeContainer && q.id !== activeId
        )
        const destItems = currentQuestions.filter(
          (q) => (q.bloco_id || "root") === overContainer
        )
        const otherItems = currentQuestions.filter(
          (q) =>
            (q.bloco_id || "root") !== activeContainer &&
            (q.bloco_id || "root") !== overContainer
        )

        const updatedSourceItems = sourceItems.map((item, index) => ({
          ...item,
          ordem_exibicao: index,
        }))

        let insertIndex = destItems.findIndex((q) => q.id === overId)
        if (insertIndex === -1) {
          insertIndex = destItems.length
        }

        const newDestItems = [...destItems]
        newDestItems.splice(insertIndex, 0, {
          ...activeQuestion,
          bloco_id: overContainer === "root" ? null : overContainer,
        })

        const updatedDestItems = newDestItems.map((item, index) => ({
          ...item,
          ordem_exibicao: index,
        }))

        const newQuestions = [
          ...otherItems,
          ...updatedSourceItems,
          ...updatedDestItems,
        ]

        const blockOrder = form.blocos?.map((b) => b.id) || []
        const getBlockIndex = (bloco_id: string | null | undefined) => {
          if (!bloco_id) return blockOrder.length
          const index = blockOrder.indexOf(bloco_id)
          return index === -1 ? blockOrder.length : index
        }
        return newQuestions.sort((a, b) => {
          const blockIndexA = getBlockIndex(a.bloco_id)
          const blockIndexB = getBlockIndex(b.bloco_id)
          if (blockIndexA !== blockIndexB) {
            return blockIndexA - blockIndexB
          }
          return a.ordem_exibicao - b.ordem_exibicao
        })
      })

      // Backend Message
      const sourceItems = containers[activeContainer].filter(
        (q) => q.id !== activeId
      )
      const destItems = containers[overContainer]

      const sourceUpdates = sourceItems.map((item, index) => ({
        id: item.id,
        ordem_exibicao: index,
      }))

      let insertIndex = destItems.findIndex((q) => q.id === overId)
      if (insertIndex === -1) {
        insertIndex = destItems.length
      }
      const newDestItems = [...destItems]
      newDestItems.splice(insertIndex, 0, activeQuestion)

      const destUpdates = newDestItems.map((item, index) => {
        if (item.id === activeId) {
          return {
            id: item.id,
            ordem_exibicao: index,
            bloco_id: overContainer === "root" ? null : overContainer,
          }
        }
        return { id: item.id, ordem_exibicao: index }
      })

      sendMessage({
        tipo: "update_formulario",
        conteudo: {
          perguntas_editadas: [...sourceUpdates, ...destUpdates],
        },
      })
    } else {
      // --- Reordenar no mesmo container ---
      const itemsInContainer = containers[activeContainer]
      const oldIndex = itemsInContainer.findIndex((q) => q.id === activeId)
      const newIndex = itemsInContainer.findIndex((q) => q.id === overId)

      if (oldIndex !== newIndex) {
        setQuestions((prev) => {
          const oldGlobalIndex = prev.findIndex((q) => q.id === activeId)
          const newGlobalIndex = prev.findIndex((q) => q.id === overId)
          if (oldGlobalIndex !== -1 && newGlobalIndex !== -1) {
            return arrayMove(prev, oldGlobalIndex, newGlobalIndex)
          }
          return prev
        })

        const reordered = arrayMove(itemsInContainer, oldIndex, newIndex)
        const updatedOrder = reordered.map((q, index) => ({ id: q.id, ordem_exibicao: index }))
        
        sendMessage({
          tipo: "update_formulario",
          conteudo: {
            perguntas_editadas: updatedOrder,
          },
        })
      }
    }
  }

  // --- Renderização ---
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

  const questionProps = {
    onUpdate: handleUpdateQuestion,
    handleDelete: handleDeleteQuestion,
    pendingDeletion,
    deleteConfirmation,
    setDeleteConfirmation,
  }

  const lastBlockId = form.blocos && form.blocos.length > 0 ? form.blocos[form.blocos.length - 1].id : null;
console.log("ultimo bloco", lastBlockId)

  return (
    <>
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Respostas</DialogTitle>
            <DialogDescription>
              Selecione as opções para a exportação das respostas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="formato" className="text-right">
                Formato
              </Label>
              <Select value={formato} onValueChange={setFormato}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="ndjson">NDJSON</SelectItem>
                  <SelectItem value="xlsx">XLSX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="inicio" className="text-right">
                Data Início
              </Label>
              <Input
                id="inicio"
                type="datetime-local"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fim" className="text-right">
                Data Fim
              </Label>
              <Input
                id="fim"
                type="datetime-local"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fuso" className="text-right">
                Fuso Horário
              </Label>
              <Input
                id="fuso"
                value={fuso}
                onChange={(e) => setFuso(e.target.value)}
                placeholder="America/Sao_Paulo"
                className="col-span-3"
              />
            </div>
            {formato === "csv" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="separador" className="text-right">
                  Separador
                </Label>
                <Input
                  id="separador"
                  value={separador}
                  onChange={(e) => setSeparador(e.target.value)}
                  placeholder=","
                  className="col-span-3"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apenas_ativas" className="text-right">
                Apenas Ativas
              </Label>
              <Checkbox
                id="apenas_ativas"
                checked={apenasAtivas}
                onCheckedChange={(checked) => setApenasAtivas(checked as boolean)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exportando...</>
              ) : (
                <><Download className="mr-2 h-4 w-4" /> Exportar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="w-full mt-8 grid gap-8 px-4 sm:px-6 lg:px-8 pb-24">
          <div className="flex flex-col">
            <h1 className="text-4xl tracking-tight">Gestão das Questões</h1>
            <p className="text-lg text-muted-foreground mt-2 mb-2">
              {form.titulo}
            </p>
            <Separator />
          </div>

          <div className="grid gap-1.5">
            <Label>Modo de Resposta Única</Label>
            <Select
              value={form?.unico_por_chave_modo?.toString() || "none"}
              onValueChange={handleUnicoPorChaveModoChange}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Selecione o modo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
                <SelectItem value="email_or_phone">E-mail ou Telefone</SelectItem>
                <SelectItem value="email_or_cnpj">E-mail ou CNPJ</SelectItem>
                <SelectItem value="phone_or_cnpj">Telefone ou CNPJ</SelectItem>
                <SelectItem value="email_or_phone_or_cnpj">E-mail, Telefone ou CNPJ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-8">
            {form.blocos?.map((bloco) => (
              <Block key={bloco.id} bloco={bloco} questions={containers[bloco.id] || []} questionProps={questionProps} onUpdateBlock={handleUpdateBlock} onDeleteBlock={handleDeleteBlock} />
            ))}

          </div>

        </div>

        <DragOverlay>
          {activeQuestion ? <SortableQuestion pergunta={activeQuestion} {...questionProps} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      <FloatingActionButtons
        onAddQuestionClick={() => {
          if (!lastBlockId) {
            alert("Crie um bloco antes de adicionar uma questão.")
            return
          }
          setIsAddQuestionOpen(true)
        }}
        onAddBlockClick={() => setIsAddBlockOpen(true)}
      />

      {lastBlockId && (
        <AddQuestionDialog
          isOpen={isAddQuestionOpen}
          onOpenChange={setIsAddQuestionOpen}
          formId={form.id}
          onQuestionAdded={() => {}}
          targetBlockId={lastBlockId}
        />
      )}

      <AddBlockDialog
        isOpen={isAddBlockOpen}
        onOpenChange={setIsAddBlockOpen}
        sendMessage={sendMessage}
      />
    </>
  )
}