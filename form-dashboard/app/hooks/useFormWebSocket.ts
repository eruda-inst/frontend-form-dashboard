"use client"

import { useState, useEffect, useRef } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Form } from "@/app/types/forms"

export function useFormWebSocket(formId: string | null, access_token: string | null) {
  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!formId || !access_token) {
      setIsLoading(false)
      return
    }

    if (!access_token) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      return
    }

    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL
    if (!wsBaseUrl) {
      console.error("A variável de ambiente NEXT_PUBLIC_WS_URL não está definida.")
      setError("Configuração de ambiente inválida para a conexão em tempo real.")
      setIsLoading(false)
      return
    }

    const wsUrl = `${wsBaseUrl}/ws/formularios/${formId}?access_token=${access_token}`
    const socket = new WebSocket(wsUrl)
    ws.current = socket

    socket.onopen = () => {
      // Conexão estabelecida
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.tipo && data.conteudo && data.conteudo.id) {
          setForm(data.conteudo)
          setError(null)
        } else {
          // Mensagem WebSocket não reconhecida ou sem conteúdo de formulário
        }
      } catch (e) {
        console.error("Erro ao processar mensagem WebSocket:", e)
        setError("Falha ao processar dados recebidos.")
      } finally {
        setIsLoading(false)
      }
    }

    socket.onerror = (event) => {
      console.error("WebSocket erro:", event)
      setError("Erro de conexão em tempo real.")
      toast.error("Erro na conexão para atualizações em tempo real.")
      setIsLoading(false)
    }

    return () => {
      ws.current?.close()
    }
  }, [formId, router, access_token])

  const sendMessage = (message: object) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
      console.log("Mensagem enviada:", message)
    } else {
      console.error("WebSocket não está conectado. Não foi possível enviar a mensagem.")
      toast.error("Não foi possível enviar a atualização. Verifique sua conexão.")
    }
  }

  return { form, isLoading, error, sendMessage }
}