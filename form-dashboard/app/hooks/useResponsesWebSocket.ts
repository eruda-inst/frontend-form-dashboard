import { useState, useEffect, useRef } from 'react';
import { Resposta } from '@/app/types/responses';
import { User } from '@/app/types/user';

export const useResponsesWebSocket = (formId: string, accessToken: string | null) => {
  const [responses, setResponses] = useState<Resposta[]>([]);
  const [usersInRoom, setUsersInRoom] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (!formId || !accessToken) {
      setError("Form ID or access token is missing.");
      setIsLoading(false);
      return;
    }

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws/respostas/formulario/${formId}?access_token=${accessToken}`;
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      console.log("WebSocket for responses opened.");
      setIsLoading(false);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      setError(null); // Clear error on successful connection
    };

    socket.onmessage = (event) => {
      console.log("Raw WebSocket message for responses:", event.data);
      try {
        const data = JSON.parse(event.data);
        console.log("Parsed WebSocket data for responses:", data);
        if (data.tipo === 'bootstrap_respostas' && Array.isArray(data.dados)) {
          setResponses(data.dados);
          console.log("Responses after bootstrap:", data.dados);
          setIsLoading(false);
        } else if (data.tipo === 'nova_resposta' || data.tipo === 'resposta_criada') {
          console.log("New response received, updating state:", data.dados);
          setResponses(prevResponses => {
            const newResponseArray = [data.dados, ...prevResponses];
            console.log("New responses array:", newResponseArray);
            return newResponseArray;
          });
        } else if (data.tipo === 'usuarios_na_sala_respostas') {
          setUsersInRoom(data.usuarios);
        } else {
          console.warn("Unhandled WebSocket message type for responses:", data.tipo);
        }
      } catch (e) {
        console.error("Failed to parse response data from WebSocket:", e);
        setError("Failed to parse response data from WebSocket.");
        setIsLoading(false);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error for responses:", err);
      setError("WebSocket error for responses.");
      setIsLoading(false);
    };

    socket.onclose = (event) => {
      console.log("WebSocket for responses closed:", event);
      if (event.code !== 1000) { // Not a normal closure
        setError("WebSocket closed unexpectedly. Reconnecting...");
        // Always attempt to reconnect after a delay
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, 3000); // Attempt to reconnect after 3 seconds
      } else {
        // Normal closure, clear any pending reconnect attempts
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      }
    };
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.onclose = null; // Prevent onclose from firing on manual close
        ws.current.close();
      }
    };
  }, [formId, accessToken]);

  return { responses, usersInRoom, isLoading, error };
};