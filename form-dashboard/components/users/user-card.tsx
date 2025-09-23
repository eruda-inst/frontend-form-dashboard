import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Definindo o tipo para um usuário, baseado na sua resposta da API
type User = {
  id: string
  nome: string
  username: string
  email: string
  imagem: string
  genero: string
  nivel: string
  ativo: boolean
  grupo: {
    id: string
    nome: string
  }
}

const getInitials = (name: string) => {
  if (!name) return ""
  const names = name.split(" ")
  const firstInitial = names[0]?.[0] || ""
  const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] || "" : ""
  return `${firstInitial}${lastInitial}`.toUpperCase()
}

export const UserCard = ({ user }: { user: User }) => (
  <div>
  <Card
    key={user.id}
    style={{ backgroundImage: `url(${user.imagem})` }}
    className="border-2 border-secondary  backdrop-blur-sm overflow-hidden p-0 bg-cover cursor-pointer flex flex-col transition-transform duration-300 ease-in-out hover:scale-101"
  >
    <div className=" bg-transparent  backdrop-blur-2xl z-2 w-full h-full absolute"></div>
    <div className="bg-card opacity-60 z-1 w-full h-full absolute"></div>
    <CardHeader className="z-3 p-6 flex flex-col items-left  text-center">
      <div className="flex">
        <Avatar className="mb-2 h-20 w-20">
          <AvatarImage src={user.imagem} alt={user.nome} />
          <AvatarFallback>{getInitials(user.nome)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2 h-full justify-center pl-6 items-left text-left">
          <CardTitle>
            {user.nome}{" "}
            <span className="opacity-70 text-accent-foreground">
              @{user.username}
            </span>
          </CardTitle>
          <CardDescription>
            <Badge variant="default">{user.grupo.nome}</Badge>
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  </Card>
  </div>
)
