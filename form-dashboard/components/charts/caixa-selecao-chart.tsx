"use client"

import { useMemo } from "react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

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

interface CaixaSelecaoChartProps {
  pergunta: Pergunta;
  responses: Resposta[];
}

export function CaixaSelecaoChart({ pergunta, responses }: CaixaSelecaoChartProps) {
  const chartData = useMemo(() => {
    if (!pergunta || !responses || pergunta.tipo !== "caixa_selecao" || !pergunta.opcoes) {
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

    return Array.from(optionCounts.entries()).map(([name, value]) => ({
      name,
      value,
    }))
  }, [responses, pergunta])

  const chartConfig: ChartConfig = {
    value: {
      label: "Votos",
      color: "var(--chart-1)",
    },
  }

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>{pergunta.texto}</CardTitle>
        <CardDescription>Respostas de caixa de seleção</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="w-full"
          style={{ height: `${(pergunta.opcoes?.length || 6) * 40}px` }}
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 10,
            }}
          >
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            <XAxis type="number" dataKey="value" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" fill="var(--chart-1)" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="text-muted-foreground">
          Exibindo o total de votos para cada opção.
        </div>
      </CardFooter>
    </Card>
  )
}
