"use client"

import { useParams } from "next/navigation"

// Mock data for a single integration - in a real app, you'd fetch this based on the id
const mockIntegration = {
  id: 1,
  endereco: "192.168.1.100",
  porta: 5432,
  usuario: "admin",
  nome_banco: "BancoPrincipal",
  habilitada: true,
  endereco_completo: "192.168.1.100:5432",
  criado_em: "2025-09-27T12:52:37.688Z",
  atualizado_em: "2025-09-27T12:52:37.688Z",
}

export default function IntegracaoDetailPage() {
  const params = useParams()
  const { id } = params

  // Fetch integration data based on id, or use mock data for now
  const integration = mockIntegration // Replace with actual data fetching

  if (!integration) {
    return <div>Integração não encontrada.</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Detalhes da Integração</h1>
      <div className="space-y-2">
        <p><strong>ID:</strong> {id}</p>
        <p><strong>Nome do Banco:</strong> {integration.nome_banco}</p>
        <p><strong>Endereço Completo:</strong> {integration.endereco_completo}</p>
        <p><strong>Usuário:</strong> {integration.usuario}</p>
        <p><strong>Status:</strong> {integration.habilitada ? "Habilitada" : "Desabilitada"}</p>
        <p><strong>Criado em:</strong> {new Date(integration.criado_em).toLocaleString("pt-BR")}</p>
        <p><strong>Atualizado em:</strong> {new Date(integration.atualizado_em).toLocaleString("pt-BR")}</p>
      </div>
    </div>
  )
}
