export type TipoPergunta =
  | "texto_simples"
  | "texto_longo"
  | "multipla_escolha"
  | "caixa_selecao"
  | "data"
  | "numero"
  | "nps"

interface PerguntaBase {
  id: string
  pergunta: string
  tipo: TipoPergunta
  obrigatoria: boolean
  texto: string
}

export interface PerguntaTexto extends PerguntaBase {
  tipo: "texto_simples" | "texto_longo" | "data" | "numero"
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
  id: string
  titulo: string
  descricao: string
  perguntas: Pergunta[]
  criado_em: string
  atualizado_em: string
  texto: string
}