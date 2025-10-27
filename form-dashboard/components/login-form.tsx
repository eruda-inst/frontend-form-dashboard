"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [nome, setNome] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [genero, setGenero] = useState("outro")
  const [imagemFile, setImagemFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Dados da empresa
  const [empresaNome, setEmpresaNome] = useState("")
  const [empresaCnpj, setEmpresaCnpj] = useState("")
  const [empresaLogoFile, setEmpresaLogoFile] = useState<File | null>(null)

  useEffect(() => {
    if (error) {
      toast.error("Erro na configuração", {
        description: error,
        action: {
          label: "Ok",
          onClick: () => setError(null),
        },
      })
    }
  }, [error])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const grupoRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/grupos/grupo-admin-id`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      )

      if (!grupoRes.ok) {
        throw new Error("Não foi possível obter o grupo de administradores padrão.")
      }
      const grupoData = await grupoRes.json()
      const adminGroupId = grupoData.grupo_id

      const formData = new FormData()

      const usuarioData = {
        nome,
        username,
        genero,
        email,
        senha,
        ativo: true,
        grupo_id: adminGroupId,
      }
      formData.append("usuario_data", JSON.stringify(usuarioData))

      const empresaData = {
        nome: empresaNome,
        cnpj: empresaCnpj,
      }
      formData.append("empresa_data", JSON.stringify(empresaData))

      if (imagemFile) {
        formData.append("imagem_usuario", imagemFile)
      }
      if (empresaLogoFile) {
        formData.append("logo_empresa", empresaLogoFile)
      }

      const setupRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/setup/`, {
        method: "POST",
        body: formData,
      })

      if (!setupRes.ok) {
        const errorData = await setupRes.json()
        throw new Error(errorData.message || "Falha ao configurar o sistema.")
      }

      toast.success("Sistema configurado com sucesso!", {
        description: "Você será redirecionado para a tela de login.",
      })

      router.push("/login")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Cadastro inicial</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Preencha para criar a primeira conta da plataforma
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            type="text"
            placeholder="Fulano de Tal"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="username">Usuário</Label>
          <Input
            id="username"
            type="text"
            placeholder="fulano.tal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="fulanodetal@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Senha</Label>
          </div>
          <Input
            id="password"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="genero">Gênero</Label>
          </div>
          <RadioGroup
            defaultValue="outro"
            value={genero}
            onValueChange={setGenero}
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value="masculino" id="r1" />
              <Label htmlFor="r1">Masculino</Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="feminino" id="r2" />
              <Label htmlFor="r2">Feminino</Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="outro" id="r3" />
              <Label htmlFor="r3">Outro</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="grid gap-3">
          <Label htmlFor="imagem_usuario">Foto de Perfil</Label>
          <Input
            id="imagem_usuario"
            type="file"
            accept="image/*"
            onChange={(e) => setImagemFile(e.target.files ? e.target.files[0] : null)}
            required
          />
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Dados da Empresa
            </span>
          </div>
        </div>
        <div className="grid gap-3">
          <Label htmlFor="empresaNome">Nome da Empresa</Label>
          <Input
            id="empresaNome"
            type="text"
            placeholder="Minha Empresa LTDA"
            value={empresaNome}
            onChange={(e) => setEmpresaNome(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="empresaCnpj">CNPJ</Label>
          <Input
            id="empresaCnpj"
            type="text"
            placeholder="00.000.000/0001-00"
            value={empresaCnpj}
            onChange={(e) => setEmpresaCnpj(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="logo_empresa">Logo da Empresa</Label>
          <Input
            id="logo_empresa"
            type="file"
            accept="image/*"
            onChange={(e) =>
              setEmpresaLogoFile(e.target.files ? e.target.files[0] : null)
            }
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Configurando..." : "Pronto"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Essa tela vai aparecer apenas uma vez.
      </div>
    </form>
  )
}
