"use client"

import { ChartAreaInteractive } from "@/components/charts/answers-chart"
import { CaixaSelecaoChart } from "@/components/charts/caixa-selecao-chart"
import { DataChart } from "@/components/charts/data-chart"
import { MultiplaEscolhaChart } from "@/components/charts/multipla-escolha-chart"
import { NpsChart } from "@/components/charts/nps-chart"
import { NumeroChart } from "@/components/charts/numero-chart"

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter }
from "next/navigation"
import Cookies from "js-cookie"
import type { Pergunta } from "@/app/types/forms"
import { useFormWebSocket } from "@/app/hooks/useFormWebSocket"
import { useResponsesWebSocket } from "@/app/hooks/useResponsesWebSocket"
import { useNavigation } from "@/components/navigation-provider"
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
import { Loader2 } from "lucide-react"


export default function FormDetailsPage() {
  const params = useParams()
  const router = useRouter();
  const { setBreadcrumbs } = useNavigation()
  const { setMenubarData } = useMenubar();

  const id = params.id as string
  const access_token = Cookies.get("access_token") || null


  const { form, isLoading, error } = useFormWebSocket(id, access_token);
  const { responses } = useResponsesWebSocket(id, access_token);

 

  useEffect(() => {
    if (form) {
      const breadcrumbs = [
        { title: "Formulários", url: "/dashboard" },
        { title: form.titulo },
      ];
      setBreadcrumbs(breadcrumbs);
    }
  }, [form, setBreadcrumbs]);

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
        <ChartAreaInteractive formId={id}/>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {npsData && npsData.map(data => <NpsChart key={data.questionId} data={data} />)}
          {form.perguntas.some(p => p.tipo === 'multipla_escolha') && <MultiplaEscolhaChart formId={id} />}
          {form.perguntas.some(p => p.tipo === 'numero') && <NumeroChart formId={id} />}
          {form.perguntas.some(p => p.tipo === 'data') && <DataChart formId={id} />}
          {form.perguntas.some(p => p.tipo === 'caixa_selecao') && <CaixaSelecaoChart formId={id} />}
        </div>
    </>
  )
}