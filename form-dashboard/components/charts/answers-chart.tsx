"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import Cookies from "js-cookie"
import { Loader2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useResponsesWebSocket } from "@/app/hooks/useResponsesWebSocket"
import { Resposta } from "@/app/types/responses"

const chartConfig = {
  respostas: {
    label: "Respostas",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

interface ChartAreaInteractiveProps {
  formId: string;
}

export function ChartAreaInteractive({ formId }: ChartAreaInteractiveProps) {
  const [timeRange, setTimeRange] = React.useState("90d")
  const [chartData, setChartData] = React.useState<any[]>([])
  const accessToken = Cookies.get("access_token") || null
  const { responses, isLoading, error } = useResponsesWebSocket(formId, accessToken)

  React.useEffect(() => {
    const processData = (responses: Resposta[]) => {
      const countsByDay: { [key: string]: number } = {}
      responses.forEach((response) => {
        const date = new Date(response.criado_em).toISOString().split("T")[0]
        countsByDay[date] = (countsByDay[date] || 0) + 1
      })

      const data = Object.keys(countsByDay).map((date) => ({
        date,
        respostas: countsByDay[date],
      }))
      return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    if (responses) {
      const processedData = processData(responses)
      setChartData(processedData)
    }
  }, [responses])

  const filteredData = React.useMemo(() => {
    const now = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    
    return chartData.filter((item) => new Date(item.date) >= startDate)
  }, [chartData, timeRange])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>Carregando dados do gráfico...</span>
      </div>
    )
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Erro ao carregar dados: {error}</div>
  }

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Respostas por Dia</CardTitle>
          <CardDescription>
            Mostrando o total de respostas nos últimos {timeRange === "90d" ? "90" : timeRange === "30d" ? "30" : "7"} dias
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Últimos 90 dias
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Últimos 30 dias
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Últimos 7 dias
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillRespostas" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-respostas)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-respostas)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => new Date(value).toLocaleDateString("pt-BR")}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="respostas"
              type="natural"
              fill="url(#fillRespostas)"
              stroke="var(--color-respostas)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}