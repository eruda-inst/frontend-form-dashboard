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

    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL
    if (!wsBaseUrl) {
      setError("Configuração de ambiente inválida para a conexão em tempo real.")
      setIsLoading(false)
      return
    }

    const wsUrl = `${wsBaseUrl}/ws/formularios/${formId}?access_token=${access_token}`
    const socket = new WebSocket(wsUrl)
    ws.current = socket

    socket.onopen = () => {
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.tipo && data.conteudo && data.conteudo.id) {
          setForm(data.conteudo);
          setError(null);
          setIsLoading(false);
        } else {
        }
      } catch (e) {
        setError("Falha ao processar dados recebidos.");
        setIsLoading(false);
      }
    };

    socket.onerror = (event) => {
      // Do not set a fatal error state here, as Strict Mode can cause transient errors.
      // The connection will close and the effect will retry.
      // setError("Erro de conexão em tempo real.") 
      setIsLoading(false)
    }
    
    socket.onclose = (event) => {
      // Codigo 4001 é um codigo não-oficial que pode ser usado para indicar que o token de acesso expirou.
    };

    return () => {
        if (socket) {
            socket.close();
            ws.current = null;
        }
    }
  }, [formId, access_token])

  const sendMessage = async (message: object) => {
    const currentAccessToken = Cookies.get("access_token");

    if (!currentAccessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.");
      router.push("/login");
      return;
    }

    // await renewSession();

    const latestAccessToken = Cookies.get("access_token");

    if (!latestAccessToken) {
      toast.error("Sessão expirada após tentativa de renovação. Por favor, faça login novamente.");
      router.push("/login");
      return;
    }

    if (!ws.current || ws.current.readyState !== WebSocket.OPEN || (ws.current.url.includes(`access_token=${access_token}`) && !ws.current.url.includes(`access_token=${latestAccessToken}`))) {
      const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!wsBaseUrl) {
        toast.error("Configuração de ambiente inválida para a conexão em tempo real.");
        return;
      }
      const newWsUrl = `${wsBaseUrl}/ws/formularios/${formId}?access_token=${latestAccessToken}`;
      if (ws.current) {
        ws.current.close();
      }
      const newSocket = new WebSocket(newWsUrl);
      ws.current = newSocket;

      newSocket.onopen = () => {
        if (newSocket.readyState === WebSocket.OPEN) {
          newSocket.send(JSON.stringify(message));
        }
      };
      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.tipo && data.conteudo && data.conteudo.id) {
            setForm(data.conteudo);
            setError(null);
            setIsLoading(false);
          } else {
          }
        } catch (e) {
          setError("Falha ao processar dados recebidos.");
          setIsLoading(false);
        }
      };
      newSocket.onerror = (event) => {
        setIsLoading(false);
      };
      
      newSocket.onclose = (event) => {
      };

      return;
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      toast.error("Não foi possível enviar a atualização. Verifique sua conexão.")
    }
  }

  const updateFormulario = (titulo: string, descricao: string) => {
    const message = {
      tipo: "update_formulario",
      conteudo: {
        titulo,
        descricao,
      },
    };
    sendMessage(message);
  };

  return { form, isLoading, error, sendMessage, updateFormulario };
}