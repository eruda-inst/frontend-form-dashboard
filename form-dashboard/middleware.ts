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

// Função para decodificar o JWT e verificar a expiração
async function isTokenExpired(token: string) {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const decoded = JSON.parse(decodedJson);
    const exp = decoded.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch (error) {
    console.error("[Middleware] Failed to decode or parse token:", error);
    return true; // Consider token invalid if it cannot be parsed
  }
}

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Starting for path: ${request.nextUrl.pathname}`);
  const { pathname } = request.nextUrl;
  let accessToken = request.cookies.get("access_token")?.value ?? "";
  const refreshToken = request.cookies.get("refresh_token")?.value ?? "";

  console.log(`[Middleware] Initial Access Token: ${accessToken ? 'Present' : 'Missing'}`);
  console.log(`[Middleware] Refresh Token: ${refreshToken ? 'Present' : 'Missing'}`);

  // --- Refresh Token Logic ---
  const tokenExpired = await isTokenExpired(accessToken);
  console.log(`[Middleware] Access Token Expired: ${tokenExpired}`);

  if (accessToken && refreshToken && tokenExpired) {
    console.log("[Middleware] Access token expired. Attempting to refresh.");
    try {
      const refreshApiUrl = new URL('/api/auth/refresh', request.url).toString();
      console.log(`[Middleware] Calling refresh API: ${refreshApiUrl}`);
      const requestBody = JSON.stringify({ refresh_token: refreshToken });
      console.log(`[Middleware] Refresh request body: ${requestBody}`);

      const refreshResponse = await fetch(refreshApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      console.log(`[Middleware] Refresh API response status: ${refreshResponse.status}`);

      if (refreshResponse.ok) {
        const { access_token: newAccessToken } = await refreshResponse.json();
        accessToken = newAccessToken; // Update accessToken for subsequent checks
        console.log("[Middleware] Token refreshed successfully. Updating access_token cookie.");
        const response = NextResponse.next();
        response.cookies.set("access_token", newAccessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
        return response;
      } else {
        const errorText = await refreshResponse.text();
        console.error(`[Middleware] Refresh token failed. Status: ${refreshResponse.status}, Response: ${errorText}. Clearing cookies and redirecting to login.`);
        const response = redirectTo(request, "/login", "refresh-failed");
        response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
        response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
        response.cookies.set("user", "", { maxAge: 0, path: "/" });
        return response;
      }
    } catch (error) {
      console.error(`[Middleware] Error during token refresh: ${error}. Clearing cookies and redirecting to login.`);
      const response = redirectTo(request, "/login", "refresh-error");
      response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
      response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
      response.cookies.set("user", "", { maxAge: 0, path: "/" });
      return response;
    }
  }
  // --- End Refresh Token Logic ---

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isSetupPage = pathname === "/setup-admin";

  // Base da API — prefira /extapi se quiser bypass do Next
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  // Se preferir bypass:
  // const apiBase = "https://forms.newnet.com.br/extapi";
  const authStatusUrl = `${apiBase}/setup/status`;
  console.log(`[Middleware] Checking auth status at: ${authStatusUrl}`);

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

    console.log(`[Middleware] Auth status API response status: ${resp.status}`);
    if (resp.ok) {
      const j = await resp.json();
      admin_existe = !!j?.admin_existe;
      autenticado = !!j?.autenticado;
      console.log(`[Middleware] Admin exists: ${admin_existe}, Authenticated: ${autenticado}`);
    } else {
      console.log(`[Middleware] Auth status API not OK: ${resp.statusText}`);
    }
  } catch (error) {
    console.error(`[Middleware] Error checking auth status: ${error}`);
    // Em erro de rede, segue com defaults
  }

  // 2) Sem admin -> força setup (apenas /setup-admin permitido)
  if (!admin_existe) {
    console.log(`[Middleware] Admin does not exist. Current path: ${pathname}, isSetupPage: ${isSetupPage}`);
    if (!isSetupPage) return redirectTo(request, "/setup-admin", "no-admin");
    return mark(NextResponse.next(), "no-admin-allow-setup");
  }

  // 3) Admin existe -> /setup-admin não deve ser acessível
  if (isSetupPage) {
    console.log(`[Middleware] Admin exists, but trying to access setup page. Redirecting to /login.`);
    return redirectTo(request, "/login", "admin-exists-no-setup");
  }

  // 4) Com admin já configurado, decide por auth
  if (autenticado) {
    console.log(`[Middleware] User authenticated. Current path: ${pathname}, isAuthPage: ${isAuthPage}`);
    if (isAuthPage || !pathname.startsWith("/dashboard")) {
      console.log(`[Middleware] Authenticated user trying to access auth page or non-dashboard route. Redirecting to /dashboard.`);
      return redirectTo(request, "/dashboard", "authenticated-redirect");
    }
    return mark(NextResponse.next(), "authenticated-allow");
  }

  // 5) Não autenticado
  console.log(`[Middleware] User not authenticated. Current path: ${pathname}, isAuthPage: ${isAuthPage}`);
  if (isAuthPage) return mark(NextResponse.next(), "unauthenticated-auth-pages");

  console.log(`[Middleware] Unauthenticated user trying to access protected route. Redirecting to /login and clearing cookies.`);
  const res = redirectTo(request, "/login", "unauthenticated-protected");
  res.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  res.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
  res.cookies.set("user", "", { maxAge: 0, path: "/" });
  return res;
}

export const config = {
  // Se /extapi está no mesmo host e você não quer que passe no middleware, mantenha excluído
  matcher: ["/((?!api|extapi|_next/static|_next/image|favicon\.ico).*)"]
};