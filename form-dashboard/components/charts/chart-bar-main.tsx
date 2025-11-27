"use client"

import { Resposta } from "@/app/types/responses"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import * as React from "react"
import { DateRange } from "react-day-picker"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import { cn } from "@/lib/utils"

const chartConfig = {
  respostas: {
    label: "Respostas",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface ChartBarMainProps {
  responses: Resposta[] | null;
}

export function ChartBarMain({ responses }: ChartBarMainProps) {
  const [timeRange, setTimeRange] = React.useState("90d")
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -90),
    to: new Date(),
  })
  const [chartData, setChartData] = React.useState<any[]>([])

  React.useEffect(() => {
    const processData = (
      responses: Resposta[] | null,
      range: string,
      customDate: DateRange | undefined
    ) => {
      const countsByDay: { [key: string]: number } = {}
      if (responses) {
        responses.forEach((response) => {
          const date = new Date(response.criado_em).toISOString().split("T")[0]
          countsByDay[date] = (countsByDay[date] || 0) + 1
        })
      }

      const allDates: string[] = []
      if (range === "custom" && customDate?.from && customDate?.to) {
        let currentDate = new Date(customDate.from)
        const endDate = new Date(customDate.to)
        while (currentDate <= endDate) {
          allDates.push(currentDate.toISOString().split("T")[0])
          currentDate.setDate(currentDate.getDate() + 1)
        }
      } else {
        const now = new Date()
        let daysToGenerate = 90
        if (range === "7d") {
          daysToGenerate = 7
        } else if (range === "30d") {
          daysToGenerate = 30
        }

        for (let i = 0; i < daysToGenerate; i++) {
          const d = new Date(now)
          d.setDate(now.getDate() - i)
          allDates.push(d.toISOString().split("T")[0])
        }
      }

      return allDates.sort().map((date) => ({
        date,
        respostas: countsByDay[date] || 0,
      }))
    }
    setChartData(processData(responses, timeRange, date))
  }, [responses, timeRange, date])

  const total = React.useMemo(
    () => (chartData || []).reduce((acc, curr) => acc + curr.respostas, 0),
    [chartData]
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col items-start gap-1">
            <CardTitle>Respostas por Dia</CardTitle>
            <CardDescription>
              {timeRange === "custom" && date?.from && date?.to
                ? `Mostrando respostas de ${format(date.from, "dd/MM/yy")} a ${format(date.to, "dd/MM/yy")}`
                : `Mostrando o total de respostas nos últimos ${
                    timeRange === "90d"
                      ? "90"
                      : timeRange === "30d"
                        ? "30"
                        : "7"
                  } dias`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="custom">Período customizado</SelectItem>
              </SelectContent>
            </Select>
            {timeRange === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-[300px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "}
                          {format(date.to, "LLL dd, y", { locale: ptBR })}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y", { locale: ptBR })
                      )
                    ) : (
                      <span>Escolha uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 pt-4">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">
              Respostas no período
            </span>
            <span className="text-lg font-bold leading-none sm:text-3xl">
              {total.toLocaleString()}
            </span>
          </div>
          <Separator orientation="vertical" className="h-full bg-red-300" />
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">
              Respostas no total
            </span>
            <span className="text-lg font-bold leading-none sm:text-3xl">
              {(responses?.length || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("pt-BR", { timeZone: 'UTC',
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="respostas"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", { timeZone: 'UTC',
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
            <Bar dataKey="respostas" fill="var(--color-respostas)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
