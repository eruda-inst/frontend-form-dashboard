// Tipos de pergunta possíveis para garantir consistência
export type TipoPergunta =
  | "texto-curto"
  | "texto-longo"
  | "multipla-escolha"
  | "caixa-de-selecao" // Checkbox
  | "lista-suspensa" // Dropdown
  | "data"
  | "numero"

// Usando uma união discriminada para modelar os tipos de pergunta.
// Isso garante que `opcoes` só exista quando o `tipo` for apropriado.

// Base para todas as perguntas
type PerguntaBase = {
  id: string
  pergunta: string
  obrigatoria?: boolean
}

// Pergunta que não precisa de opções
type PerguntaSemOpcoes = PerguntaBase & {
  tipo: "texto-curto" | "texto-longo" | "data" | "numero"
}

// Pergunta que precisa de opções
type PerguntaComOpcoes = PerguntaBase & {
  tipo: "multipla-escolha" | "caixa-de-selecao" | "lista-suspensa"
  opcoes: string[] // Um array de strings para as opções
}

export type Pergunta = PerguntaSemOpcoes | PerguntaComOpcoes

export type Form = {
  id: string
  titulo: string
  descricao: string
  perguntas: Pergunta[]
  criado_em: string // Mantendo o nome do campo da API
}

