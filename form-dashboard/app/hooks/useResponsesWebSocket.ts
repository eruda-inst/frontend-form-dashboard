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
        setIsLoading(false);
    }

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.tipo === 'bootstrap_respostas' && Array.isArray(data.dados)) {
          setResponses(data.dados);
        } else if (data.tipo === 'nova_resposta') {
          setResponses(prevResponses => [data.dados, ...prevResponses]);
        } 
      } catch (e) {
        setError("Failed to parse response data from WebSocket.");
      } finally {
        if (isLoading) {
          setIsLoading(false);
        }
      }
    };

    ws.current.onerror = (err) => {
      setError("WebSocket error for responses.");
      setIsLoading(false);
    };

    ws.current.onclose = (event) => {
        if (event.code !== 1000) { // 1000 is normal closure
            setError("WebSocket closed unexpectedly");
        }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [formId, accessToken, isLoading]);

  return { responses, isLoading, error };
};