"use client"
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { useFormWebSocket } from "@/app/hooks/useFormWebSocket"
import { useDashboard } from "@/components/dashboard-context"
import { useMenubar } from "@/components/menubar-context";
import { MenubarMenuData } from "@/app/types/menubar";
import { Loader2, Download } from "lucide-react"
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
import { TypographyH2 } from "@/components/ui/typography";
import type { Resposta, RespostaItem } from "@/app/types/responses";
import type { Pergunta } from "@/app/types/forms";
import { useResponsesWebSocket } from "@/app/hooks/useResponsesWebSocket";
import { useNavigation } from "@/components/navigation-provider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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

  return item.valor_texto || item.valor_numero?.toString() || item.valor_opcao?.texto || item.valor_opcao_texto || "N/A";
};


export default function FormDetailsPage() {
  const params = useParams()
  const router = useRouter();
  const { setUsersInRoom } = useDashboard();
  const { setPageBreadcrumbs } = useNavigation();
  
  const id = params.id as string
  const access_token = Cookies.get("access_token") || null
  
  const { setMenubarData } = useMenubar();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [formato, setFormato] = useState("csv");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [fuso, setFuso] = useState("");
  const [separador, setSeparador] = useState(",");
  const [apenasAtivas, setApenasAtivas] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
        }
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
          onClick: () => setIsExportDialogOpen(true),
        },
      ],
    },
  ];
  setMenubarData(menubarData);

  return () => {
    setMenubarData([]); // Clear menubar data when component unmounts
  };
}, [id, router, setMenubarData]);


  const { form, isLoading, error } = useFormWebSocket(id, access_token)
  const { responses, usersInRoom, isLoading: isLoadingResponses, error: responsesError } = useResponsesWebSocket(id, access_token);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<Resposta | null>(null);

  const handleRowClick = (response: Resposta) => {
    setSelectedResponse(response);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    if (form) {
      const formTitle = form.titulo.length > 20 ? `${form.titulo.substring(0, 20)}...` : form.titulo;
      setPageBreadcrumbs([
        { title: formTitle, url: `/formularios/${id}` },
        { title: "Visualizar Respostas" },
      ]);
    }
  }, [form, id, setPageBreadcrumbs]);

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

      <div className="w-full border-b py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl tracking-tight">{form.titulo}</h1>
          <p className="text-lg text-muted-foreground mt-2">{form.descricao}</p>
          <p className="text-sm text-muted-foreground">
            Criado em: {new Date(form.criado_em).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TypographyH2>Respostas</TypographyH2>
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
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>Total de {responses.length} respostas.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Data de Envio</TableHead>
                  {form.perguntas.map((pergunta) => (
                    <TableHead key={pergunta.id} className="min-w-[200px]">{pergunta.texto}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.map((response) => (
                  <TableRow key={response.id} onClick={() => handleRowClick(response)} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium w-[200px]">{new Date(response.criado_em).toLocaleString("pt-BR")}</TableCell>
                    {form.perguntas.map((pergunta) => {
                      const items = response.itens.filter(item => item.pergunta_id === pergunta.id);
                      const answerValues = items.map(item => getAnswerValue(item, pergunta)).join(', ');
                      return (
                        <TableCell key={pergunta.id} className="min-w-[200px]">{answerValues || "N/A"}</TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
            {(() => {
              if (!selectedResponse) return null;

              const itemsByQuestion = selectedResponse.itens.reduce((acc, item) => {
                acc[item.pergunta_id] = acc[item.pergunta_id] || [];
                acc[item.pergunta_id].push(item);
                return acc;
              }, {} as Record<string, RespostaItem[]>);

              return Object.entries(itemsByQuestion).map(([perguntaId, items]) => {
                const pergunta = form?.perguntas.find(p => p.id === perguntaId);
                const answerValues = items.map(item => getAnswerValue(item, pergunta)).join(', ');
                return (
                  <div key={perguntaId} className="grid grid-cols-1 items-center gap-1">
                    <h4 className="font-bold">{pergunta?.texto || "Pergunta Desconhecida"}:</h4>
                    <div className="">{answerValues}</div>
                  </div>
                );
              });
            })()}
          </div>
          
        </DialogContent>
      </Dialog>
    </>
  )
}
