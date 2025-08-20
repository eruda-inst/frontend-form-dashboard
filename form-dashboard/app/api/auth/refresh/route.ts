import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

const refreshApiSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export async function POST() {
  const cookieStore = cookies();
  console.log("Server received cookies:", cookieStore.getAll());
  const refreshTokenFromCookie = cookieStore.get("refresh_token")?.value;

  if (!refreshTokenFromCookie) {
    return NextResponse.json(
      { message: "Refresh token não encontrado." },
      { status: 401 }
    );
  }

  try {
    const apiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refreshTokenFromCookie }),
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
      console.error("Erro de validação Zod:", parsedData.error.flatten());
      return NextResponse.json(
        { message: "Resposta inválida da API de autenticação." },
        { status: 500 }
      );
    }

    const { accessToken, refreshToken } = parsedData.data;

    const cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    cookieStore.set("access_token", accessToken, { ...cookieOptions, maxAge: 60 * 15, httpOnly: false });
    cookieStore.set("refresh_token", refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7, httpOnly: true });

    return NextResponse.json({ success: true });

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
