import { useState, useEffect, useRef } from 'react';
import { Resposta } from '@/app/types/responses';

export const useResponsesWebSocket = (formId: string, accessToken: string | null) => {
  const [responses, setResponses] = useState<Resposta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!formId || !accessToken) {
      setError("Form ID or access token is missing.");
      setIsLoading(false);
      return;
    }

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws/respostas/formulario/${formId}?access_token=${accessToken}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
        console.log("WebSocket for responses opened.");
        setIsLoading(false);
    }

    ws.current.onmessage = (event) => {
      console.log("Raw WebSocket message for responses:", event.data);
      try {
        const data = JSON.parse(event.data);
        console.log("Parsed WebSocket data for responses:", data);
        if (data.tipo === 'bootstrap_respostas' && Array.isArray(data.dados)) {
          setResponses(data.dados);
          console.log("Responses after bootstrap:", data.dados);
          setIsLoading(false); // Set loading to false only when response data is received
        } else if (data.tipo === 'nova_resposta') {
          setResponses(prevResponses => {
            const newResponses = [data.dados, ...prevResponses];
            console.log("Responses after new response:", newResponses);
            return newResponses;
          });
        } else {
          console.warn("Unhandled WebSocket message type for responses:", data.tipo);
        }
      } catch (e) {
        console.error("Failed to parse response data from WebSocket:", e);
        setError("Failed to parse response data from WebSocket.");
        setIsLoading(false); // Set loading to false on error
      }
    };

    ws.current.onerror = (err) => {
      console.error("WebSocket error for responses:", err);
      setError("WebSocket error for responses.");
      setIsLoading(false);
    };

    ws.current.onclose = (event) => {
        console.log("WebSocket for responses closed:", event);
        if (event.code !== 1000) { // 1000 is normal closure
            setError("WebSocket closed unexpectedly");
        }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [formId, accessToken]);

  return { responses, isLoading, error };
};