"use client"

import { useMenubar } from "@/components/menubar-context";
import { MenubarMenuData } from "@/app/types/menubar";

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
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation"
import Cookies from "js-cookie"
import type { Pergunta } from "@/app/types/forms"
import { useFormWebSocket } from "@/app/hooks/useFormWebSocket"
import { AddQuestionDialog } from "@/components/add-question-dialog"
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
import { GripVertical, Loader2, Trash } from "lucide-react"
import { useNavigation } from "@/components/navigation-provider";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

// Componente auxiliar para renderizar cada tipo de pergunta
const RenderQuestion = ({ pergunta }: { pergunta: Pergunta }) => {
  switch (pergunta.tipo) {
    case "texto_simples":
      return <Input placeholder="Resposta curta" disabled />
    case "texto_longo":
      return <Textarea placeholder="Resposta longa" disabled />
    case "data":
      return <Input type="date" disabled />
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

const EditableQuestion = ({ pergunta, index, onUpdate }: {
  pergunta: Pergunta;
  index: number;
  onUpdate: (id: string, texto: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(pergunta.texto);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setText(pergunta.texto);
  }, [pergunta.texto]);

  const handleUpdate = () => {
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
    if (newText.trim() !== pergunta.texto) {
      onUpdate(pergunta.id, newText.trim());
    }
  };

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
            if (e.key === 'Enter') {
              handleUpdate();
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
  );
};

const QuestionCard = ({ pergunta, index }: { pergunta: Pergunta; index: number }) => (
  <div className="flex items-center w-full">
    <div className="cursor-grab p-2">
      <GripVertical className="h-5 w-5 text-muted-foreground" />
    </div>
    <Card className="flex-grow">
      <CardHeader>
        <CardTitle className="text-lg font-medium break-words">
          {pergunta.texto}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RenderQuestion pergunta={pergunta} />
      </CardContent>
    </Card>
  </div>
);


function SortableQuestion({ pergunta, index, onUpdate, handleDelete, pendingDeletion, deleteConfirmation, setDeleteConfirmation, isDragging, droppedId }: {
  pergunta: Pergunta;
  index: number;
  onUpdate: (id: string, texto: string) => void;
  handleDelete: (id: string) => void;
  pendingDeletion: string[];
  deleteConfirmation: string;
  setDeleteConfirmation: (value: string) => void;
  isDragging: boolean;
  droppedId: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: pergunta.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
  };

  const variants = {
    dragging: { opacity: 0, transition: { duration: 0 } },
    normal: { opacity: 1 },
  };

  return (
    <motion.div 
      layout={pergunta.id !== droppedId}
      ref={setNodeRef} 
      style={style} 
      variants={variants}
      animate={isDragging ? "dragging" : "normal"}
      className="flex items-center"
    >
      <div {...attributes} {...listeners} className="cursor-grab p-2">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <Card
        className={`z-50 group relative transition-all duration-500 flex-grow ${pendingDeletion.includes(pergunta.id) ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}
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
                Essa ação não pode ser desfeita. Isso irá deletar permanentemente esta pergunta do formulário.
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
              <AlertDialogAction onClick={() => handleDelete(pergunta.id)}>Deletar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <CardHeader>
          <div className="w-full overflow-hidden">
            <EditableQuestion
              pergunta={pergunta}
              index={index}
              onUpdate={onUpdate}
            />
          </div>
        </CardHeader>
        <CardContent>
          <RenderQuestion pergunta={pergunta} />
        </CardContent>
      </Card>
    </motion.div>
  );
}


export default function FormDetailsPage() {
  const params = useParams()
  const [pendingDeletion, setPendingDeletion] = useState<string[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>("");
  const [questions, setQuestions] = useState<Pergunta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [droppedId, setDroppedId] = useState<string | null>(null);
  
  const router = useRouter();
  const id = params.id as string

      const { setMenubarData } = useMenubar();
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
            onClick: () => router.push(`/formularios/${id}/visualizar-respostas`),
          },
          {
            label: "Exportar",
            onClick: () => router.push(`/formularios/${id}/export`),
          },
        ],
      },
    ];
    setMenubarData(menubarData);

    return () => {
      setMenubarData([]); // Clear menubar data when component unmounts
    };
  }, [id, router, setMenubarData]);

  const access_token = Cookies.get("access_token") || null

  const { form, isLoading, error, sendMessage } = useFormWebSocket(id, access_token)
  const { setPageBreadcrumbs } = useNavigation();

  const activeQuestion = questions.find((q) => q.id === activeId);

  useEffect(() => {
    if (form) {
      const sortedQuestions = [...form.perguntas].sort((a, b) => a.ordem_exibicao - b.ordem_exibicao);
      setQuestions(sortedQuestions);
      const formTitle = form.titulo.length > 20 ? `${form.titulo.substring(0, 20)}...` : form.titulo;
      setPageBreadcrumbs([
        { title: formTitle, url: `/formularios/${id}` },
        { title: "Gestão de Questões" },
      ]);
    }
  }, [form, id, setPageBreadcrumbs]);

  useEffect(() => {
    if (droppedId) {
      const timer = setTimeout(() => setDroppedId(null), 500);
      return () => clearTimeout(timer);
    }
  }, [droppedId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      };
      sendMessage(message);
    }
  };

  const handleUnicoPorChaveModoChange = (value: string) => {
    if (form) {
      const message = {
        tipo: "update_formulario",
        conteudo: {
          unico_por_chave_modo: value,
        },
      };
      sendMessage(message);
    }
  };

  const handleUpdateQuestionOrder = (reorderedQuestions: Pergunta[]) => {
    if (form) {
      const message = {
        tipo: "update_formulario",
        conteudo: {
          perguntas_editadas: reorderedQuestions.map((q, index) => ({
            id: q.id,
            ordem_exibicao: index,
          })),
        },
      };
      sendMessage(message);
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!form) return;

    setPendingDeletion(prev => [...prev, questionId]);

    setTimeout(() => {
      const message = {
        "tipo": "update_formulario",
        "conteudo": {
          "perguntas_removidas": [questionId]
        }
      };
      sendMessage(message);
    }, 500);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setDroppedId(active.id as string);

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        handleUpdateQuestionOrder(reorderedItems);
        return reorderedItems;
      });
    }
  }

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
    <div className="w-full mt-8 grid gap-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col">
        <h1 className="text-4xl tracking-tight">
          Gestão das questões</h1>
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
            <SelectItem value="email_or_phone">
              E-mail ou Telefone
            </SelectItem>
            <SelectItem value="email_or_cnpj">
              E-mail ou CNPJ
            </SelectItem>
            <SelectItem value="phone_or_cnpj">
              Telefone ou CNPJ
            </SelectItem>
            <SelectItem value="email_or_phone_or_cnpj">
              E-mail, Telefone ou CNPJ
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {questions.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={questions.map(q => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex-col space-y-4">
              {questions.map((pergunta, index) => (
                <SortableQuestion
                  key={pergunta.id}
                  pergunta={pergunta}
                  index={index}
                  onUpdate={handleUpdateQuestion}
                  handleDelete={handleDeleteQuestion}
                  pendingDeletion={pendingDeletion}
                  deleteConfirmation={deleteConfirmation}
                  setDeleteConfirmation={setDeleteConfirmation}
                  isDragging={activeId === pergunta.id}
                  droppedId={droppedId}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeQuestion ? <QuestionCard pergunta={activeQuestion} index={questions.findIndex(q => q.id === activeId)} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Este formulário ainda não possui perguntas.
          </CardContent>
        </Card>
      )}
      <AddQuestionDialog formId={form.id} onQuestionAdded={() => { }} />
    </div>
  )
}