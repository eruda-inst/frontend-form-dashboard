import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

// 1. Define o schema (modelo) da resposta esperada da API externa.
const loginApiSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  gender: z.string(),
  image: z.string().nullable(),
  accessToken: z.string(),
  refreshToken: z.string(),
});

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
        { message: errorData || "Falha no login" },
        { status: apiRes.status }
      );
    }

    const data = await apiRes.json();

    // 2. Valida os dados recebidos contra o schema.
    const parsedData = loginApiSchema.safeParse(data);

    if (!parsedData.success) {
      return NextResponse.json(
        { message: "Dados de login inválidos." },
        { status: 400 }
      );
    }

    // Usa os dados validados e com tipo garantido.
    const { id, accessToken, refreshToken, firstName, lastName, email, image, gender, username: apiUsername } = parsedData.data;

    // 3. Define os cookies na resposta que será enviada ao navegador
    const user = {
      id,
      name: `${firstName} ${lastName}`,
      email,
      avatar: image,
      genero: gender,
      username: apiUsername
    };

    // Opções de cookie reutilizáveis
    const cookieOptions = {
      secure: request.headers.get('x-forwarded-proto') === 'https' || process.env.NODE_ENV === 'production',
      path: '/',
      // Em produção, defina o domínio para que os cookies sejam compartilhados
      // entre subdomínios (ex: 'app.seusite.com' e 'api.seusite.com').
      // O domínio deve começar com um ponto. Ex: .meusite.com
      domain: process.env.NODE_ENV === 'production' ? 'forms.newnet.com.br' : undefined,
    };

    // O accessToken precisa ser acessível pelo middleware e também pelo JavaScript
    // do lado do cliente para chamadas de API. Por isso, NÃO é httpOnly.
    (await
      // O accessToken precisa ser acessível pelo middleware e também pelo JavaScript
      // do lado do cliente para chamadas de API. Por isso, NÃO é httpOnly.
      cookies()).set("access_token", accessToken, { ...cookieOptions, maxAge: 60 * 15, httpOnly: false }); // 15 minutos
    // O refreshToken é usado para obter um  novo accessToken sem que o usuário
    // precise fazer login novamente. Ele tem uma vida longa e é armazenado
    // de forma segura como um cookie httpOnly.
    (await
      // O refreshToken é usado para obter um  novo accessToken sem que o usuário
      // precise fazer login novamente. Ele tem uma vida longa e é armazenado
      // de forma segura como um cookie httpOnly.
      cookies()).set("refresh_token", refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7, httpOnly: true });
    // O cookie 'user' também não precisa ser httpOnly, pois pode ser útil para
    // exibir informações do usuário na UI sem uma chamada de API.
    (await
      // O cookie 'user' também não precisa ser httpOnly, pois pode ser útil para
      // exibir informações do usuário na UI sem uma chamada de API.
      cookies()).set("user", JSON.stringify(user), { ...cookieOptions, maxAge: 60 * 60 * 24 * 7, httpOnly: false });

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
