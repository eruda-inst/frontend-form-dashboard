import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { refresh_token } = await request.json();
  console.log(`[REFRESH_ROUTE_LOG] Received refresh_token: ${refresh_token ? 'present' : 'missing'}`);

  if (!refresh_token) {
    return NextResponse.json({ message: "Refresh token is missing" }, { status: 400 });
  }

  try {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    console.log(`[REFRESH_ROUTE_LOG] Calling backend refresh API at: ${apiBase}/auth/refresh`);
    const response = await fetch(`${apiBase}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[REFRESH_ROUTE_LOG] Backend refresh API failed: ${JSON.stringify(errorData)}`);
      return NextResponse.json({ message: errorData.message || "Failed to refresh token" }, { status: response.status });
    }

    const data = await response.json();
    console.log(`[REFRESH_ROUTE_LOG] Backend returned access_token: ${data.access_token ? 'present' : 'missing'}`);
    return NextResponse.json({ access_token: data.access_token });
  } catch (error) {
    console.error("[REFRESH_API_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}