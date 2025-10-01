"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useNavigation } from "@/components/navigation-provider"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CreateIntegrationDialog } from "@/components/create-integration-dialog"

// Mock data for integrations
const initialIntegrations = [
  {
    id: 1,
    endereco: "192.168.1.100",
    porta: 5432,
    usuario: "admin",
    nome_banco: "BancoPrincipal",
    habilitada: true,
    endereco_completo: "192.168.1.100:5432",
    criado_em: "2025-09-27T12:52:37.688Z",
    atualizado_em: "2025-09-27T12:52:37.688Z",
  },
  {
    id: 2,
    endereco: "10.0.0.5",
    porta: 1433,
    usuario: "user_db",
    nome_banco: "BancoSecundario",
    habilitada: false,
    endereco_completo: "10.0.0.5:1433",
    criado_em: "2025-09-26T10:30:00.000Z",
    atualizado_em: "2025-09-26T10:30:00.000Z",
  },
]

export default function IntegracoesPage() {
  const router = useRouter()
  const { setPageBreadcrumbs } = useNavigation()
  const [integrations, setIntegrations] = useState(initialIntegrations)

  const handleIntegrationCreated = (newIntegration: any) => {
    setIntegrations([
      ...integrations,
      { ...newIntegration, id: integrations.length + 1, criado_em: new Date().toISOString() },
    ])
  }

  return (
    <>
      <div className="grid auto-rows-min gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {integrations.length > 0 ? (
          integrations.map((integration) => (
            <Card
              key={integration.id}
              className="cursor-pointer transition-transform duration-300 ease-in-out hover:scale-101"
              onClick={() => router.push(`/integracoes/${integration.id}`)}
            >
              <CardHeader>
                <CardTitle className="truncate">{integration.nome_banco}</CardTitle>
                <CardDescription className="truncate">
                  {integration.endereco_completo}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between text-sm text-muted-foreground">
                <span>{integration.habilitada ? "Habilitada" : "Desabilitada"}</span>
                <span>
                  {new Date(integration.criado_em).toLocaleDateString("pt-BR")}
                </span>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex h-full min-h-[40vh] items-center justify-center rounded-xl border border-dashed">
            <p className="text-muted-foreground">
              Nenhuma integração encontrada.
            </p>
          </div>
        )}
      </div>
      <CreateIntegrationDialog onIntegrationCreated={handleIntegrationCreated} />
    </>
  )
}
