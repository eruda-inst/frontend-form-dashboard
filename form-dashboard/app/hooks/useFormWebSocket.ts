"use client"

import { useState, useEffect, useRef } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Form } from "@/app/types/forms"

export function useFormWebSocket(formId: string | null) {
  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!formId) {
      setIsLoading(false)
      return
    }

    const accessToken = Cookies.get("access_token")
    if (!accessToken) {
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

    const wsUrl = `${wsBaseUrl}/ws/formularios/${formId}`
    const socket = new WebSocket(wsUrl)
    ws.current = socket

    socket.onopen = () => {
      console.log(`WebSocket conectado para o formulário ${formId}.`)
      // A autenticação é feita via cookies enviados na requisição de handshake.
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        // Assumimos que o backend envia o objeto do formulário completo
        // tanto na conexão inicial quanto em atualizações.
        if (data.id && data.titulo) {
          setForm(data)
          setError(null)
        } else {
          console.log("Mensagem WebSocket não reconhecida:", data)
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
  }, [formId, router])

  return { form, isLoading, error }
}