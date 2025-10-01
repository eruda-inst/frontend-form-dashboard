import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

export const UserDialog = ({
  user,
  newPassword,
  setNewPassword,
  updatingPasswordUserId,
  handleChangePassword,
  deactivatingUserId,
  deleteConfirmation,
  setDeleteConfirmation,
  handleDeactivateUser,
  className,
}: {
  user: User
  newPassword: string
  setNewPassword: (password: string) => void
  updatingPasswordUserId: string | null
  handleChangePassword: (userId: string) => void
  deactivatingUserId: string | null
  deleteConfirmation: string
  setDeleteConfirmation: (confirmation: string) => void
  handleDeactivateUser: (user: User) => void
  className?: string
}) => (
  <div className={cn("flex flex-col gap-4", className)}>
 

    <DialogHeader>
      <Avatar className="z-10 mb-2 h-20 w-20">
        <AvatarImage src={user.imagem} alt={user.nome} />
        <AvatarFallback>{getInitials(user.nome)}</AvatarFallback>
      </Avatar>
      <DialogTitle>
        {user.nome}{" "}
        <span className="opacity-70 text-accent-foreground">
          @{user.username}
        </span>
      </DialogTitle>
      <DialogDescription className="flex flex-col gap-2">
        <Badge variant="default">{user.grupo.nome}</Badge>
      </DialogDescription>
    </DialogHeader>
    <div className="flex">
      <Input
        className="rounded-r-none"
        type="password"
        placeholder="Nova senha"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        disabled={updatingPasswordUserId === user.id}
      />
      <Button
        className="cursor-pointer border-l-0 rounded-l-none"
        variant={"outline"}
        onClick={() => handleChangePassword(user.id)}
        disabled={updatingPasswordUserId === user.id || !newPassword.trim()}
      >
        {updatingPasswordUserId === user.id ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Check />
        )}
      </Button>
    </div>
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className="cursor-pointer"
          variant={"destructive"}
          disabled={deactivatingUserId === user.id}
        >
          {deactivatingUserId === user.id
            ? "Desativando..."
            : "Desativar Usuário"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Isso irá desativar permanentemente
            este usuário.
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
          <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (deleteConfirmation === "deletar") {
                handleDeactivateUser(user)
                setDeleteConfirmation("")
              } else {
                toast.error("Digite 'deletar' para confirmar.")
              }
            }}
            disabled={deleteConfirmation !== "deletar"}
          >
            Deletar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>)
