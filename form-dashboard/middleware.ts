import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  console.log("iniciando middleware... ");
  const { pathname } = request.nextUrl;
  console.log(`[MW-LOG] --- Start: ${request.method} ${pathname} ---`);

  const accessToken = request.cookies.get("access_token")?.value ?? "";
  console.log(`[MW-LOG] Current access_token: ${accessToken}`);

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isSetupPage = pathname === "/setup-admin";

  // Lógica de Redirecionamento com as novas regras
  console.log("[MW-LOG] Proceeding with new redirection rules.");
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const authStatusUrl = `${apiBase}/setup/status`;
  let grupo_admin_existe = true;
  let autenticado = false;

  try {
    const resp = await fetch(authStatusUrl, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      cache: "no-store",
      signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(1500) : undefined,
    });
    if (resp.ok) {
      const j = await resp.json();
      grupo_admin_existe = !!j?.grupo_admin_existe;
      autenticado = !!j?.autenticado && !!accessToken;
    }
  } catch (error) {
    console.error(`[MW-LOG] CRITICAL: Error fetching auth status: ${error}.`);
  }

  let response: NextResponse;

  // REGRA 1: Setup do Admin é prioritário
  if (!grupo_admin_existe) {
    console.log("[MW-LOG] Rule 1: Admin group does not exist.");
    response = isSetupPage ? NextResponse.next() : NextResponse.redirect(new URL("/setup-admin", request.url));
  } 
  // REGRA 2: Usuário autenticado só pode acessar /dashboard
  else if (autenticado) {
    console.log("[MW-LOG] Rule 2: User is authenticated.");
    if (pathname.startsWith("/dashboard")) {
        response = NextResponse.next();
    } else {
        console.log(`[MW-LOG] Redirecting to /dashboard from '${pathname}'`);
        response = NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } 
  // REGRA 3: Usuário não autenticado só pode acessar /login e /register
  else {
    console.log("[MW-LOG] Rule 3: User is not authenticated.");
    if (isAuthPage) {
        response = NextResponse.next();
    } else {
        console.log(`[MW-LOG] Redirecting to /login from '${pathname}'`);
        response = NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|extapi|_next/static|_next/image|favicon.ico).*)"],
};

export const runtime = 'nodejs';
