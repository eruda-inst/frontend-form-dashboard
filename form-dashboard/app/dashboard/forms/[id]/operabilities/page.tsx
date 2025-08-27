"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Cookies from "js-cookie"
import { toast } from "sonner"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function OperabilitiesPage() {
  const { id: formulario_id } = useParams()
  const [isPublished, setIsPublished] = useState(false)
  const [slug, setSlug] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const fetchStatus = async () => {
      const accessToken = Cookies.get("access_token")
      if (!accessToken) {
        toast.error("Sessão expirada. Por favor, faça login novamente.")
        return
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/formularios/${formulario_id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!res.ok) {
          throw new Error("Falha ao buscar o status do formulário.")
        }

        const data = await res.json()
        setIsPublished(data.recebendo_respostas)
      } catch (error: any) {
        toast.error("Erro ao buscar status do formulário", {
          description: error.message,
        })
      }
    }

    fetchStatus()
  }, [formulario_id])

  const handleTogglePublish = async (checked: boolean) => {
    const accessToken = Cookies.get("access_token")
    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      return
    }

    const endpoint = checked ? "publicar" : "despublicar"

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/formularios/${formulario_id}/${endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || `Falha ao ${endpoint} o formulário.`)
      }

      setIsPublished(checked)
      toast.success(`Formulário ${checked ? "publicado" : "despublicado"} com sucesso!`)

      if (checked) {
        const data = await res.json()
        
        setSlug(data.slug_publico as string)
        setIsDialogOpen(true)
      }
    } catch (error: any) {
      toast.error(`Erro ao ${endpoint} formulário`, { description: error.message })
    }
  }

  const formUrl = `${process.env.NEXT_PUBLIC_FORM_URL}/form/${slug}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações de Operabilidade</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações de operabilidade do seu formulário.
        </p>
      </div>

      <div className="space-y-4">
        <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
          <Checkbox
            id="toggle-publish"
            checked={isPublished}
            onCheckedChange={handleTogglePublish}
            className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
          />
          <div className="grid gap-1.5 font-normal">
            <p className="text-sm leading-none font-medium">Ativar formulário</p>
            <p className="text-muted-foreground text-sm">
              Torne seu formulário acessível publicamente para que os usuários possam
              responder.
            </p>
          </div>
        </Label>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Formulário Publicado!</DialogTitle>
            <DialogDescription>
              Seu formulário está online e pronto para receber respostas. Compartilhe o
              link abaixo:
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input value={formUrl} readOnly />
            <Button onClick={() => navigator.clipboard.writeText(formUrl)}>
              Copiar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
