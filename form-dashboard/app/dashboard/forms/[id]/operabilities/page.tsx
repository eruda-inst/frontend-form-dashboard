"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFormWebSocket } from "@/app/hooks/useFormWebSocket";

export default function OperabilitiesPage() {
  const { id: formulario_id } = useParams();
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(false);
  const [slug, setSlug] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  const accessToken = Cookies.get("access_token");
  const { form, updateFormulario } = useFormWebSocket(
    formulario_id as string, // Cast to string as useParams() can return string | string[]
    accessToken ?? null,
  );

  useEffect(() => {
    if (form) {
      setTitulo(form.titulo);
      setDescricao(form.descricao);
    }
  }, [form]);

  useEffect(() => {
    const fetchStatus = async () => {
      const accessToken = Cookies.get("access_token");
      if (!accessToken) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/formularios/${formulario_id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!res.ok) {
          throw new Error("Falha ao buscar o status do formulário.");
        }

        const data = await res.json();
        setIsPublished(data.recebendo_respostas);
        if (data.slug_publico) {
          setSlug(data.slug_publico);
        }
      } catch (error: any) {
        toast.error("Erro ao buscar status do formulário", {
          description: error.message,
        });
      }
    };

    fetchStatus();
  }, [formulario_id]);

  const handleTogglePublish = async (checked: boolean) => {
    const accessToken = Cookies.get("access_token");
    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.");
      return;
    }

    const endpoint = checked ? "publicar" : "despublicar";

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/formularios/${formulario_id}/${endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.detail || `Falha ao ${endpoint} o formulário.`,
        );
      }

      setIsPublished(checked);
      toast.success(
        `Formulário ${checked ? "publicado" : "despublicado"} com sucesso!`,
      );

      if (checked) {
        const data = await res.json();
        setSlug(data.slug_publico as string);
      } else {
        setSlug("");
      }
    } catch (error: any) {
      toast.error(`Erro ao ${endpoint} formulário`, {
        description: error.message,
      });
    }
  };

  const handleDeleteForm = async () => {
    const accessToken = Cookies.get("access_token");
    if (!accessToken) {
      toast.error("Sessão expirada. Por favor, faça login novamente.");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/formularios/${formulario_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Falha ao deletar o formulário.");
      }

      toast.success("Formulário deletado com sucesso!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Erro ao deletar formulário", {
        description: error.message,
      });
    }
  };

  const handleUpdateForm = () => {
    if (updateFormulario) {
      updateFormulario(titulo, descricao);
      toast.success("Formulário atualizado com sucesso!");
    }
  };

  const formUrl = `${process.env.NEXT_PUBLIC_FORM_URL}/form/${slug}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">Configurações de Operabilidade</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações de operabilidade do seu formulário.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Formulário</CardTitle>
          <CardDescription>
            Altere o título e a descrição do seu formulário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="form-title">Título do Formulário</Label>
            <Input
              id="form-title"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="form-description">Descrição do Formulário</Label>
            <Textarea
              id="form-description"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpdateForm}>Salvar Alterações</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publicação</CardTitle>
          <CardDescription>
            Gerencie a visibilidade e o acesso ao seu formulário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
            <Checkbox
              id="toggle-publish"
              checked={isPublished}
              onCheckedChange={handleTogglePublish}
              className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
            />
            <div className="grid gap-1.5 font-normal">
              <p className="text-sm leading-none font-medium">
                Ativar formulário
              </p>
              <p className="text-muted-foreground text-sm">
                Torne seu formulário acessível publicamente para que os usuários
                possam responder.
              </p>
            </div>
          </Label>
          {slug && (
            <div className="space-y-2">
              <Label htmlFor="form-link">Link do formulário</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="form-link"
                  readOnly
                  value={formUrl}
                  className="flex-1 bg-muted/20"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(formUrl);
                    toast.success("Link copiado com sucesso!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis que podem impactar seu formulário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <div className="space-y-1">
              <h3 className="font-semibold">Deletar Formulário</h3>
              <p className="text-sm text-muted-foreground">
                Esta ação é irreversível. Todos os dados do formulário,
                incluindo respostas, serão perdidos.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Deletar</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá deletar
                    permanentemente seu formulário e remover seus dados de nossos
                    servidores.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="delete-confirmation">
                    Para confirmar, digite <strong>deletar</strong> abaixo:
                  </Label>
                  <Input
                    id="delete-confirmation"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleteConfirmation !== "deletar"}
                    onClick={handleDeleteForm}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
