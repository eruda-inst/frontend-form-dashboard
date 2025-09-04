import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Pergunta, Form } from "@/app/types/forms";
import type { Resposta } from "@/app/types/responses";

// Função para escapar dados para CSV
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const accessToken = (await cookieStore).get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const formId = params.id;

  try {
    // 1. Buscar detalhes do formulário (para obter as perguntas)
    const formRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/formularios/${formId}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!formRes.ok) {
      throw new Error("Falha ao buscar o formulário.");
    }

    const form: Form = await formRes.json();
    const perguntas = form.perguntas;

    // 2. Buscar todas as respostas do formulário
    const responsesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/respostas/formulario/${formId}`, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    if (!responsesRes.ok) {
        throw new Error("Falha ao buscar as respostas.");
    }

    const responses: Resposta[] = await responsesRes.json();

    // 3. Gerar o conteúdo CSV
    const headers = [
      "ID da Resposta",
      "Enviado em",
      ...perguntas.map(p => p.texto)
    ];
    
    const csvRows = [headers.join(',')];

    responses.forEach(response => {
      const row = [
        escapeCsvValue(response.id),
        escapeCsvValue(new Date(response.criado_em).toLocaleString('pt-BR')),
      ];

      perguntas.forEach(pergunta => {
        const items = response.itens.filter(i => i.pergunta_id === pergunta.id);
        let valor = '';
        if (items.length > 0) {
            switch (pergunta.tipo) {
                case 'texto_simples':
                case 'texto_longo':
                case 'data':
                    valor = items[0].valor_texto || '';
                    break;
                case 'numero':
                case 'nps':
                    valor = items[0].valor_numero !== null ? String(items[0].valor_numero) : '';
                    break;
                case 'multipla_escolha':
                case 'caixa_selecao':
                    valor = items.map(i => i.valor_opcao?.texto || i.valor_opcao_texto).filter(Boolean).join('; ');
                    break;
                default:
                    valor = '';
            }
        }
        row.push(escapeCsvValue(valor));
      });

      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join("\n");

    // 4. Retornar o arquivo CSV
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'text/csv; charset=utf-8');
    responseHeaders.set('Content-Disposition', `attachment; filename="respostas_${form.titulo.replace(/\s+/g, '_')}_${new Date().toISOString()}.csv"`);

    const encoder = new TextEncoder();
    const csvBuffer = encoder.encode(csvContent);

    return new NextResponse(csvBuffer, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error: unknown) {
    let message = "Ocorreu um erro interno.";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
