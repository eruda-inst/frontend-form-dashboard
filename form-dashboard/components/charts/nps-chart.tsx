"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"

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

interface NpsChartProps {
  data: {
    questionText: string
    scoreCounts: {
      score: number
      count: number
    }[]
  }
}

export function NpsChart({ data }: NpsChartProps) {
  const chartData = data.scoreCounts
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: String(item.score),
      value: item.count,
    }))

  const chartConfig: ChartConfig = {
    value: {
      label: "Respostas",
      color: "var(--chart-1)",
    },
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{data.questionText}</CardTitle>
        <CardDescription>Distribuição de respostas NPS</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
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
        <div className="text-muted-foreground leading-none">
          Exibindo o total de respostas para cada nota.
        </div>
      </CardFooter>
    </Card>
  )
}
