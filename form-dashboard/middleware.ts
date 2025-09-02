import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEBUG = process.env.MW_DEBUG_HEADERS === "1";

function mark(res: NextResponse, reason: string, kind: "on" | "redirect" = "on") {
  if (DEBUG) {
    res.headers.set("x-mw", kind);
    res.headers.set("x-mw-reason", reason);
  }
  return res;
}

function redirectTo(req: NextRequest, path: string, reason: string) {
  const url = req.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  return mark(NextResponse.redirect(url), reason, "redirect");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value ?? "";

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isSetupPage = pathname === "/setup-admin";

  // Base da API — prefira /extapi se quiser bypass do Next
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  // Se preferir bypass:
  // const apiBase = "https://forms.newnet.com.br/extapi";
  const authStatusUrl = `${apiBase}/setup/status`;

  // 1) SEMPRE checar status primeiro (rápido, com timeout)
  let admin_existe = true;
  let autenticado = false;
  try {
    const resp = await fetch(authStatusUrl, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      cache: "no-store",
      next: { revalidate: 0 },
      // timeout curto pra nunca travar navegação
      signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(1500) : undefined,
    });

    if (resp.ok) {
      const j = await resp.json();
      admin_existe = !!j?.admin_existe;
      autenticado = !!j?.autenticado;
    }
  } catch {
    // Em erro de rede, segue com defaults
  }

  // 2) Sem admin -> força setup (apenas /setup-admin permitido)
  if (!admin_existe) {
    if (!isSetupPage) return redirectTo(request, "/setup-admin", "no-admin");
    return mark(NextResponse.next(), "no-admin-allow-setup");
  }

  // 3) Admin existe -> /setup-admin não deve ser acessível
  if (isSetupPage) return redirectTo(request, "/login", "admin-exists-no-setup");

  // 4) Com admin já configurado, decide por auth
  if (autenticado) {
    if (isAuthPage || !pathname.startsWith("/dashboard")) {
      return redirectTo(request, "/dashboard", "authenticated-redirect");
    }
    return mark(NextResponse.next(), "authenticated-allow");
  }

  // 5) Não autenticado
  if (isAuthPage) return mark(NextResponse.next(), "unauthenticated-auth-pages");

  const res = redirectTo(request, "/login", "unauthenticated-protected");
  res.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  res.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
  res.cookies.set("user", "", { maxAge: 0, path: "/" });
  return res;
}

export const config = {
  // Se /extapi está no mesmo host e você não quer que passe no middleware, mantenha excluído
  matcher: ["/((?!api|extapi|_next/static|_next/image|favicon\\.ico).*)"],
};
