"use client"

import { useEffect, useMemo, useState } from "react"
import Cookies from "js-cookie"
import { Loader2 } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

import { useFormWebSocket } from "@/app/hooks/useFormWebSocket"
import { useResponsesWebSocket } from "@/app/hooks/useResponsesWebSocket"
import { Pergunta } from "@/app/types/forms"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function NumeroChart({ formId }: { formId: string }) {
  const accessToken = Cookies.get("access_token") || null
  const { form } = useFormWebSocket(formId, accessToken)
  const { responses, isLoading } = useResponsesWebSocket(formId, accessToken)

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null
  )

  const numberQuestions = useMemo(() => {
    return form?.perguntas.filter((p) => p.tipo === "numero") || []
  }, [form])

  useEffect(() => {
    if (numberQuestions.length > 0 && !selectedQuestionId) {
      setSelectedQuestionId(numberQuestions[0].id)
    }
  }, [numberQuestions, selectedQuestionId])

  const selectedQuestion = useMemo(() => {
    return numberQuestions.find((q) => q.id === selectedQuestionId)
  }, [numberQuestions, selectedQuestionId])

  const { chartData, average, median } = useMemo(() => {
    if (!selectedQuestion || !responses) {
      return { chartData: [], average: 0, median: 0 }
    }

    const numberCounts = new Map<number, number>()
    const allNumbers: number[] = []

    responses.forEach((response) => {
      response.itens.forEach((item) => {
        if (
          item.pergunta_id === selectedQuestionId &&
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
  }, [responses, selectedQuestion, selectedQuestionId])

  const chartConfig: ChartConfig = {
    value: {
      label: "Frequência",
      color: "var(--chart-1)",
    },
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Respostas de Número</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[250px]">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <span>Carregando respostas...</span>
        </CardContent>
      </Card>
    )
  }

  if (numberQuestions.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>{selectedQuestion?.texto}</CardTitle>
        {numberQuestions.length > 1 ? (
          <Select
            value={selectedQuestionId || ""}
            onValueChange={setSelectedQuestionId}
          >
            <SelectTrigger className="w-[280px] mx-auto">
              <SelectValue placeholder="Selecione uma pergunta" />
            </SelectTrigger>
            <SelectContent>
              {numberQuestions.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.texto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <CardDescription>Distribuição de respostas</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
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
