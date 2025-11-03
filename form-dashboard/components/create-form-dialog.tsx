"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Form } from "@/app/types/forms"

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
import { Textarea } from "@/components/ui/textarea"

const createFormSchema = z.object({
  titulo: z.string().min(1, { message: "O título não pode estar em branco." }),
  descricao: z
    .string()
    .min(1, { message: "A descrição não pode estar em branco." }),
})

type CreateFormValues = z.infer<typeof createFormSchema>

interface CreateFormDialogProps {
  onFormCreated: (newForm: Form) => void
}

export function CreateFormDialog({ onFormCreated }: CreateFormDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
  })

  const handleCreateForm = async (data: CreateFormValues) => {
    const accessToken = Cookies.get("access_token")
    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.")
      router.push("/login")
      return
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/formularios/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ ...data, perguntas: [] }),
        }
      )

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Falha ao criar o formulário.")
      }

      const newForm = await res.json()
      onFormCreated(newForm)
      setIsOpen(false)

      toast.success(`Formulário "${data.titulo}" criado!`, {
        description: "Você será redirecionado em breve.",
      })
      router.push(`/formularios/${newForm.id}`)
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "Ocorreu um erro desconhecido."
      toast.error("Erro ao criar formulário", { description })
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          reset()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-6 z-50 cursor-pointer shadow-lg">
          Novo formulário
          <Plus className="h-6 w-6" />
          <span className="sr-only">Novo Formulário</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Formulário</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para criar um novo formulário.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleCreateForm)}
          className="grid gap-4 py-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              placeholder="Ex: Pesquisa de Satisfação"
              {...register("titulo")}
            />
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-500">
                {errors.titulo.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o objetivo deste formulário."
              {...register("descricao")}
            />
            {errors.descricao && (
              <p className="mt-1 text-sm text-red-500">
                {errors.descricao.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Criar formulário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}