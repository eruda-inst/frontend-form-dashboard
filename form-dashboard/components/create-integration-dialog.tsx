"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus } from "lucide-react"

interface CreateIntegrationDialogProps {
  onIntegrationCreated: (integration: {
    endereco: string
    porta: number
    usuario: string
    nome_banco: string
    habilitada: boolean
    endereco_completo: string
  }) => void
}
export function CreateIntegrationDialog({ onIntegrationCreated }: CreateIntegrationDialogProps) {
  const [open, setOpen] = useState(false)
  const [endereco, setEndereco] = useState("")
  const [porta, setPorta] = useState(0)
  const [usuario, setUsuario] = useState("")
  const [nomeBanco, setNomeBanco] = useState("")
  const [habilitada, setHabilitada] = useState(true)

  const handleSubmit = () => {
    const newIntegration = {
      endereco,
      porta,
      usuario,
      nome_banco: nomeBanco,
      habilitada,
      endereco_completo: `${endereco}:${porta}`,
    }
    onIntegrationCreated(newIntegration)
    setOpen(false)
    // Reset form
    setEndereco("")
    setPorta(0)
    setUsuario("")
    setNomeBanco("")
    setHabilitada(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-6 z-50 cursor-pointer shadow-lg">
          Nova integração
          <Plus className="h-6 w-6" />
          <span className="sr-only">Nova Integração</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Integração</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da nova integração de banco de dados.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nome_banco" className="text-right">
              Nome do Banco
            </Label>
            <Input
              id="nome_banco"
              value={nomeBanco}
              onChange={(e) => setNomeBanco(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endereco" className="text-right">
              Endereço
            </Label>
            <Input
              id="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="porta" className="text-right">
              Porta
            </Label>
            <Input
              id="porta"
              type="number"
              value={porta}
              onChange={(e) => setPorta(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="usuario" className="text-right">
              Usuário
            </Label>
            <Input
              id="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="habilitada" className="text-right">
              Habilitada
            </Label>
            <Switch
              id="habilitada"
              checked={habilitada}
              onCheckedChange={setHabilitada}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Salvar Integração</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
