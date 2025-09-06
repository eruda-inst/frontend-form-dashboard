"use client"

import { useState, useEffect, useRef } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Form } from "@/app/types/forms"

export function useFormWebSocket(formId: string | null, access_token: string | null) {
  console.log("useFormWebSocket hook called with formId:", formId);
  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const router = useRouter()

  const renewSession = async () => {
    console.log("Attempting to renew session...");
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      });

      if (response.ok) {
        console.log("Session renewed successfully.");
      } else if (response.status === 401) {
        console.error("Session expired, redirecting to login.");
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        router.push("/login");
      } else {
        console.error("Failed to renew session with status:", response.status);
        toast.error("Falha ao renovar a sessão.");
      }
    } catch (error) {
      console.error("Network error during session renewal:", error);
      toast.error("Erro de rede ao tentar renovar a sessão.");
    }
  };

  useEffect(() => {
    console.log("useEffect triggered. formId:", formId, "access_token:", !!access_token);
    if (!formId || !access_token) {
      console.log("formId or access_token is missing, aborting WebSocket connection.");
      setIsLoading(false)
      return
    }

    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL
    if (!wsBaseUrl) {
      console.error("NEXT_PUBLIC_WS_URL is not set.");
      setError("Configuração de ambiente inválida para a conexão em tempo real.")
      setIsLoading(false)
      return
    }

    const wsUrl = `${wsBaseUrl}/ws/formularios/${formId}?access_token=${access_token}`
    console.log("Connecting to WebSocket at:", wsUrl);
    const socket = new WebSocket(wsUrl)
    ws.current = socket

    socket.onopen = () => {
      console.log("WebSocket connection opened.");
    }

    socket.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
      try {
        const data = JSON.parse(event.data);
        console.log("Parsed WebSocket data:", data);

        if (data.tipo && data.conteudo && data.conteudo.id) {
          console.log("Setting form data from WebSocket message.");
          setForm(data.conteudo);
          setError(null);
          setIsLoading(false);
        } else {
          console.warn("Received malformed WebSocket data:", data);
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
        setError("Falha ao processar dados recebidos.");
        setIsLoading(false);
      }
    };

    socket.onerror = (event) => {
      console.error("WebSocket error:", event);
      // Do not set a fatal error state here, as Strict Mode can cause transient errors.
      // The connection will close and the effect will retry.
      // setError("Erro de conexão em tempo real.") 
      setIsLoading(false)
    }
    
    socket.onclose = (event) => {
      console.log("WebSocket connection closed:", event);
      // Codigo 4001 é um codigo não-oficial que pode ser usado para indicar que o token de acesso expirou.
      if (event.code === 4001) {
        renewSession();
      }
    };

    return () => {
        if (socket) {
            console.log("Closing WebSocket connection.");
            socket.close();
            ws.current = null;
        }
    }
  }, [formId, access_token])

  const sendMessage = async (message: object) => {
    console.log("sendMessage called with message:", message);
    const currentAccessToken = Cookies.get("access_token");

    if (!currentAccessToken) {
      console.error("No access token found, redirecting to login.");
      toast.error("Sessão expirada. Por favor, faça login novamente.");
      router.push("/login");
      return;
    }

    // await renewSession();

    const latestAccessToken = Cookies.get("access_token");

    if (!latestAccessToken) {
      console.error("No access token after session renewal, redirecting to login.");
      toast.error("Sessão expirada após tentativa de renovação. Por favor, faça login novamente.");
      router.push("/login");
      return;
    }

    if (!ws.current || ws.current.readyState !== WebSocket.OPEN || (ws.current.url.includes(`access_token=${access_token}`) && !ws.current.url.includes(`access_token=${latestAccessToken}`))) {
      console.log("Re-establishing WebSocket connection.");
      const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!wsBaseUrl) {
        console.error("NEXT_PUBLIC_WS_URL is not set for re-establishing connection.");
        toast.error("Configuração de ambiente inválida para a conexão em tempo real.");
        return;
      }
      const newWsUrl = `${wsBaseUrl}/ws/formularios/${formId}?access_token=${latestAccessToken}`;
      console.log("New WebSocket URL:", newWsUrl);
      if (ws.current) {
        console.log("Closing existing WebSocket connection before creating a new one.");
        ws.current.close();
      }
      const newSocket = new WebSocket(newWsUrl);
      ws.current = newSocket;

      newSocket.onopen = () => {
        console.log("New WebSocket connection opened, sending message.");
        if (newSocket.readyState === WebSocket.OPEN) {
          newSocket.send(JSON.stringify(message));
          console.log("Message sent over new WebSocket connection.");
        }
      };
      newSocket.onmessage = (event) => {
        console.log("New WebSocket message received:", event.data);
        try {
          const data = JSON.parse(event.data);
          console.log("Parsed new WebSocket data:", data);

          if (data.tipo && data.conteudo && data.conteudo.id) {
            console.log("Setting form data from new WebSocket message.");
            setForm(data.conteudo);
            setError(null);
            setIsLoading(false);
          } else {
            console.warn("Received malformed new WebSocket data:", data);
          }
        } catch (e) {
          console.error("Error parsing new WebSocket message:", e);
          setError("Falha ao processar dados recebidos.");
          setIsLoading(false);
        }
      };
      newSocket.onerror = (event) => {
        console.error("New WebSocket error:", event);
        setIsLoading(false);
      };
      
      newSocket.onclose = (event) => {
        console.log("New WebSocket connection closed:", event);
      };

      return;
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log("Sending message over existing WebSocket connection.");
      ws.current.send(JSON.stringify(message))
      console.log("Message sent.");
    } else {
      console.error("Could not send message, WebSocket not open. State:", ws.current?.readyState);
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