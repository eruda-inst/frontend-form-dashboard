import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { toast } from "sonner";

export async function POST(request: Request) {
  // 1. Pega a instância da "loja" de cookies uma única vez.
  const cookieStore = cookies()
  const store = await cookieStore;
  const accessToken = store.get("access_token")?.value

  if (accessToken) {
    try {
      // 1. Informa o backend que o usuário está fazendo logout.
      // O backend deve invalidar o token (especialmente o refresh token).
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      // Não precisamos nos preocupar com a resposta, o objetivo principal é deslogar.
    } catch (error) {
      toast.error(`Erro ao comunicar com o servidor durante o logout. ${error}`);
      // A falha na comunicação com o backend não deve impedir o logout do frontend.
    }
  }

  // 2. Limpa os cookies no navegador do usuário.
  // É crucial que isso seja feito no lado do servidor para remover cookies httpOnly.
  store.delete("access_token")
  store.delete("refresh_token")
  store.delete("user")

  // 3. Retorna uma resposta de sucesso para o cliente.
  return NextResponse.json({ message: "Logout realizado com sucesso." })
}