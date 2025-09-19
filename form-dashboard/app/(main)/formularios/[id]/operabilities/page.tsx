"use client";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";

import { useMenubar } from "@/components/menubar-context";
import { MenubarMenuData } from "@/app/types/menubar";

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
import {
  TypographyH1,
  TypographyH3,
  TypographyMuted,
  TypographyP,
  TypographySmall,
} from "@/components/ui/typography";
import { useNavigation } from "@/components/navigation-provider";

export default function OperabilitiesPage() {
  const { id: formulario_id } = useParams();
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(false);
  const [slug, setSlug] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [titulo, setTitulo] = useState("");
  const [originalTitulo, setOriginalTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [originalDescricao, setOriginalDescricao] = useState("");
  const [hasChanges, setHasChanges] = useState(false);


    const { setMenubarData } = useMenubar();
     useEffect(() => {
    const menubarData: MenubarMenuData[] = [
      {
        trigger: "Configurações",
        content: [
          {
            label: "Gestão de Questões",
            onClick: () => router.push(`/formularios/${formulario_id}/edit-questions`),
          },
          {
            label: "Operabilidades",
            onClick: () => router.push(`/formularios/${formulario_id}/operabilities`),
          },
        ],
      },
      {
        trigger: "Respostas",
        content: [
          {
            label: "Visualizar",
            onClick: () => router.push(`/formularios/${formulario_id}/visualizar-respostas`),
          },
          {
            label: "Exportar",
            onClick: () => router.push(`/formularios/${formulario_id}/export`),
          },
        ],
      },
    ];
    setMenubarData(menubarData);

    return () => {
      setMenubarData([]); // Clear menubar data when component unmounts
    };
  }, [formulario_id, router, setMenubarData]);

  const accessToken = Cookies.get("access_token");
  const { form, updateFormulario } = useFormWebSocket(
    formulario_id as string,
    accessToken ?? null,
  );

  const { setPageBreadcrumbs } = useNavigation();

  useEffect(() => {
    if (form) {
      setTitulo(form.titulo);
      setOriginalTitulo(form.titulo);
      setDescricao(form.descricao);
      setOriginalDescricao(form.descricao);
      const formTitle =
        form.titulo.length > 20
          ? `${form.titulo.substring(0, 20)}...`
          : form.titulo;
      setPageBreadcrumbs([
        { title: formTitle, url: `/formularios/${formulario_id}` },
        { title: "Operabilidades" },
      ]);
    }
  }, [form, formulario_id, setPageBreadcrumbs]);

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
      setOriginalTitulo(titulo);
      setOriginalDescricao(descricao);
      setHasChanges(false);
      toast.success("Formulário atualizado com sucesso!");
    }
  };

  const formUrl = `${process.env.NEXT_PUBLIC_FORM_URL}/form/${slug}`;

  return (
    <div className="space-y-4">
      <div className="mx-auto pt-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl tracking-tight">
          Configurações de operabilidade</h1>
      </div>
        <Separator/>

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
              onChange={(e) => {
                setTitulo(e.target.value);
                setHasChanges(
                  e.target.value !== originalTitulo ||
                    descricao !== originalDescricao,
                );
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="form-description">Descrição do Formulário</Label>
            <Textarea
              id="form-description"
              value={descricao}
              onChange={(e) => {
                setDescricao(e.target.value);
                setHasChanges(
                  titulo !== originalTitulo ||
                    e.target.value !== originalDescricao,
                );
              }}
            />
          </div>
        </CardContent>
        <CardFooter>
          {hasChanges && (
            <Button className="w-full" onClick={handleUpdateForm}>
              Salvar Alterações
            </Button>
          )}
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
          <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-yellow-600 has-[[aria-checked=true]]:bg-yellow-50 dark:has-[[aria-checked=true]]:border-yellow-900 dark:has-[[aria-checked=true]]:bg-yellow-950">
            <Checkbox
              id="toggle-publish"
              checked={isPublished}
              onCheckedChange={handleTogglePublish}
              className="data-[state=checked]:border-yellow-600 data-[state=checked]:bg-yellow-600 data-[state=checked]:text-white dark:data-[state=checked]:border-yellow-700 dark:data-[state=checked]:bg-yellow-700"
            />
            <div className="grid gap-1.5 font-normal">
              <TypographySmall>Ativar formulário</TypographySmall>
              <TypographyMuted className="!mt-0">
                Torne seu formulário acessível publicamente para que os usuários
                possam responder.
              </TypographyMuted>
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

      <Card className="border-destructive bg-red-400/20">
        <CardHeader>
          <CardTitle>Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis que podem impactar seu formulário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <div className="space-y-1">
              <TypographyH3>Deletar Formulário</TypographyH3>
              <TypographyMuted className="!mt-0">
                Esta ação é irreversível. Todos os dados do formulário,
                incluindo respostas, serão perdidos.
              </TypographyMuted>
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