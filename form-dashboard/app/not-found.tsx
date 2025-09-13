'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Componente Not Found
 * 
 * Este componente é renderizado pelo Next.js quando uma rota não é encontrada (erro 404).
 * Ele executa um redirecionamento do lado do cliente para a página '/formularios'.
 * 
 * @returns null - O componente não renderiza nenhum conteúdo visível, pois seu único
 * propósito é efetuar o redirecionamento.
 */
export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona o usuário para a página de formulários.
    router.replace('/formularios');
  }, [router]);

  return null;
}
