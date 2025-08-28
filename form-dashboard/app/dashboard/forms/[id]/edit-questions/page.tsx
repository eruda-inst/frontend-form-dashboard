"use client"

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

import { useEffect, useState, useRef } from "react";
import { useParams }
from "next/navigation"
import Cookies from "js-cookie"
import type { Pergunta } from "@/app/types/forms"
import { useFormWebSocket } from "@/app/hooks/useFormWebSocket"
import { AddQuestionDialog } from "@/components/add-question-dialog"
import { useNavigation } from "@/components/navigation-provider"
import { useDashboard } from "@/components/dashboard-context"
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
import { Button } from "@/components/ui/button"
import { Loader2, Trash } from "lucide-react"

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
          {index + 1}. {pergunta.texto}
        </CardTitle>
      )}
    </div>
  );
};

export default function FormDetailsPage() {
  const params = useParams()
  const { setBreadcrumbs } = useNavigation()
  const { setUsersInRoom } = useDashboard();
  const [pendingDeletion, setPendingDeletion] = useState<string[]>([]);

  const id = params.id as string
  const access_token = Cookies.get("access_token") || null


  const { form, isLoading, error, sendMessage } = useFormWebSocket(id, access_token)



  const handleUpdateQuestion = (questionId: string, newText: string) => {
    if (form) {
      const message = {
        tipo: "update_formulario",
        conteudo: {
          perguntas_editadas: [
            {
              id: questionId,
              texto: newText,
              ordem_exibicao: form.perguntas.find(p => p.id === questionId)?.ordem_exibicao ?? 0
            },
          ],
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
    <div className="w-full grid gap-8 px-4 sm:px-6 lg:px-8">
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
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {form.perguntas.map((pergunta, index) => (
            <Card 
              key={pergunta.id} 
              className={`group relative transition-all duration-500 ${pendingDeletion.includes(pergunta.id) ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
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
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteQuestion(pergunta.id)}>Deletar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
              <CardHeader>
                <div className="w-full overflow-hidden">
                  <EditableQuestion
                    pergunta={pergunta}
                    index={index}
                    onUpdate={handleUpdateQuestion}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <RenderQuestion pergunta={pergunta} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Este formulário ainda não possui perguntas.
          </CardContent>
        </Card>
      )}
      <AddQuestionDialog formId={form.id} onQuestionAdded={() => {}} />
    </div>
  )
}