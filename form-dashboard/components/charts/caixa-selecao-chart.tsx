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

export function CaixaSelecaoChart({ formId }: { formId: string }) {
  const accessToken = Cookies.get("access_token") || null
  const { form } = useFormWebSocket(formId, accessToken)
  const { responses, isLoading } = useResponsesWebSocket(formId, accessToken)

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null
  )

  const checkboxQuestions = useMemo(() => {
    return form?.perguntas.filter((p) => p.tipo === "caixa_selecao") || []
  }, [form])

  useEffect(() => {
    if (checkboxQuestions.length > 0 && !selectedQuestionId) {
      setSelectedQuestionId(checkboxQuestions[0].id)
    }
  }, [checkboxQuestions, selectedQuestionId])

  const selectedQuestion = useMemo(() => {
    return checkboxQuestions.find((q) => q.id === selectedQuestionId)
  }, [checkboxQuestions, selectedQuestionId])

  const chartData = useMemo(() => {
    if (!selectedQuestion || !responses) {
      return []
    }

    const optionCounts = new Map<string, number>()
    if ("opcoes" in selectedQuestion && Array.isArray(selectedQuestion.opcoes)) {
      selectedQuestion.opcoes.forEach((opt) => {
        optionCounts.set(opt.texto, 0)
      })
    }

    responses.forEach((response) => {
      response.itens.forEach((item) => {
        if (item.pergunta_id === selectedQuestionId && item.valor_opcao) {
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
  }, [responses, selectedQuestion, selectedQuestionId])

  const chartConfig: ChartConfig = {
    value: {
      label: "Votos",
      color: "var(--chart-1)",
    },
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Respostas de Caixa de Seleção</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[250px]">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <span>Carregando respostas...</span>
        </CardContent>
      </Card>
    )
  }

  if (checkboxQuestions.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Respostas de Caixa de Seleção</CardTitle>
        {checkboxQuestions.length > 1 ? (
          <Select
            value={selectedQuestionId || ""}
            onValueChange={setSelectedQuestionId}
          >
            <SelectTrigger className="w-[280px] mx-auto">
              <SelectValue placeholder="Selecione uma pergunta" />
            </SelectTrigger>
            <SelectContent>
              {checkboxQuestions.map((q) => (
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
