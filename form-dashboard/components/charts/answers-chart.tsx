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
    color: "rgb(234 179 8)",
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
    const processData = (responses: Resposta[] | null, timeRange: string) => {
      const countsByDay: { [key: string]: number } = {}
      if (responses) {
        responses.forEach((response) => {
          const date = new Date(response.criado_em).toISOString().split("T")[0]
          countsByDay[date] = (countsByDay[date] || 0) + 1
        })
      }

      const allDates: string[] = []
      const now = new Date()
      let daysToGenerate = 90 // Default to 90 days

      if (timeRange === "30d") {
        daysToGenerate = 30
      } else if (timeRange === "7d") {
        daysToGenerate = 7
      }

      for (let i = 0; i < daysToGenerate; i++) {
        const d = new Date(now)
        d.setDate(now.getDate() - i)
        allDates.push(d.toISOString().split("T")[0])
      }

      const data = allDates.sort().map((date) => ({
        date,
        respostas: countsByDay[date] || 0, // Use 0 if no responses for the day
      }))

      return data
    }

    const processedData = processData(responses, timeRange)
    setChartData(processedData)
  }, [responses, timeRange])

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

  if (error) {
    // TODO: Handle error state better, maybe show a toast notification
    console.error("Error fetching chart data:", error)
  }
  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b  sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Respostas por Dia</CardTitle>
          <CardDescription>
            Mostrando o total de respostas nos últimos{" "}
            {timeRange === "90d" ? "90" : timeRange === "30d" ? "30" : "7"} dias
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
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
        </div>
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
                const [year, month, day] = value.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const [year, month, day] = value.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return date.toLocaleDateString("pt-BR");
                  }}
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