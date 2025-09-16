"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Smile } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (error) {
      toast.error(error, {
        description: "Por favor, verifique suas credenciais e tente novamente.",
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
      console.log("Attempting login with:", { username, password })
      const res = await fetch(`/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      })
      
      if (!res.ok) {
        let errorMessage = "Falha no login"
        try {
          const errorData = await res.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // A resposta não é JSON, podemos usar o statusText se disponível
          errorMessage = res.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await res.json();
      
      // Definição dos cookies com max-age
      document.cookie = `access_token=${data.access_token}; path=/; max-age=900; SameSite=Lax`;
      document.cookie = `refresh_token=${data.refresh_token}; path=/; SameSite=Lax`;


      router.push("/formularios")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Smile className="size-4" />
            </div>
            
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form onSubmit={handleSubmit}>
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="kminchelle"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {/* O toast agora é acionado pelo useEffect. Não precisamos de nada aqui. */}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button className="w-full cursor-pointer" type="submit" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Não possui uma conta? Fale com o seu administrador.
            </p>
          </CardFooter>
        </Card>
      </form>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="https://images.pexels.com/photos/32544885/pexels-photo-32544885.jpeg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.8] "
        />
      </div>
    </div>
  )
      
  )
}
