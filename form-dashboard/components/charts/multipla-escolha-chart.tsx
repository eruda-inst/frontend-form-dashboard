import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import { Pergunta } from "@/app/types/forms"
import { Resposta } from "@/app/types/responses"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { NpsChart } from "./nps-chart"
import { useMemo } from "react"

interface MultiplaEscolhaChartProps {
  pergunta: Pergunta;
  responses: Resposta[];
}

export function MultiplaEscolhaChart({ pergunta, responses }: MultiplaEscolhaChartProps) {

  const chartData = useMemo(() => {
    if (!pergunta || !responses || pergunta.tipo !== "multipla_escolha" || !pergunta.opcoes) {
      return []
    }

    const optionCounts = new Map<string, number>()
    pergunta.opcoes.forEach((opt) => {
      optionCounts.set(opt.texto, 0)
    })

    responses.forEach((response) => {
      response.itens.forEach((item) => {
        if (item.pergunta_id === pergunta.id && item.valor_opcao) {
          const count = optionCounts.get(item.valor_opcao.texto)
          if (typeof count === "number") {
            optionCounts.set(item.valor_opcao.texto, count + 1)
          }
        }
      })
    })

    return Array.from(optionCounts.entries()).map(([option, count]) => ({
      option,
      count,
    }))
  }, [responses, pergunta])

  const chartConfig: ChartConfig = useMemo(() => {
    return {
      count: {
        label: "Votos",
        color: "var(--chart-1)",
      },
    }
  }, [])

  if (pergunta.tipo === "multipla_escolha" && Array.isArray(pergunta.opcoes) && pergunta.opcoes.length < 3) {
    const npsChartData = {
      questionText: pergunta.texto,
      scoreCounts: chartData.map((d, i) => ({ score: i, count: d.count, optionText: d.option })),
    };
    return (
      <div className="min-h-[300px]">
        <NpsChart data={npsChartData} />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>{pergunta.texto}</CardTitle>
        <CardDescription>Respostas de múltipla escolha</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <PolarAngleAxis dataKey="option" />
            <PolarGrid />
            <Radar
              dataKey="count"
              fill="var(--color-count)"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="text-muted-foreground">
          Exibindo o total de votos para cada opção.
        </div>
      </CardFooter>
    </Card>
  )
}