import { NextResponse } from "next/server"
import type { NextRequest, NextFetchEvent } from "next/server"

// Helper para criar respostas de redirecionamento de forma mais limpa.
function redirect(request: NextRequest, path: string) {
  const url = new URL(path, request.url)
  return NextResponse.redirect(url)
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get("accessToken")?.value

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register")
  const isSetupPage = pathname === "/setup-admin"

  // Se não há token e o usuário tenta acessar uma página protegida, redireciona para o login.
  // Esta é uma verificação rápida para evitar chamadas de API desnecessárias.
  if (!accessToken && !isAuthPage && !isSetupPage) {
    return redirect(request, "/login")
  }

  const authStatusUrl = `${process.env.NEXT_PUBLIC_API_URL}/setup/status`

  try {
    // Usamos event.waitUntil para que a verificação de status não bloqueie a resposta inicial.
    // No entanto, para a lógica de redirecionamento, precisamos esperar pela resposta.
    const authStatusResponse = await fetch(authStatusUrl, {
      headers: {
        Authorization: `Bearer ${accessToken || ""}`,
      },
      cache: "no-store",
    })

    const { admin_existe, autenticado } = await authStatusResponse.json()

    // Cenário 1: Nenhum administrador foi configurado no sistema.
    if (!admin_existe) {
      // Permite o acesso apenas à página de setup, redirecionando todo o resto para lá.
      if (!isSetupPage) {
        return redirect(request, "/setup-admin")
      }
      return NextResponse.next()
    }

    // A partir daqui, o admin já existe. A página de setup não deve ser mais acessível.
    if (isSetupPage) {
      return redirect(request, "/login")
    }

    // Cenário 2: Usuário está autenticado (token válido).
    if (autenticado) {
      // Se ele tentar acessar uma página de autenticação, redireciona para o dashboard.
      if (isAuthPage) {
        return redirect(request, "/dashboard")
      }
      // Caso contrário, permite o acesso.
      return NextResponse.next()
    }

    // Cenário 3: Usuário NÃO está autenticado (token inválido/expirado ou não existe).
    // Se ele já estiver em uma página pública (login/registro), permite o acesso.
    if (isAuthPage) {
      return NextResponse.next()
    }

    // Se ele tentar acessar uma página protegida, redireciona para o login
    // E o mais importante: LIMPA OS COOKIES INVÁLIDOS para quebrar o loop.
    const response = redirect(request, "/login")
    response.cookies.delete("accessToken")
    response.cookies.delete("refreshToken")
    response.cookies.delete("user")

    return response
  } catch (error) {
    console.error("Erro no middleware:", error)
    // Em caso de erro de rede (ex: API fora do ar), não bloqueia o usuário.
    // A página pode tentar renderizar e lidar com o erro no lado do cliente.
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
