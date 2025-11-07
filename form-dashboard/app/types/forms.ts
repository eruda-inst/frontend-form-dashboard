// app/types/forms.ts

// 1. Definição dos Tipos de Pergunta
// Agrupados por categoria para maior clareza.

export type TipoPerguntaSimples =
  | "texto_simples"
  | "texto_longo"
  | "data"
  | "numero"
  | "email"
  | "telefone"
  | "cnpj";

export type TipoPerguntaComOpcoes = "multipla_escolha" | "caixa_selecao";

export type TipoPerguntaNPS = "nps";

/**
 * União de todos os tipos de pergunta possíveis.
 */
export type TipoPergunta =
  | TipoPerguntaSimples
  | TipoPerguntaComOpcoes
  | TipoPerguntaNPS;

// 2. Estruturas de Dados

/**
 * Interface base com campos comuns a todas as perguntas.
 */
export interface PerguntaBase {
  id: string;
  texto: string;
  descricao: string | null;
  obrigatoria: boolean;
  ordem_exibicao: number;
  bloco_id: string | null;
}

/**
 * Pergunta que não requer propriedades adicionais (ex: campo de texto).
 */
export interface PerguntaSimples extends PerguntaBase {
  tipo: TipoPerguntaSimples;
}

/**
 * Pergunta que inclui uma lista de opções (ex: múltipla escolha).
 */
export interface PerguntaComOpcoes extends PerguntaBase {
  tipo: TipoPerguntaComOpcoes;
  opcoes: { texto: string }[];
}

/**
 * Pergunta específica para Net Promoter Score (NPS), com escala.
 */
export interface PerguntaNPS extends PerguntaBase {
  tipo: TipoPerguntaNPS;
  escala_min: number;
  escala_max: number;
}

/**
 * Tipo unificado para uma Pergunta.
 * Utiliza uma união discriminada baseada no campo `tipo` para garantir
 * a presença das propriedades corretas para cada tipo de pergunta.
 */
export type Pergunta = PerguntaSimples | PerguntaComOpcoes | PerguntaNPS;

/**
 * Representa um bloco ou seção de um formulário.
 */
export interface Bloco {
  id: string;
  titulo: string;
  descricao: string | null;
  form_id: string;
}

/**
 * Representa a estrutura completa de um formulário.
 */
export interface Form {
  id: string;
  titulo: string;
  descricao: string;
  perguntas: Pergunta[];
  blocos: Bloco[];
  criado_em: string;
  atualizado_em: string;
  unico_por_chave_modo: any; // TODO: Definir tipo apropriado se conhecido
}
