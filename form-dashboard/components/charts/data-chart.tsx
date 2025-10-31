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

interface DataChartProps {
  pergunta: Pergunta;
  responses: Resposta[];
}

export function DataChart({ pergunta, responses }: DataChartProps) {
  const chartData = useMemo(() => {
    if (!pergunta || !responses || pergunta.tipo !== "data") {
      return []
    }

    const dateCounts = new Map<string, number>()

    responses.forEach((response) => {
      response.itens.forEach((item) => {
        if (
          item.pergunta_id === pergunta.id &&
          typeof item.valor_texto === "string"
        ) {
          const date = item.valor_texto
          const count = dateCounts.get(date) || 0
          dateCounts.set(date, count + 1)
        }
      })
    })

    return Array.from(dateCounts.entries())
      .map(([date, count]) => ({
        name: new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" }), // Format date for display
        value: count,
        rawDate: date,
      }))
      .sort(
        (a, b) =>
          new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
      )
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
        <CardDescription>Frequência de respostas por data</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height: `${(chartData.length || 1) * 35}px` }}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 20, // Increased margin to accommodate date labels
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
          Exibindo a frequência de respostas por data.
        </div>
      </CardFooter>
    </Card>
  )
}
