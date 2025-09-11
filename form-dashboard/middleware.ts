import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Função para decodificar o JWT e verificar a expiração
async function isTokenExpired(token: string) {
  if (!token) {
    console.log("[MW-LOG] isTokenExpired: No token provided.");
    return true; // No token is considered expired
  }
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const decoded = JSON.parse(decodedJson);
    const exp = decoded.exp * 1000; // Convert to milliseconds
    const isExpired = Date.now() >= exp;
    console.log(`[MW-LOG] Token expiration check: Expires at ${new Date(exp).toISOString()}, Is expired: ${isExpired}`);
    return isExpired;
  } catch (error) {
    console.error("[MW-LOG] Failed to decode or parse token:", error);
    return true; // Consider token invalid if it cannot be parsed
  }
}

export async function middleware(request: NextRequest) {
  console.log(`[MW-LOG] --- Middleware Start: ${request.method} ${request.nextUrl.pathname} ---`);
  const { pathname } = request.nextUrl;

  let accessToken = request.cookies.get("access_token")?.value ?? "";
  const refreshToken = request.cookies.get("refresh_token")?.value ?? "";
  console.log(`[MW-LOG] Found Cookies: access_token=${accessToken ? 'yes' : 'no'}, refresh_token=${refreshToken ? 'yes' : 'no'}`);

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isSetupPage = pathname === "/setup-admin";

  // Only run refresh logic if NOT on an auth or setup page
  if (!isAuthPage && !isSetupPage) {
    const tokenExpired = await isTokenExpired(accessToken);

    if (refreshToken && (!accessToken || tokenExpired)) {
      console.log(`[MW-LOG] Condition met for token refresh (Refresh token exists, and Access token is missing or expired).`);
      try {
        const refreshApiUrl = new URL('/api/auth/refresh', request.nextUrl.origin).toString();
        console.log(`[MW-LOG] Attempting to refresh token by calling: ${refreshApiUrl}`);
        
        const refreshResponse = await fetch(refreshApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        console.log(`[MW-LOG] Refresh API response status: ${refreshResponse.status}`);

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const newAccessToken = data.access_token;
          accessToken = newAccessToken; // IMPORTANT: Update accessToken for the rest of this middleware run
          console.log("[MW-LOG] Token refreshed successfully. New access token obtained.");
          
          const response = NextResponse.next();
          response.cookies.set("access_token", newAccessToken, { 
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax', 
            maxAge: 900 // 15 minutes
          });
          console.log("[MW-LOG] Set new access_token in response cookie. Allowing request to proceed.");
          return response;
        } else {
          const errorText = await refreshResponse.text();
          console.error(`[MW-LOG] Refresh token API failed. Status: ${refreshResponse.status}, Response: ${errorText}. Clearing cookies and redirecting to login.`);
          const response = NextResponse.redirect(new URL("/login", request.url));
          response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
          response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
          return response;
        }
      } catch (error) {
        console.error(`[MW-LOG] CRITICAL: Error during token refresh fetch: ${error}. Clearing cookies and redirecting to login.`);
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
        response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
        return response;
      }
    }
  }

  // After refresh logic, proceed with existing checks using the (potentially new) accessToken
  console.log("[MW-LOG] Proceeding with page access checks.");

  // 1. Check if admin user exists
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const authStatusUrl = `${apiBase}/setup/status`;
  console.log(`[MW-LOG] Checking auth status at: ${authStatusUrl}`);

  let admin_existe = true;
  let autenticado = false;

  try {
    const resp = await fetch(authStatusUrl, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      cache: "no-store",
      signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(1500) : undefined,
    });

    console.log(`[MW-LOG] Auth status API response status: ${resp.status}`);
    if (resp.ok) {
      const j = await resp.json();
      admin_existe = !!j?.admin_existe;
      autenticado = !!j?.autenticado;
      console.log(`[MW-LOG] Auth status result: admin_existe=${admin_existe}, autenticado=${autenticado}`);
    } else {
      console.log(`[MW-LOG] Auth status API request was not OK. Status: ${resp.statusText}`);
    }
  } catch (error) {
    console.error(`[MW-LOG] CRITICAL: Error fetching auth status: ${error}. Assuming defaults.`);
    // In case of network error, proceed with default values (admin_existe=true, autenticado=false)
  }

  // 2. No admin -> force setup
  if (!admin_existe) {
    if (!isSetupPage) {
      console.log("[MW-LOG] Decision: Admin does not exist. Redirecting to /setup-admin.");
      return NextResponse.redirect(new URL("/setup-admin", request.url));
    }
    console.log("[MW-LOG] Decision: Admin does not exist, already on setup page. Allowing.");
    return NextResponse.next();
  }

  // 3. Admin exists -> /setup-admin is inaccessible
  if (isSetupPage) {
    console.log("[MW-LOG] Decision: Admin exists, setup page is forbidden. Redirecting to /login.");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Authenticated user logic
  if (autenticado) {
    if (isAuthPage) {
      console.log("[MW-LOG] Decision: User is authenticated but on auth page. Redirecting to /dashboard.");
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    console.log("[MW-LOG] Decision: User is authenticated and on an allowed page. Allowing.");
    return NextResponse.next();
  }

  // 5. Unauthenticated user logic
  if (isAuthPage) {
    console.log("[MW-LOG] Decision: User is not authenticated, but on auth page. Allowing.");
    return NextResponse.next();
  }

  console.log("[MW-LOG] Decision: User is not authenticated and on a protected page. Redirecting to /login.");
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
  return response;
}

export const config = {
  matcher: ["/((?!api|extapi|_next/static|_next/image|favicon\.ico).*)"]
};