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
    // 1. Verificando a variável de ambiente
    console.log("useFormWebSocket: Lendo NEXT_PUBLIC_WS_URL do ambiente:", process.env.NEXT_PUBLIC_WS_URL);
    console.log("useFormWebSocket: formId:", formId, "access_token:", access_token);
    
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

    // A autenticação da conexão WebSocket é feita via token na URL.
    // O navegador não enviaria o cookie 'access_token' de localhost para um domínio diferente (IP).
    const wsUrl = `${wsBaseUrl}/ws/formularios/${formId}?access_token=${access_token}`
    console.log("useFormWebSocket: Tentando conectar a:", wsUrl); // 2. Verificando a URL final
    const socket = new WebSocket(wsUrl)
    ws.current = socket

    socket.onopen = () => {
      console.log(`WebSocket conectado para o formulário ${formId}.`)
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        // O backend agora envia um objeto com 'tipo' e 'conteudo'.
        // O conteúdo em si é o objeto do formulário.
        if (data.tipo && data.conteudo && data.conteudo.id) {
          setForm(data.conteudo)
          setError(null)
        } else {
          // Se a mensagem não tiver a estrutura esperada, logamos um aviso.
          console.warn("Mensagem WebSocket não reconhecida ou sem conteúdo de formulário:", data)
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

  return { form, isLoading, error }
}