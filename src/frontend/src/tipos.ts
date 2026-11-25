export type Direcao = 'norte' | 'leste' | 'sul' | 'oeste'
export type DirecaoMovimento = 'esquerda' | 'direita' | 'cima' | 'baixo'

export type TipoCasa =
  | 'vazio'
  | 'parede'
  | 'portao'
  | 'destino'
  | 'inimigo'
  | 'item'
  | 'bau'
  | 'porta'
  | 'espinhos'
  | 'armadilha'

export interface Casa {
  tipo: TipoCasa
  marco?: boolean
  aberto?: boolean
  resistencia?: number
  dano?: number
  conteudo?: string
}

export interface Tentativa {
  id?: string
  semente: number
  faseId: string
  largura: number
  altura: number
  casas: Casa[]
  inicio: Personagem
  limiteDePassos: number
  programa: Instrucao[]
  temNeblina?: boolean
}

export interface Posicao {
  x: number
  y: number
}

export interface Personagem {
  posicao: Posicao
  olhar: Direcao
  vida: number
  ataque: number
  alforje: string[]
}

export type Bloco =
  | { tipo: 'mover'; direcao: DirecaoMovimento }
  | { tipo: 'virar'; sentido: 'esquerda' | 'direita' }
  | { tipo: 'avancar' }
  | { tipo: 'atacar' }
  | { tipo: 'pegar' }

export interface BlocoInstancia {
  id: string
  bloco: Bloco
}

/* --------------------------------------------------------------------------
 * Árvore de blocos (programador com aninhamento)
 * Sensores e comparações ocupam só a pergunta de uma caixa.
 * Ações (e futuramente chamadas de rotina) ocupam só o corpo.
 * -------------------------------------------------------------------------- */

export type Sensor = 'parede_frente' | 'inimigo_frente' | 'item_aqui' | 'cheguei_destino'

export type VariavelPersonagem = 'vida' | 'ataque'
export type OperadorComparacao = '>=' | '<=' | '>' | '<' | '=='

export type Condicao =
  | { tipo: 'sensor'; sensor: Sensor }
  | { tipo: 'nao'; condicao: Condicao }
  | {
      tipo: 'comparacao'
      esquerda: VariavelPersonagem
      operador: OperadorComparacao
      direita: number
    }

/** Ação executável. `ref` é opcional e só serve para o cliente destacar o bloco em execução. */
export type Acao = Bloco & { ref?: string }

export interface RamoSe {
  /** `null` enquanto o jogador não encaixou uma pergunta. */
  condicao: Condicao | null
  corpo: Instrucao[]
}

export type Instrucao =
  | Acao
  | {
      tipo: 'se'
      /** ramos[0] é o `então`; os seguintes são `senão se`. */
      ramos: RamoSe[]
      /** `null` quando a caixa não tem `senão`. */
      senao: Instrucao[] | null
    }
  | { tipo: 'enquanto'; condicao: Condicao | null; corpo: Instrucao[] }
  | { tipo: 'repetir'; vezes: number; corpo: Instrucao[] }

export type TipoCaixa = 'se' | 'enquanto' | 'repetir'

export type Veredito =
  | 'sem_vitoria'
  | 'vitoria'
  | 'parede'
  | 'inimigo'
  | 'vida_zerada'
  | 'limite_de_passos'

export interface Evento {
  bloco: Acao
  personagem: Personagem
  veredito: Veredito
}

export interface FaseResumo {
  id: string
  ordem: number
  nome: string
  conceito: string
  descricao: string
  porQueEntraAqui?: string
  disponivel: boolean
  novosRecursos?: string[]
}

export interface Fase {
  id: string
  ordem: number
  nome: string
  conceito: string
  enunciado: string
  dicaTutorial: string
  largura: number
  altura: number
  casas: Casa[]
  blocosLiberados: Bloco[]
  inicio: Personagem
  limiteDePassos: number
  condicaoDeVitoria: 'chegar_no_destino'
  temNeblina?: boolean
  exibirOlhar?: boolean
  /** Caixas disponíveis na paleta (se, enquanto, repetir). */
  caixasLiberadas?: TipoCaixa[]
  /** Sensores e comparações disponíveis para encaixar na pergunta. */
  condicoesLiberadas?: Condicao[]
}

export interface Progresso {
  fasesConcluidas: string[]
  talento: string | null
}

export interface Resultado {
  eventos: Evento[]
  veredito: Veredito
  personagem: Personagem
  programa: Instrucao[]
}

