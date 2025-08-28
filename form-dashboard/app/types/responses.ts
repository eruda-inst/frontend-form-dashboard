export interface ValorOpcao {
  id: string;
  pergunta_id: string;
  texto: string;
  ordem: number;
}

export interface RespostaItem {
  id: string;
  pergunta_id: string;
  valor_texto: string | null;
  valor_numero: number | null;
  valor_opcao_id: string | null;
  valor_opcao_texto: string | null;
  valor_opcao: ValorOpcao | null;
}

export interface Resposta {
  id: string;
  formulario_id: string;
  criado_em: string;
  origem_ip: string;
  user_agent: string;
  meta: Record<string, any>;
  itens: RespostaItem[];
}