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

export function DataChart({ formId }: { formId: string }) {
  const accessToken = Cookies.get("access_token") || null
  const { form } = useFormWebSocket(formId, accessToken)
  const { responses, isLoading } = useResponsesWebSocket(formId, accessToken)

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null
  )

  const dateQuestions = useMemo(() => {
    return form?.perguntas.filter((p) => p.tipo === "data") || []
  }, [form])

  useEffect(() => {
    if (dateQuestions.length > 0 && !selectedQuestionId) {
      setSelectedQuestionId(dateQuestions[0].id)
    }
  }, [dateQuestions, selectedQuestionId])

  const selectedQuestion = useMemo(() => {
    return dateQuestions.find((q) => q.id === selectedQuestionId)
  }, [dateQuestions, selectedQuestionId])

  const chartData = useMemo(() => {
    if (!selectedQuestion || !responses) {
      return []
    }

    const dateCounts = new Map<string, number>()

    responses.forEach((response) => {
      response.itens.forEach((item) => {
        if (
          item.pergunta_id === selectedQuestionId &&
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
          <CardTitle>Respostas de Data</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[250px]">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <span>Carregando respostas...</span>
        </CardContent>
      </Card>
    )
  }

  if (dateQuestions.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Respostas de Data</CardTitle>
        {dateQuestions.length > 1 ? (
          <Select
            value={selectedQuestionId || ""}
            onValueChange={setSelectedQuestionId}
          >
            <SelectTrigger className="w-[280px] mx-auto">
              <SelectValue placeholder="Selecione uma pergunta" />
            </SelectTrigger>
            <SelectContent>
              {dateQuestions.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.texto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <CardDescription>{selectedQuestion?.texto}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
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
