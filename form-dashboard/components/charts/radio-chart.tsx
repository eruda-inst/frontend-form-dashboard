"use client"

import { Bar, BarChart, XAxis, YAxis, Radar, RadarChart, PolarAngleAxis, PolarGrid, Pie, PieChart, Cell } from "recharts"
import { useMemo } from "react"

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
import { Pergunta } from "@/app/types/forms"
import { Resposta } from "@/app/types/responses"

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

interface RadioChartProps {
  pergunta: Pergunta;
  responses: Resposta[];
}

export function RadioChart({ pergunta, responses }: RadioChartProps) {
  const chartData = useMemo(() => {
    if (!pergunta || !responses || pergunta.tipo !== "radio" || !pergunta.opcoes) {
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
      name: option,
      value: count,
    }))
  }, [responses, pergunta])

  const chartConfig: ChartConfig = useMemo(() => {
    const config = {};
    chartData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: COLORS[index % COLORS.length],
      };
    });
    return config;
  }, [chartData]);

  const numOptions = pergunta.opcoes?.length || 0;

  const renderChart = () => {
    if (numOptions < 4) {
      return (
        <ChartContainer config={chartConfig} style={{ height: `${(chartData.length || 1) * 35}px` }}>
          <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10 }}>
            <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} tick={{ fill: "hsl(var(--foreground))" }} />
            <XAxis type="number" dataKey="value" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="value" radius={5}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      );
    }
    if (numOptions >= 4 && numOptions <= 6) {
      return (
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="name" />
            <PolarGrid />
            <Radar dataKey="value" fill="var(--chart-1)" fillOpacity={0.6} />
          </RadarChart>
        </ChartContainer>
      );
    }
    if (numOptions > 6) {
      return (
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="value" hideLabel />} />
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>{pergunta.texto}</CardTitle>
        <CardDescription>
          Respostas de opção única (radio)
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        {renderChart()}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="text-muted-foreground">
          Exibindo o total de votos para cada opção.
        </div>
      </CardFooter>
    </Card>
  )
}
