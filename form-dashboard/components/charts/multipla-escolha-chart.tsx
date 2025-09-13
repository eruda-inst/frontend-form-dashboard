import { Bar, BarChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, XAxis, YAxis } from "recharts"

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
import { NpsChart } from "./nps-chart"
import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import Cookies from "js-cookie"

export function MultiplaEscolhaChart({ formId }: { formId: string }) {
  const accessToken = Cookies.get("access_token") || null
  const { form } = useFormWebSocket(formId, accessToken)
  const { responses, isLoading } = useResponsesWebSocket(formId, accessToken)

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null
  )

  const multiChoiceQuestions = useMemo(() => {
    return form?.perguntas.filter((p) => p.tipo === "multipla_escolha") || []
  }, [form])

  useEffect(() => {
    if (multiChoiceQuestions.length > 0 && !selectedQuestionId) {
      setSelectedQuestionId(multiChoiceQuestions[0].id)
    }
  }, [multiChoiceQuestions, selectedQuestionId])

  const selectedQuestion = useMemo(() => {
    return multiChoiceQuestions.find((q) => q.id === selectedQuestionId)
  }, [multiChoiceQuestions, selectedQuestionId])

  const chartData = useMemo(() => {
    if (!selectedQuestion || !responses) {
      return []
    }

    if (selectedQuestion.tipo !== "multipla_escolha" || !selectedQuestion.opcoes) {
      return []
    }

    const optionCounts = new Map<string, number>()
    selectedQuestion.opcoes.forEach((opt) => {
      optionCounts.set(opt.texto, 0)
    })

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

    return Array.from(optionCounts.entries()).map(([option, count]) => ({
      option,
      count,
    }))
  }, [responses, selectedQuestion, selectedQuestionId])

  const chartConfig: ChartConfig = useMemo(() => {
    return {
      count: {
        label: "Votos",
        color: "var(--chart-1)",
      },
    }
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Respostas de Múltipla Escolha</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[250px]">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <span>Carregando respostas...</span>
        </CardContent>
      </Card>
    )
  }

  if (multiChoiceQuestions.length === 0) {
    return null // Or a message indicating no multiple choice questions
  }

  if (
    selectedQuestion &&
    selectedQuestion.tipo === "multipla_escolha" &&
    Array.isArray((selectedQuestion as any).opcoes) &&
    (selectedQuestion as any).opcoes.length < 3
  ) {
    const opcoes = (selectedQuestion as any).opcoes;
    const npsChartData = {
      questionText: selectedQuestion.texto,
      scoreCounts: chartData.map((d, i) => ({ score: i, count: d.count, optionText: d.option })),
    };
    console.log("NpsChart data prepared:", npsChartData);
    return (
      <div className="min-h-[300px]">
        <NpsChart data={npsChartData} />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>{selectedQuestion?.texto}</CardTitle>
        {multiChoiceQuestions.length > 1 ? (
          <Select
            value={selectedQuestionId || ""}
            onValueChange={setSelectedQuestionId}
          >
            <SelectTrigger className="w-[280px] mx-auto">
              <SelectValue placeholder="Selecione uma pergunta" />
            </SelectTrigger>
            <SelectContent>
              {multiChoiceQuestions.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.texto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <CardDescription>Respostas de múltipla escolha</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <PolarAngleAxis dataKey="option" />
            <PolarGrid />
            <Radar
              dataKey="count"
              fill="var(--color-count)"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="text-muted-foreground">
          Exibindo o total de votos para cada opção.
        </div>
      </CardFooter>
    </Card>
  )
}