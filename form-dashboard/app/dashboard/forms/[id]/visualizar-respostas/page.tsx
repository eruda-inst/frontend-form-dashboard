"use client"
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { useFormWebSocket } from "@/app/hooks/useFormWebSocket"
import { useNavigation } from "@/components/navigation-provider"
import { useDashboard } from "@/components/dashboard-context"
import { useMenubar } from "@/components/menubar-context";
import { MenubarMenuData } from "@/app/types/menubar";
import { Loader2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Resposta, RespostaItem } from "@/app/types/responses";
import type { Pergunta } from "@/app/types/forms";
import { useResponsesWebSocket } from "@/app/hooks/useResponsesWebSocket";

const getAnswerValue = (item?: RespostaItem, pergunta?: Pergunta) => {
  if (!item) {
    return "N/A";
  }

  if (pergunta?.tipo === 'data' && item.valor_texto) {
    try {
      const date = new Date(item.valor_texto);
      return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (error) {
      return item.valor_texto;
    }
  }

  return item.valor_texto || item.valor_numero?.toString() || item.valor_opcao_texto || "N/A";
};


export default function FormDetailsPage() {
  const params = useParams()
  const router = useRouter();
  const { setBreadcrumbs } = useNavigation()
  const { setMenubarData } = useMenubar();
  const { setUsersInRoom } = useDashboard();

  const id = params.id as string
  const access_token = Cookies.get("access_token") || null

  const { form, isLoading, error, usersInRoom } = useFormWebSocket(id, access_token)
  const { responses, isLoading: isLoadingResponses, error: responsesError } = useResponsesWebSocket(id, access_token);
  console.log("Responses in page.tsx:", responses);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<Resposta | null>(null);

  const handleRowClick = (response: Resposta) => {
    setSelectedResponse(response);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    setUsersInRoom(usersInRoom);
    return () => {
      setUsersInRoom([]); // Clear usersInRoom when component unmounts
    };
  }, [usersInRoom, setUsersInRoom]);

  useEffect(() => {
    if (form) {
      const breadcrumbs = [
        { title: "Formulários", url: "/dashboard/forms" },
        { title: form.titulo, url: `/dashboard/forms/${id}/visualizar-respostas` },
        { title: "Respostas" }
      ];
      setBreadcrumbs(breadcrumbs);
    }
  }, [form, setBreadcrumbs, id]);

  useEffect(() => {
    const menubarData: MenubarMenuData[] = [
      {
        trigger: "Configurações",
        content: [
          {
            label: "Editar questões",
            onClick: () => router.push(`/dashboard/forms/${id}/edit-questions`),
          },
          {
            label: "Operabilidades",
            onClick: () => router.push(`/dashboard/forms/${id}/operabilities`),
          },
        ],
      },
      {
        trigger: "Respostas",
        content: [
          {
            label: "Visualizar",
            onClick: () => router.push(`/dashboard/forms/${id}/visualizar-respostas`),
          },
          {
            label: "Exportar",
            onClick: () => router.push(`/dashboard/export/${id}`),
          },
        ],
      },
    ];
    setMenubarData(menubarData);

    return () => {
      setMenubarData([]); // Clear menubar data when component unmounts
    };
  }, [id, router, setMenubarData]);

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
    <>
      <div className="w-full border-b py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight">{form.titulo}</h1>
          <p className="text-lg text-muted-foreground mt-2">{form.descricao}</p>
          <p className="text-sm text-muted-foreground">
            Criado em: {new Date(form.criado_em).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Respostas</h2>
        {isLoadingResponses ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <span>Carregando respostas...</span>
          </div>
        ) : responsesError ? (
          <div className="p-4 text-center text-red-500">Erro ao carregar respostas: {responsesError}</div>
        ) : responses.length === 0 ? (
          <p>Nenhuma resposta foi encontrada para este formulário.</p>
        ) : (
          <Table className="w-full">
            <TableCaption>Total de {responses.length} respostas.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Data de Envio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((response) => (
                <TableRow key={response.id} onClick={() => handleRowClick(response)} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>{new Date(response.criado_em).toLocaleString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Resposta</DialogTitle>
            <DialogDescription>
              Resposta enviada em: {selectedResponse?.criado_em ? new Date(selectedResponse.criado_em).toLocaleString("pt-BR") : "N/A"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedResponse?.itens.map((item) => {
              const pergunta = form?.perguntas.find(p => p.id === item.pergunta_id);
              return (
                <div key={item.id} className="grid items-center gap-2">
                  <h4 className="col-span-1 font-bold">{pergunta?.texto || "Pergunta Desconhecida"}:</h4>
                  <div className="col-span-3">{getAnswerValue(item, pergunta)}</div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}