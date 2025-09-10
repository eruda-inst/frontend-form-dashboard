import { NextResponse } from "next/server";
import { z } from "zod";

// Schema para a resposta da API externa
const refreshApiSchema = z.object({
  access_token: z.string(),
  token_type: z.literal("bearer"),
});

export async function POST(request: Request) {
  try {
    const { refresh_token: refreshTokenFromMiddleware } = await request.json();

    if (!refreshTokenFromMiddleware) {
      return NextResponse.json(
        { message: "Refresh token não foi fornecido no corpo da requisição." },
        { status: 400 }
      );
    }

    const apiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshTokenFromMiddleware }),
      }
    );

    if (!apiRes.ok) {
      const errorData = await apiRes.json();
      return NextResponse.json(
        { message: errorData.message || "Falha ao renovar o token." },
        { status: apiRes.status }
      );
    }

    const data = await apiRes.json();
    const parsedData = refreshApiSchema.safeParse(data);

    if (!parsedData.success) {
      console.error("Dados inválidos da API de refresh:", parsedData.error);
      return NextResponse.json(
        { message: "Resposta inválida da API de autenticação externa." },
        { status: 500 }
      );
    }

    const { access_token: newAccessToken } = parsedData.data;

    // Apenas retorna o novo token para o middleware.
    // O middleware será o responsável por salvar o cookie.
    return NextResponse.json({ access_token: newAccessToken });

  } catch (error: unknown) {
    let message = "Ocorreu um erro interno."
    if (error instanceof Error) {
      message = error.message
    }
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
