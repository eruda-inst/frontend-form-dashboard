import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Função para decodificar o JWT e verificar a expiração
async function isTokenExpired(token: string) {
  if (!token) {
    return true;
  }
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return true; // Adicionado para segurança
    const decodedJson = atob(payloadBase64);
    const decoded = JSON.parse(decodedJson);
    const exp = decoded.exp * 1000;
    const timeRemaining = exp - Date.now();
    // Considera o token "expirado" se estiver perto de expirar para forçar o refresh
    const refreshThreshold = 10 * 60 * 1000 + 50 * 1000; // 10m 50s
    return timeRemaining <= refreshThreshold;
  } catch (error) {
    console.error("[MW-LOG] Falha ao decodificar ou analisar o token:", error);
    return true;
  }
}

// --- Rotas Públicas ---
// Rotas que não exigem autenticação ou onde o refresh não deve ocorrer.
const publicRoutes = ["/", "/login", "/register", "/setup-admin", "/logout"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[MW-LOG] --- Início: ${request.method} ${pathname} ---`);

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  console.log(`[MW-LOG] Initial accessToken: ${accessToken ? 'present' : 'missing'}, refreshToken: ${refreshToken ? 'present' : 'missing'}`);

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // --- Lógica de Refresh de Token ---
  let newAccessToken: string | null = null;
  if (refreshToken && !isPublicRoute && (!accessToken || await isTokenExpired(accessToken))) {
    console.log("[MW-LOG] Token de acesso ausente ou prestes a expirar. Tentando renovar.");
    try {
      const refreshUrl = new URL('/api/auth/refresh', request.url);
      if (refreshUrl.hostname === 'localhost') {
        refreshUrl.protocol = 'http:';
        console.log(`[MW-LOG] Adjusting refresh URL for localhost to: ${refreshUrl}`);
      }

      const refreshResponse = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        newAccessToken = data.access_token;
        console.log("[MW-LOG] Token renovado com sucesso.");
        console.log(`[MW-LOG] New access_token after refresh: ${newAccessToken ? 'present' : 'missing'}`);
      } else {
        console.error("[MW-LOG] Falha ao renovar o token. Limpando cookies e redirecionando para /login.");
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");
        return response;
      }
    } catch (error) {
      console.error("[MW-LOG] CRÍTICO: Erro na chamada de fetch para renovar o token.", error);
      // Em caso de erro de rede, também redireciona para o login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }
  }

  const currentAccessToken = newAccessToken || accessToken;

  // --- Verificação de Status da Aplicação (Setup e Autenticação) ---
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const authStatusUrl = `${apiBase}/setup/status`;
  let adminGroupExists = true;
  let isAuthenticated = false;

  try {
    const resp = await fetch(authStatusUrl, {
      headers: currentAccessToken ? { Authorization: `Bearer ${currentAccessToken}` } : {},
      cache: "no-store",
      signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(2000) : undefined,
    });

    if (resp.ok) {
      const data = await resp.json();
      adminGroupExists = !!data?.grupo_admin_existe;
      isAuthenticated = !!data?.autenticado && !!currentAccessToken;
    } else {
        console.error(`[MW-LOG] A verificação de status da API falhou com status: ${resp.status}`);
    }
  } catch (error) {
    console.error(`[MW-LOG] CRÍTICO: Erro ao buscar o status de autenticação: ${error}.`);
  }

  // --- Lógica de Redirecionamento ---
  let response: NextResponse;

  // REGRA 1: Setup do Admin é prioritário
  if (!adminGroupExists) {
    if (pathname.startsWith("/setup-admin")) {
      response = NextResponse.next();
    } else {
      console.log("[MW-LOG] Redirecionando para a página de setup do admin.");
      response = NextResponse.redirect(new URL("/setup-admin", request.url));
    }
  }
  // REGRA 2: Usuário autenticado
  else if (isAuthenticated) {
    if (isPublicRoute) {
      console.log(`[MW-LOG] Usuário autenticado em rota pública ('${pathname}'). Redirecionando para /formularios.`);
      response = NextResponse.redirect(new URL("/formularios", request.url));
    } else {
      response = NextResponse.next();
    }
  }
  // REGRA 3: Usuário não autenticado
  else {
    if (isPublicRoute) {
      response = NextResponse.next();
    } else {
      console.log(`[MW-LOG] Usuário não autenticado tentando acessar rota protegida ('${pathname}'). Redirecionando para /login.`);
      response = NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Anexa o novo token de acesso à resposta, se ele foi gerado
  if (newAccessToken) {
    console.log("[MW-LOG] Anexando novo access_token à resposta final.");
    response.cookies.set("access_token", newAccessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 900, // 15 minutos
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|extapi|_next/static|_next/image|favicon.ico).*)"],
};