"use client"

import { ChartAreaInteractive } from "@/components/charts/answers-chart"
import { CaixaSelecaoChart } from "@/components/charts/caixa-selecao-chart"
import { DataChart } from "@/components/charts/data-chart"
import { MultiplaEscolhaChart } from "@/components/charts/multipla-escolha-chart"
import { NpsChart } from "@/components/charts/nps-chart"
import { NumeroChart } from "@/components/charts/numero-chart"

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter }
from "next/navigation"
import { useNavigation } from "@/components/navigation-provider"; // Added this import
import Cookies from "js-cookie"
import { useFormWebSocket } from "@/app/hooks/useFormWebSocket"
import { useResponsesWebSocket } from "@/app/hooks/useResponsesWebSocket"
import { useMenubar } from "@/components/menubar-context";
import { MenubarMenuData } from "@/app/types/menubar";
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
import { Loader2, ChevronDown, Download } from "lucide-react"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";


export default function FormDetailsPage() {
  const params = useParams()
  const router = useRouter();
  const { setMenubarData } = useMenubar();
  const { setPageBreadcrumbs } = useNavigation(); // Added this line
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const [formato, setFormato] = useState("csv");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [fuso, setFuso] = useState("");
  const [separador, setSeparador] = useState(",");
  const [apenasAtivas, setApenasAtivas] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const id = params.id as string
  const access_token = Cookies.get("access_token") || null


  const { form, isLoading, error } = useFormWebSocket(id, access_token);
  const { responses } = useResponsesWebSocket(id, access_token);

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
        // Handle error response
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

  const npsData = useMemo(() => {
    if (!form || !responses) {
      return [];
    }

    const npsPerguntas = form.perguntas.filter(p => p.tipo === 'nps');
    if (npsPerguntas.length === 0) {
      return [];
    }

    return npsPerguntas.map(pergunta => {
      const scoreCounts = Array(11).fill(0).map((_, i) => ({ score: i, count: 0 }));
      let totalResponses = 0;

      responses.forEach(response => {
        const npsItem = response.itens.find(item => item.pergunta_id === pergunta.id);
        if (npsItem && typeof npsItem.valor_numero === 'number') {
          const score = npsItem.valor_numero;
          if (score >= 0 && score <= 10) {
            scoreCounts[score].count++;
            totalResponses++;
          }
        }
      });

      // Still calculate the overall NPS score for the header
      const detractors = scoreCounts.slice(0, 7).reduce((sum, item) => sum + item.count, 0);
      const promoters = scoreCounts.slice(9, 11).reduce((sum, item) => sum + item.count, 0);
      const promoterPercentage = totalResponses > 0 ? (promoters / totalResponses) * 100 : 0;
      const detractorPercentage = totalResponses > 0 ? (detractors / totalResponses) * 100 : 0;
      const npsScore = Math.round(promoterPercentage - detractorPercentage);

      return {
        questionId: pergunta.id,
        questionText: pergunta.texto,
        score: npsScore,
        total: totalResponses,
        scoreCounts: scoreCounts,
      };
    });
  }, [form, responses]);

  useEffect(() => {
    if (form) {
      const title = form.titulo.length > 20 ? `${form.titulo.substring(0, 20)}...` : form.titulo;
      setPageBreadcrumbs([{ title, url: `/formularios/${id}` }]);
    }
  }, [form, id, setPageBreadcrumbs]);


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

  const renderCharts = (perguntas: any[]) => {
    return perguntas.map(pergunta => {
      let chartComponent;
      switch (pergunta.tipo) {
        case 'nps':
          const data = npsData.find(d => d.questionId === pergunta.id);
          if (!data) return null;
          chartComponent = <NpsChart data={data} />;
          break;
        case 'multipla_escolha':
          chartComponent = <MultiplaEscolhaChart pergunta={pergunta} responses={responses} />;
          break;
        case 'numero':
          chartComponent = <NumeroChart pergunta={pergunta} responses={responses} />;
          break;
        case 'data':
          chartComponent = <DataChart pergunta={pergunta} responses={responses} />;
          break;
        case 'caixa_selecao':
          chartComponent = <CaixaSelecaoChart pergunta={pergunta} responses={responses} />;
          break;
        default:
          return null;
      }
      return (
        <div key={pergunta.id} className="masonry-grid-item">
          {chartComponent}
        </div>
      );
    });
  };

  const perguntasSemBloco = form.perguntas
    .filter(p => !p.bloco_id)
    .sort((a, b) => a.ordem_exibicao - b.ordem_exibicao);

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
        <ChartAreaInteractive formId={id}/>
        <div className="space-y-8 mt-8">
          {perguntasSemBloco.length > 0 && (
            <div className="masonry-grid">
              {renderCharts(perguntasSemBloco)}
            </div>
          )}

          {form.blocos.map(bloco => {
            const perguntasDoBloco = form.perguntas
              .filter(p => p.bloco_id === bloco.id)
              .sort((a, b) => a.ordem_exibicao - b.ordem_exibicao);

            if (perguntasDoBloco.length === 0) return null;

            return (
              <Collapsible key={bloco.id} className="space-y-2" defaultOpen={true}>
                <div className="border-b pb-4">
                  <CollapsibleTrigger className="group w-full flex justify-between items-center text-left">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">{bloco.titulo}</h2>
                      {bloco.descricao && <p className="text-muted-foreground">{bloco.descricao}</p>}
                    </div>
                    <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="masonry-grid pt-4">
                    {renderCharts(perguntasDoBloco)}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
    </>
  )
}
