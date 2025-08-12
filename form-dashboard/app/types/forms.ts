export type TipoPergunta =
  | "texto-curto"
  | "texto-longo"
  | "multipla-escolha"
  | "caixa-de-selecao"
  | "lista-suspensa"
  | "data"
  | "numero"

interface PerguntaBase {
  id: string
  pergunta: string
  tipo: TipoPergunta
}

export interface PerguntaSemOpcoes extends PerguntaBase {
  tipo: "texto-curto" | "texto-longo" | "data" | "numero"
}

export interface PerguntaComOpcoes extends PerguntaBase {
  tipo: "multipla-escolha" | "caixa-de-selecao" | "lista-suspensa"
  opcoes: string[]
}

export type Pergunta = PerguntaSemOpcoes | PerguntaComOpcoes

export interface Form {
  id: string
  titulo: string
  descricao: string
  perguntas: Pergunta[]
  criado_em: string
  atualizado_em: string
}