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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface AddBlockDialogProps {
  sendMessage: (message: object) => void
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function AddBlockDialog({ sendMessage, isOpen, onOpenChange }: AddBlockDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const handleAddBlock = () => {
    if (!title.trim()) {
      toast.error("O título do bloco não pode estar vazio.")
      return
    }

    const message = {
      tipo: "update_formulario",
      conteudo: {
        blocos_adicionados: [
          {
            titulo: title,
            descricao: description,
          },
        ],
      },
    }

    sendMessage(message)
    toast.success(`Bloco "${title}" criado com sucesso.`)
    onOpenChange(false)
    setTitle("")
    setDescription("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Bloco</DialogTitle>
          <DialogDescription>
            Crie um novo bloco para agrupar suas perguntas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Título
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Informações Pessoais"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="(Opcional)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleAddBlock}>
            Criar Bloco
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}