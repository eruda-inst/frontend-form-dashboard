import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UserCard } from "./user-card"
import { UserDialog } from "./user-dialog"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

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

export const UsersList = ({
  users,
  newPassword,
  setNewPassword,
  updatingPasswordUserId,
  handleChangePassword,
  deactivatingUserId,
  deleteConfirmation,
  setDeleteConfirmation,
  handleDeactivateUser,
}: {
  users: User[]
  newPassword: string
  setNewPassword: (password: string) => void
  updatingPasswordUserId: string | null
  handleChangePassword: (userId: string) => void
  deactivatingUserId: string | null
  deleteConfirmation: string
  setDeleteConfirmation: (confirmation: string) => void
  handleDeactivateUser: (user: User) => void
}) => (
  <div className="grid auto-rows-min gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
    {users.map((user) => {
      if (!user.ativo) {
        return null
      }
      return (
        <Dialog
          key={user.id}
          onOpenChange={(open) => {
            if (!open) {
              setNewPassword("")
            }
          }}
        >
          <DialogTrigger asChild>
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
                        {user.nome}
                      </CardTitle>
                      <CardDescription>
                        {user.grupo.nome != "admin" ? (
                          <Badge variant="outline" className="p-2">{user.grupo.nome}</Badge>
                        ) : (
                          <Badge variant="default">{user.grupo.nome}</Badge>
                        )}{" "}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
          </DialogTrigger>
          <DialogContent>
            <UserDialog
              user={user}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              updatingPasswordUserId={updatingPasswordUserId}
              handleChangePassword={handleChangePassword}
              deactivatingUserId={deactivatingUserId}
              deleteConfirmation={deleteConfirmation}
              setDeleteConfirmation={setDeleteConfirmation}
              handleDeactivateUser={handleDeactivateUser}
            />
          </DialogContent>
        </Dialog>
      )
    })}
  </div>
)
