import { UserCard } from "./user-card"
import { UserDialog } from "./user-dialog"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"

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
  <div className="flex flex-col auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
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
            <UserCard user={user} />
          </DialogTrigger>
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
        </Dialog>
      )
    })}
  </div>
)
