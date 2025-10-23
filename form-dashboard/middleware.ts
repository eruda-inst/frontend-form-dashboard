import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Função para decodificar o JWT e verificar a expiração
async function isTokenExpired(token: string) {
  if (!token) {
    console.log("[MW-LOG] No token provided.");
    return true;
  }
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const decoded = JSON.parse(decodedJson);
    const exp = decoded.exp * 1000;
    const timeRemaining = exp - Date.now();
    const refreshThreshold = 14 * 60 * 1000 + 50 * 1000; // 14m 50s
    return timeRemaining <= refreshThreshold;
  } catch (error) {
    console.error("[MW-LOG] Failed to decode or parse token:", error);
    return true;
  }
}

export async function middleware(request: NextRequest) {
  console.log("iniciando middleware... ");
  const { pathname } = request.nextUrl;
  console.log(`[MW-LOG] --- Start: ${request.method} ${pathname} ---`);

  let accessToken = request.cookies.get("access_token")?.value ?? "";
  const refreshToken = request.cookies.get("refresh_token")?.value ?? "";
  console.log(`[MW-LOG] Current access_token: ${accessToken}`);
  console.log(`[MW-LOG] Current refresh_tok en: ${refreshToken}`);

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isSetupPage = pathname === "/setup-admin";

  let newAccessToken: string | null = null;

  // Lógica de Refresh de Token (não executa em páginas de auth/setup)
  if (refreshToken && !isAuthPage && !isSetupPage) {
    if (await isTokenExpired(accessToken)) {
      console.log(`[MW-LOG] Token is missing or about to expire. Attempting to refresh.`);
      const refreshUrl = new URL('/api/auth/refresh', request.url);

      try {
        const refreshResponse = await fetch(refreshUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          newAccessToken = data.access_token;
          if (newAccessToken !== null) {
            accessToken = newAccessToken;
          }
          console.log("[MW-LOG] Token refreshed successfully.");
        } else {
          console.error(`[MW-LOG] Refresh token API failed. Clearing cookies.`);
          const response = NextResponse.redirect(new URL("/login", request.url));
          response.cookies.delete("access_token");
          response.cookies.delete("refresh_token");
          return response;
        }
      } catch (error) {
        console.error(`[MW-LOG] CRITICAL: Error during token refresh fetch.`, error);
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");
        return response;
      }
    }
  }

  // Lógica de Redirecionamento com as novas regras
  console.log("[MW-LOG] Proceeding with new redirection rules.");
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  console.log(`[MW-LOG] API Base URL: ${apiBase}`);
  const authStatusUrl = `${apiBase}/setup/status`;
  // Inicia como false. Se a API falhar ou o campo não existir, força o redirecionamento para o setup.
  // Assume que o endpoint /setup/status agora retorna 'admin_user_existe' para indicar se o usuário admin foi criado.
  let admin_user_existe = false; 
  // A autenticação é determinada pela presença de tokens válidos.
  const autenticado = !!accessToken && !!refreshToken;

  console.log(`[MW-LOG] Fetching admin setup status from: ${authStatusUrl}`);
  try {
    const resp = await fetch(authStatusUrl, {
      // Este endpoint é público, não precisa de autenticação.
      // Enviar um token expirado pode causar falha na requisição.
      cache: 'no-store',
      signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(1500) : undefined,
    });
    if (resp.ok) {
      const j = await resp.json();
      admin_user_existe = !!j?.admin_user_existe; // Verifica se o usuário admin existe
    }
  } catch (error) {
    console.error(`[MW-LOG] CRITICAL: Error fetching auth status: ${error}.`);
  }

  let response: NextResponse;

  // REGRA 1: Setup do Admin é prioritário
  if (!admin_user_existe) {
    console.log("[MW-LOG] Rule 1: Admin user does not exist. Redirecting to setup.");
    response = isSetupPage ? NextResponse.next() : NextResponse.redirect(new URL("/setup-admin", request.url));
  } 
  // REGRA 2: Usuário autenticado
  else if (autenticado) {
    console.log("[MW-LOG] Rule 2: User is authenticated.");
    // Se estiver em uma página de autenticação, redireciona para a página principal
    if (isAuthPage) {
        console.log(`[MW-LOG] Authenticated user on auth page, redirecting from '${pathname}' to /formularios.`);
        response = NextResponse.redirect(new URL("/formularios", request.url));
    } 
    // Se estiver na raiz, redireciona para a página principal
    else if (pathname === '/') {
        console.log(`[MW-LOG] Authenticated user on root, redirecting to /formularios.`);
        response = NextResponse.redirect(new URL("/formularios", request.url));
    }
    // Para todas as outras rotas, permite o acesso
    else {
        response = NextResponse.next();
    }
  } 
  // REGRA 3: Usuário não autenticado
  else {
    console.log("[MW-LOG] Rule 3: User is not authenticated.");
    // Para usuários não autenticados, o refresh de token não é possível.
    // Portanto, podemos retornar a resposta diretamente.
    if (isAuthPage) {
      return NextResponse.next();
    } else {
      console.log(`[MW-LOG] Redirecting to /login from '${pathname}'`);
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Se um novo token foi gerado, anexa o cookie na resposta final
  if (newAccessToken) {
    console.log("[MW-LOG] Attaching new access_token to the final response.");
    response.cookies.set("access_token", newAccessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 880, // 14m 40s
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|extapi|_next/static|_next/image|favicon.ico|Banner.png|logo-candol-white.png|logo-candol-black.png).*)"],
};
