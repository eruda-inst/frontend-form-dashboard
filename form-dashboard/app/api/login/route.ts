import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // 1. Faz a chamada para a sua API externa
    const apiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!apiRes.ok) {
      const errorData = await apiRes.json();
      return NextResponse.json(
        { message: errorData.message || "Falha no login" },
        { status: apiRes.status }
      );
    }

    const data = await apiRes.json();

    // 2. Extrai o token e os dados do usuário da resposta da API
    const { accessToken, firstName, lastName, email, image } = data;

    // 3. Define os cookies na resposta que será enviada ao navegador
    const user = { name: `${firstName} ${lastName}`, email, avatar: image };
    cookies().set("token", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 }); // 1 dia
    cookies().set("user", JSON.stringify(user), { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Ocorreu um erro interno." },
      { status: 500 }
    );
  }
}

