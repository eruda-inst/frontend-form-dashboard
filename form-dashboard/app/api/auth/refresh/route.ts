import { NextResponse } from "next/server";
import { z } from "zod";

// Schema para a resposta da API externa
const refreshApiSchema = z.object({
  access_token: z.string(),
  token_type: z.literal("bearer"),
});

export async function POST(request: Request) {
  console.log("[API /auth/refresh] Received request.");
  try {
    const body = await request.json();
    const { refresh_token: refreshTokenFromMiddleware } = body;

    if (!refreshTokenFromMiddleware) {
      console.log("[API /auth/refresh] Error: Refresh token not provided in request body.");
      return NextResponse.json(
        { message: "Refresh token não foi fornecido no corpo da requisição." },
        { status: 400 }
      );
    }

    console.log("[API /auth/refresh] Refresh token found. Calling external API.");
    const apiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshTokenFromMiddleware }),
    });

    console.log(`[API /auth/refresh] External API response status: ${apiRes.status}`);

    if (!apiRes.ok) {
      const errorData = await apiRes.json().catch(() => apiRes.text());
      console.error("[API /auth/refresh] External API call failed:", errorData);
      return NextResponse.json(
        { message: "Falha ao renovar o token na API externa.", details: errorData },
        { status: apiRes.status }
      );
    }

    const data = await apiRes.json();
    const parsedData = refreshApiSchema.safeParse(data);

    if (!parsedData.success) {
      console.error("[API /auth/refresh] Invalid data from external API:", parsedData.error);
      return NextResponse.json(
        { message: "Resposta inválida da API de autenticação externa." },
        { status: 500 }
      );
    }

    const { access_token: newAccessToken } = parsedData.data;
    console.log("[API /auth/refresh] Successfully obtained new access token. Returning it to middleware.");

    // Apenas retorna o novo token para o middleware.
    // O middleware será o responsável por salvar o cookie.
    return NextResponse.json({ access_token: newAccessToken });

  } catch (error: unknown) {
    console.error("[API /auth/refresh] An internal error occurred:", error);
    let message = "Ocorreu um erro interno no servidor.";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}