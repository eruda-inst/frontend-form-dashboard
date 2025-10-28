export type TipoPergunta =
  | "texto_simples"
  | "texto_longo"
  | "multipla_escolha"
  | "caixa_selecao"
  | "data"
  | "numero"
  | "nps"
  | "email"
  | "telefone"
  | "cnpj"

export interface Bloco {
  id: string
  titulo: string
  descricao: string | null
  form_id: string
}

interface PerguntaBase {
  id: string
  pergunta: string
  tipo: TipoPergunta
  obrigatoria: boolean
  texto: string
  ordem_exibicao: number
  opcoes: { texto: string }[]
  bloco_id: string | null
}

export interface PerguntaTexto extends PerguntaBase {
  tipo: "texto_simples" | "texto_longo" | "data" | "numero" | "email" | "telefone" | "cnpj"
}

export interface PerguntaNPS extends PerguntaBase {
  tipo: "nps"
  escala_min: number
  escala_max: number
}

export interface PerguntaComOpcoes extends PerguntaBase {
  tipo: "multipla_escolha" | "caixa_selecao"
  opcoes: { texto: string }[]
}

export type Pergunta = PerguntaTexto | PerguntaNPS | PerguntaComOpcoes

export interface Form {
  unico_por_chave_modo: any
  id: string
  titulo: string
  descricao: string
  perguntas: Pergunta[]
  blocos: Bloco[]
  criado_em: string
  atualizado_em: string
  texto: string
}