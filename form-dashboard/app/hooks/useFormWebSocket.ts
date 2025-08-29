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

  const renewSession = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      });

      if (response.ok) {
        // Tokens refreshed successfully, new access_token is in cookies
        
      } else if (response.status === 401) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        router.push("/login");
      } else {
        
        toast.error("Falha ao renovar a sessão.");
      }
    } catch (error) {
      
      toast.error("Erro de rede ao tentar renovar a sessão.");
    }
  };

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
    
    

    return () => {
        if (socket) {
            socket.close();
            ws.current = null;
        }
    }
  }, [formId, access_token])

  const sendMessage = async (message: object) => {
    // Attempt to renew session if access_token is present (might be expired)
    // The access_token parameter to the hook is the initial one.
    // We need to check if the current access_token from cookies is valid.
    const currentAccessToken = Cookies.get("access_token");

    if (!currentAccessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.");
      router.push("/login");
      return;
    }

    // If the current access token is present, try to renew it proactively
    // This will update the cookie if successful
    await renewSession();

    // After potential renewal, get the latest access token from cookies
    const latestAccessToken = Cookies.get("access_token");

    if (!latestAccessToken) {
      toast.error("Sessão expirada após tentativa de renovação. Por favor, faça login novamente.");
      router.push("/login");
      return;
    }

    // Re-establish WebSocket connection if the token changed or connection is not open
    // This part is crucial. If the token changed, the existing WS connection is likely invalid.
    // The useEffect dependency on access_token should handle this, but a direct check here is safer.
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN || (ws.current.url.includes(`access_token=${access_token}`) && !ws.current.url.includes(`access_token=${latestAccessToken}`))) {
      const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!wsBaseUrl) {
  ;
        toast.error("Configuração de ambiente inválida para a conexão em tempo real.");
        return;
      }
      const newWsUrl = `${wsBaseUrl}/ws/formularios/${formId}?access_token=${latestAccessToken}`;
      if (ws.current) {
        ws.current.close(); // Close old connection if exists
      }
      const newSocket = new WebSocket(newWsUrl);
      ws.current = newSocket;

      // Add event listeners for the new socket
      newSocket.onopen = () => {
        
        // Now send the message after connection is open
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
  ;
   
        setIsLoading(false);
      };
      

      // Return early, message will be sent in onopen of new socket
      return;
    }

    // If WebSocket is already open and token is valid, send message directly
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
      
    } else {
      
      toast.error("Não foi possível enviar a atualização. Verifique sua conexão.")
    }
  }

  return { form, isLoading, error, sendMessage }
}