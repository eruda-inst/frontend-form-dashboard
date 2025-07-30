import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const authStatusUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/status`

  try {
    // É importante passar os cookies da requisição original para a API de status
    // para que o backend possa determinar se o usuário está autenticado.
    const authStatusResponse = await fetch(authStatusUrl, {
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
      cache: "no-store",
    })

    // Se a API de status não responder corretamente, é mais seguro não fazer nada
    // e deixar a aplicação cliente lidar com o erro.
    if (!authStatusResponse.ok) {
      console.error(
        "Middleware: Falha ao buscar /auth/status",
        authStatusResponse.statusText,
      )
      return NextResponse.next()
    }

    const { admin_existe, autenticado } = await authStatusResponse.json()

    // Cenário 1: Nenhum administrador foi configurado no sistema.
    if (!admin_existe) {
      // Se o usuário já está na página de setup, permite o acesso.
      if (pathname === "/setup-admin") {
        return NextResponse.next()
      }
      // Para qualquer outra página, redireciona para a configuração do admin.
      const setupUrl = new URL("/setup-admin", request.url)
      return NextResponse.redirect(setupUrl)
    }

    // Cenário 2: O administrador já existe, aplicamos as regras normais.
    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register")

    // Se o usuário está autenticado e tenta acessar as páginas de login/registro,
    // redireciona para o dashboard.
    if (autenticado && isAuthPage) {
      const dashboardUrl = new URL("/dashboard", request.url)
      return NextResponse.redirect(dashboardUrl)
    }

    // Se o usuário não está autenticado e tenta acessar uma página protegida (que não seja de autenticação ou setup),
    // redireciona para o login.
    if (!autenticado && !isAuthPage && pathname !== "/setup-admin") {
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  } catch (error) {
    console.error("Erro no middleware:", error)
    // Em caso de erro de rede (ex: API fora do ar), não bloqueia o usuário.
    // A página pode tentar renderizar e lidar com o erro no lado do cliente.
    return NextResponse.next()
  }

  // Se nenhuma das condições de redirecionamento for atendida, permite o acesso.
  return NextResponse.next()
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

