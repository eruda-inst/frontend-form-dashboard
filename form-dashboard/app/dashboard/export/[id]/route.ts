import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Pergunta, Form } from "@/app/types/forms";
import type { Resposta } from "@/app/types/responses";

/* ========================
 * Utilidades de string/CSV
 * ======================== */

/** Troca CR/LF isolados por \n e evita caracteres de controle bizarros */
function normalizeNewlines(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/** Escapa valor para CSV (RFC 4180-ish) */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  // Converte tudo para string, normaliza quebras
  const stringValue = normalizeNewlines(String(value));
  // Se tiver aspas, vírgula, quebra ou tab, envolve em aspas e duplica aspas internas
  if (
    stringValue.includes('"') ||
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes("\t")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/** Gera nome ASCII seguro (para fallback) */
function toAsciiFileName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacríticos
    .replace(/[–—−]/g, "-") // traços unicode → "-"
    .replace(/[^\w.\-]+/g, "_") // qualquer coisa fora de [\w.-] → "_"
    .replace(/^_+|_+$/g, "") // remove underscores nas bordas
    .slice(0, 120) || "arquivo";
}

/** Percent-encode para filename* (RFC 5987) */
function encodeRFC5987(v: string): string {
  return encodeURIComponent(v)
    .replace(/['()*]/g, (c) => "%" + c.charCodeAt(0).toString(16))
    .replace(/%(7C|60|5E)/g, (m) => m.toLowerCase());
}

/** Junta linhas com CRLF e adiciona BOM UTF-8 */
function toCsvBuffer(lines: string[]): Uint8Array {
  const bom = "\uFEFF";
  const content = lines.join("\r\n");
  return new TextEncoder().encode(bom + content);
}

/* ========================
 * Fetch com timeout
 * ======================== */

async function safeFetch(
  url: string,
  options: RequestInit,
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

/* ========================
 * Tipos (fallback defensivo)
 * ======================== */

type PerguntaTipo =
  | "texto_simples"
  | "texto_longo"
  | "data"
  | "numero"
  | "nps"
  | "multipla_escolha"
  | "caixa_selecao";

type PerguntaMin = {
  id: string;
  texto: string;
  tipo: PerguntaTipo;
  ordem?: number | null;
};

type FormMin = {
  id: string;
  titulo: string;
  perguntas: PerguntaMin[];
};

type RespostaItem = {
  id: string;
  pergunta_id: string;
  valor_texto?: string | null;
  valor_numero?: number | null;
  valor_opcao_id?: string | null;
  valor_opcao_texto?: string | null;
  valor_opcao?: { texto?: string | null; ordem?: number | null } | null;
};

type RespostaMin = {
  id: string;
  criado_em: string;
  itens: RespostaItem[];
};

/* ========================
 * Handler
 * ======================== */

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const accessToken = (await cookieStore).get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const formId = params.id;

  try {
    // 1) Buscar formulário (perguntas)
    const formUrl = `${process.env.NEXT_PUBLIC_API_URL}/formularios/${encodeURIComponent(
      formId
    )}`;

    const formRes = await safeFetch(
      formUrl,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
      20000
    );

    if (!formRes.ok) {
      const body = await formRes.text().catch(() => "");
      throw new Error(
        `Falha ao buscar o formulário (${formRes.status}). ${body?.slice(0, 300)}`
      );
    }

    // Faz um parse defensivo
    const form: FormMin =
      (await formRes.json().catch(() => null)) ||
      ({} as unknown as FormMin);

    const perguntas: PerguntaMin[] = Array.isArray(form?.perguntas)
      ? form.perguntas
      : [];

    // Ordena perguntas por 'ordem' se existir, mantendo estável
    perguntas.sort((a, b) => {
      const ao = a.ordem ?? Number.MAX_SAFE_INTEGER;
      const bo = b.ordem ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.texto.localeCompare(b.texto ?? "", "pt-BR");
    });

    // 2) Buscar respostas
    const respUrl = `${process.env.NEXT_PUBLIC_API_URL}/respostas/formulario/${encodeURIComponent(
      formId
    )}`;

    const responsesRes = await safeFetch(
      respUrl,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
      30000
    );

    if (!responsesRes.ok) {
      const body = await responsesRes.text().catch(() => "");
      throw new Error(
        `Falha ao buscar as respostas (${responsesRes.status}). ${body?.slice(
          0,
          300
        )}`
      );
    }

    const responses: RespostaMin[] =
      (await responsesRes.json().catch(() => [])) || [];

    // Ordena respostas por criado_em asc (se quiser desc, inverta)
    responses.sort((a, b) => {
      const ta = Date.parse(a?.criado_em ?? "") || 0;
      const tb = Date.parse(b?.criado_em ?? "") || 0;
      return ta - tb;
    });

    // 3) Monta CSV
    const headers = [
      "ID da Resposta",
      "Enviado em",
      ...perguntas.map((p) => p.texto ?? ""),
    ];

    const csvLines: string[] = [];
    csvLines.push(headers.map(escapeCsvValue).join(","));

    // Helper de data: se der ruim, cai para ISO
    function formatBrDate(iso: string): string {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso || "";
      try {
        return new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(d);
      } catch {
        return d.toISOString();
      }
    }

    for (const response of responses) {
      const row: string[] = [];
      row.push(escapeCsvValue(response?.id ?? ""));
      row.push(escapeCsvValue(formatBrDate(response?.criado_em ?? "")));

      for (const pergunta of perguntas) {
        const items = (response?.itens ?? []).filter(
          (i) => i?.pergunta_id === pergunta.id
        );

        let valor = "";

        if (items.length > 0) {
          switch (pergunta.tipo) {
            case "texto_simples":
            case "texto_longo":
            case "data": {
              valor = items[0]?.valor_texto ?? "";
              break;
            }
            case "numero":
            case "nps": {
              const n = items[0]?.valor_numero;
              valor =
                n === null || n === undefined || Number.isNaN(Number(n))
                  ? ""
                  : String(n);
              break;
            }
            case "multipla_escolha":
            case "caixa_selecao": {
              // Junta várias opções por "; "
              const parts = items
                .map((i) => i?.valor_opcao?.texto ?? i?.valor_opcao_texto ?? "")
                .filter((x) => x !== null && x !== undefined && String(x).length);
              valor = parts.join("; ");
              break;
            }
            default: {
              // Tipos novos caem num fallback textual
              const best =
                items[0]?.valor_texto ??
                (items[0]?.valor_numero !== null &&
                items[0]?.valor_numero !== undefined
                  ? String(items[0].valor_numero)
                  : "") ??
                "";
              valor = best;
            }
          }
        }

        row.push(escapeCsvValue(valor));
      }

      csvLines.push(row.join(","));
    }

    // 4) Monta headers Content-Disposition seguro
    const rawTitle = String(form?.titulo ?? "formulario").trim() || "formulario";
    const fallback = toAsciiFileName(`respostas_${rawTitle}`);
    const pretty = `respostas_${rawTitle}_${new Date().toISOString()}.csv`;
    const dispo =
      `attachment; filename="${fallback}.csv"; ` +
      `filename*=UTF-8''${encodeRFC5987(pretty)}`;

    const headersOut = new Headers();
    headersOut.set("Content-Type", "text/csv; charset=utf-8");
    headersOut.set("Content-Disposition", dispo);

    // 5) Retorna buffer (BOM + CRLF)
    const csvBuffer = toCsvBuffer(csvLines);

    // Converte Uint8Array para Buffer
    const csvBufferNode = Buffer.from(csvBuffer);

    return new NextResponse(csvBufferNode, {
      status: 200,
      headers: headersOut,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Ocorreu um erro interno.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
