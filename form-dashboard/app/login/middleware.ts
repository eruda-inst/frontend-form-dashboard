import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // 1. Pega o valor do cookie 'token' da requisição
  const token = request.cookies.get("token")?.value
  const { pathname } = request.nextUrl

  // 2. Se o usuário não tem token e tenta acessar o dashboard, redireciona para /login
  if (!token && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // 3. Se o usuário JÁ TEM um token e tenta acessar /login, redireciona para o dashboard
  if (token && pathname.startsWith("/login")) {
    const dashboardUrl = new URL("/dashboard", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // 4. Se nenhuma das condições acima for atendida, continua a requisição normalmente
  return NextResponse.next()
}

// 5. Define em quais rotas o middleware será executado
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}