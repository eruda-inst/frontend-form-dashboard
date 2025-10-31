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

interface NumeroChartProps {
  pergunta: Pergunta;
  responses: Resposta[];
}

export function NumeroChart({ pergunta, responses }: NumeroChartProps) {
  const { chartData, average, median } = useMemo(() => {
    if (!pergunta || !responses || pergunta.tipo !== "numero") {
      return { chartData: [], average: 0, median: 0 }
    }

    const numberCounts = new Map<number, number>()
    const allNumbers: number[] = []

    responses.forEach((response) => {
      response.itens.forEach((item) => {
        if (
          item.pergunta_id === pergunta.id &&
          typeof item.valor_numero === "number"
        ) {
          const value = item.valor_numero
          allNumbers.push(value)
          const count = numberCounts.get(value) || 0
          numberCounts.set(value, count + 1)
        }
      })
    })

    const data = Array.from(numberCounts.entries())
      .map(([num, count]) => ({
        name: String(num),
        value: count,
      }))
      .sort((a, b) => Number(a.name) - Number(b.name))

    const sum = allNumbers.reduce((acc, val) => acc + val, 0)
    const avg = allNumbers.length > 0 ? sum / allNumbers.length : 0

    allNumbers.sort((a, b) => a - b)
    let med = 0
    if (allNumbers.length > 0) {
      const mid = Math.floor(allNumbers.length / 2)
      med =
        allNumbers.length % 2 !== 0
          ? allNumbers[mid]
          : (allNumbers[mid - 1] + allNumbers[mid]) / 2
    }

    return { chartData: data, average: avg, median: med }
  }, [responses, pergunta])

  const chartConfig: ChartConfig = {
    value: {
      label: "Frequência",
      color: "var(--chart-1)",
    },
  }

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>{pergunta.texto}</CardTitle>
        <CardDescription>Distribuição de respostas numéricas</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height: `${(chartData.length || 1) * 35}px` }}>
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
          Média: <strong>{average.toFixed(2)}</strong>
        </div>
        <div className="text-muted-foreground">
          Mediana: <strong>{median}</strong>
        </div>
      </CardFooter>
    </Card>
  )
}
