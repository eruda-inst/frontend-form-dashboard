// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helpers
function makeRedirect(request: NextRequest, path: string, reason: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  const res = NextResponse.redirect(url);
  res.headers.set("x-mw", "redirect");
  res.headers.set("x-mw-reason", reason);
  return res;
}

function makeNext(reason: string) {
  const res = NextResponse.next();
  res.headers.set("x-mw", "on");
  res.headers.set("x-mw-reason", reason);
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value ?? "";

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isSetupPage = pathname === "/setup-admin";

  // 1) Sem token tentando acessar página protegida → login
  if (!accessToken && !isAuthPage && !isSetupPage) {
    return makeRedirect(request, "/login", "no-token");
  }

  // 2) Verificação de status no backend (sem '//' na base)
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const authStatusUrl = `${apiBase}/setup/status`;

  try {
    const authStatusResponse = await fetch(authStatusUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!authStatusResponse.ok) {
      // Não bloqueia navegação se a API estiver fora/errada
      return makeNext("status-fetch-not-ok");
    }

    const { admin_existe, autenticado } = await authStatusResponse.json();

    // 3) Sem admin → força /setup-admin
    if (!admin_existe) {
      if (!isSetupPage) return makeRedirect(request, "/setup-admin", "no-admin");
      return makeNext("no-admin-allow-setup");
    }

    // 4) Admin existe → /setup-admin não deve ser acessível
    if (isSetupPage) {
      return makeRedirect(request, "/login", "admin-exists-no-setup");
    }

    // 5) Autenticado
    if (autenticado) {
      // Se tentar auth pages ou fora de /dashboard → manda pro /dashboard
      if (isAuthPage || !pathname.startsWith("/dashboard")) {
        return makeRedirect(request, "/dashboard", "authenticated-redirect");
      }
      return makeNext("authenticated-allow");
    }

    // 6) Não autenticado
    if (isAuthPage) return makeNext("unauthenticated-auth-pages");

    const res = makeRedirect(request, "/login", "unauthenticated-protected");
    // limpa cookies inválidos (path raiz)
    res.cookies.set("access_token", "", { maxAge: 0, path: "/" });
    res.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
    res.cookies.set("user", "", { maxAge: 0, path: "/" });
    return res;
  } catch {
    // Falha de rede/parse → não bloquear navegação
    return makeNext("status-fetch-error");
  }
}

// Ajuste o matcher conforme seu roteamento.
// Se tiver /extapi no mesmo host e NÃO quiser passar pelo middleware, adicione "extapi" abaixo.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|extapi).*)",
  ],
};
