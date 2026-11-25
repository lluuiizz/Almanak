import type {
  Acao,
  Condicao,
  Instrucao,
  Sensor,
  Bloco,
  Casa,
  Direcao,
  Evento,
  Fase,
  FaseResumo,
  Personagem,
  Posicao,
  Resultado,
  Tentativa,
  Veredito,
} from './tipos'

export const FASE_1: Fase = {
  id: 'fase-1',
  ordem: 1,
  nome: 'Tutorial',
  conceito: 'Sequência',
  enunciado:
    'Player, o seu objetivo é chegar até o quadrado escrito Destino. Para isso você dispõe das seguintes ações: mover-se à direita, mover-se à esquerda, mover-se para cima/baixo. Arraste os blocos de ações para o "Programador de ações" e aperte o botão de Play para que inicie a sequência.',
  dicaTutorial:
    'Um único bloco "mover-se à direita" faz o personagem dar um passo e parar no marco X. Coloque dois blocos "mover-se à direita" e aperte Play para alcançar o Destino!',
  largura: 3,
  altura: 1,
  casas: [{ tipo: 'vazio' }, { tipo: 'vazio', marco: true }, { tipo: 'destino' }],
  blocosLiberados: [
    { tipo: 'mover', direcao: 'esquerda' },
    { tipo: 'mover', direcao: 'direita' },
    { tipo: 'mover', direcao: 'cima' },
    { tipo: 'mover', direcao: 'baixo' },
  ],
  inicio: {
    posicao: { x: 0, y: 0 },
    olhar: 'leste',
    vida: 1,
    ataque: 1,
    alforje: [],
  },
  limiteDePassos: 8,
  condicaoDeVitoria: 'chegar_no_destino',
}

export const FASE_3: Fase = {
  id: 'fase-3',
  ordem: 3,
  nome: 'O muro',
  conceito: 'se e sensor',
  enunciado:
    'Um muro fecha a reta. O destino está no desvio de baixo. A partir desta fase o personagem passa a ter um olhar (a direção do último movimento ou giro).',
  dicaTutorial:
    'Andar para a direita três vezes choca com o muro. Desça na bifurcação e siga à direita até o destino!',
  largura: 4,
  altura: 2,
  casas: [
    { tipo: 'vazio' },
    { tipo: 'vazio' },
    { tipo: 'parede' },
    { tipo: 'parede' },
    { tipo: 'parede' },
    { tipo: 'vazio' },
    { tipo: 'vazio' },
    { tipo: 'destino' },
  ],
  blocosLiberados: [
    { tipo: 'mover', direcao: 'esquerda' },
    { tipo: 'mover', direcao: 'direita' },
    { tipo: 'mover', direcao: 'cima' },
    { tipo: 'mover', direcao: 'baixo' },
    { tipo: 'virar', sentido: 'esquerda' },
    { tipo: 'virar', sentido: 'direita' },
    { tipo: 'avancar' },
  ],
  inicio: {
    posicao: { x: 0, y: 0 },
    olhar: 'leste',
    vida: 1,
    ataque: 1,
    alforje: [],
  },
  limiteDePassos: 12,
  condicaoDeVitoria: 'chegar_no_destino',
  exibirOlhar: true,
  caixasLiberadas: ['se'],
  condicoesLiberadas: [{ tipo: 'sensor', sensor: 'parede_frente' }],
}

export const FASE_4: Fase = {
  id: 'fase-4',
  ordem: 4,
  nome: 'O portão',
  conceito: 'senão',
  enunciado:
    'O quadrado do portão às vezes é parede (fechado) e às vezes é passagem (aberto), conforme o sorteio da tentativa no servidor.',
  dicaTutorial:
    'Quando o portão sorteado vem aberto, basta seguir reto; quando vem fechado, contorne por baixo.',
  largura: 4,
  altura: 2,
  casas: [
    { tipo: 'vazio' },
    { tipo: 'vazio' },
    { tipo: 'portao', aberto: false },
    { tipo: 'destino' },
    { tipo: 'parede' },
    { tipo: 'vazio' },
    { tipo: 'vazio' },
    { tipo: 'destino' },
  ],
  blocosLiberados: [
    { tipo: 'mover', direcao: 'esquerda' },
    { tipo: 'mover', direcao: 'direita' },
    { tipo: 'mover', direcao: 'cima' },
    { tipo: 'mover', direcao: 'baixo' },
    { tipo: 'virar', sentido: 'esquerda' },
    { tipo: 'virar', sentido: 'direita' },
    { tipo: 'avancar' },
  ],
  inicio: {
    posicao: { x: 0, y: 0 },
    olhar: 'leste',
    vida: 1,
    ataque: 1,
    alforje: [],
  },
  limiteDePassos: 12,
  condicaoDeVitoria: 'chegar_no_destino',
  exibirOlhar: true,
  caixasLiberadas: ['se'],
  condicoesLiberadas: [{ tipo: 'sensor', sensor: 'parede_frente' }],
}

export const FASE_5: Fase = {
  id: 'fase-5',
  ordem: 5,
  nome: 'O corredor cego',
  conceito: 'enquanto',
  enunciado:
    'Neblina cobre o mapa! Só a casa atual e as vizinhas ficam visíveis; o resto permanece encoberto enquanto o personagem não se aproxima. O comprimento do corredor é sorteado a cada tentativa.',
  dicaTutorial:
    'Avance pelo corredor até encontrar a parede no fim, vire à direita (ou desça) e entre no Destino!',
  largura: 6,
  altura: 2,
  casas: [
    { tipo: 'vazio' },
    { tipo: 'vazio' },
    { tipo: 'vazio' },
    { tipo: 'vazio' },
    { tipo: 'vazio' },
    { tipo: 'parede' },
    { tipo: 'parede' },
    { tipo: 'parede' },
    { tipo: 'parede' },
    { tipo: 'parede' },
    { tipo: 'destino' },
    { tipo: 'parede' },
  ],
  blocosLiberados: [
    { tipo: 'avancar' },
    { tipo: 'virar', sentido: 'esquerda' },
    { tipo: 'virar', sentido: 'direita' },
    { tipo: 'mover', direcao: 'direita' },
    { tipo: 'mover', direcao: 'baixo' },
  ],
  inicio: {
    posicao: { x: 0, y: 0 },
    olhar: 'leste',
    vida: 1,
    ataque: 1,
    alforje: [],
  },
  limiteDePassos: 16,
  condicaoDeVitoria: 'chegar_no_destino',
  temNeblina: true,
  exibirOlhar: true,
  caixasLiberadas: ['enquanto', 'se'],
  condicoesLiberadas: [
    { tipo: 'nao', condicao: { tipo: 'sensor', sensor: 'parede_frente' } },
    { tipo: 'sensor', sensor: 'parede_frente' },
  ],
}

export const FASE_9: Fase = {
  id: 'fase-9',
  ordem: 9,
  nome: 'A porta lacrada',
  conceito: 'Variável, comparação',
  enunciado:
    'Demonstração completa dos elementos do mapa: casa do jogador, marco X, paredes, portão, inimigo, baú, porta lacrada, espinhos, armadilha e destino.',
  dicaTutorial:
    'Cada tipo de casa possui representação visual distinta no tabuleiro.',
  largura: 5,
  altura: 2,
  casas: [
    { tipo: 'vazio' },
    { tipo: 'vazio', marco: true },
    { tipo: 'bau', conteudo: 'espada (+2 ataque)' },
    { tipo: 'porta', resistencia: 3 },
    { tipo: 'destino' },
    { tipo: 'parede' },
    { tipo: 'portao', aberto: false },
    { tipo: 'inimigo', resistencia: 2 },
    { tipo: 'espinhos', dano: 2 },
    { tipo: 'armadilha', dano: 2 },
  ],
  blocosLiberados: [
    { tipo: 'mover', direcao: 'esquerda' },
    { tipo: 'mover', direcao: 'direita' },
    { tipo: 'mover', direcao: 'cima' },
    { tipo: 'mover', direcao: 'baixo' },
    { tipo: 'virar', sentido: 'esquerda' },
    { tipo: 'virar', sentido: 'direita' },
    { tipo: 'avancar' },
    { tipo: 'atacar' },
    { tipo: 'pegar' },
  ],
  inicio: {
    posicao: { x: 0, y: 0 },
    olhar: 'leste',
    vida: 5,
    ataque: 1,
    alforje: [],
  },
  limiteDePassos: 16,
  condicaoDeVitoria: 'chegar_no_destino',
  exibirOlhar: true,
  caixasLiberadas: ['se', 'enquanto', 'repetir'],
  condicoesLiberadas: [
    { tipo: 'sensor', sensor: 'parede_frente' },
    { tipo: 'nao', condicao: { tipo: 'sensor', sensor: 'parede_frente' } },
    { tipo: 'sensor', sensor: 'inimigo_frente' },
    { tipo: 'sensor', sensor: 'item_aqui' },
    { tipo: 'nao', condicao: { tipo: 'sensor', sensor: 'cheguei_destino' } },
    { tipo: 'comparacao', esquerda: 'ataque', operador: '>=', direita: 3 },
    { tipo: 'comparacao', esquerda: 'vida', operador: '<=', direita: 2 },
  ],
}

export const MAPA_FASES_POR_ID: Record<string, Fase> = {
  'fase-1': FASE_1,
  'fase-3': FASE_3,
  'fase-4': FASE_4,
  'fase-5': FASE_5,
  'fase-9': FASE_9,
}

export const CATALOGO_FASES: FaseResumo[] = [
  {
    id: 'fase-1',
    ordem: 1,
    nome: 'Tutorial',
    conceito: 'Sequência',
    descricao: 'Um e dois passos até o destino.',
    disponivel: true,
    novosRecursos: ['mover'],
  },
  {
    id: 'fase-2',
    ordem: 2,
    nome: 'A curva',
    conceito: 'Ordem',
    descricao: 'A sequência fica longa e a ordem passa a importar.',
    disponivel: false,
    novosRecursos: ['mover'],
  },
  {
    id: 'fase-3',
    ordem: 3,
    nome: 'O muro',
    conceito: 'se e sensor',
    descricao: 'A reta está fechada; é preciso perguntar antes de andar.',
    disponivel: true,
    novosRecursos: ['virar', 'avancar', 'se', 'parede_frente'],
  },
  {
    id: 'fase-4',
    ordem: 4,
    nome: 'O portão',
    conceito: 'senão',
    descricao: 'A mesma fase tem duas configurações.',
    disponivel: true,
    novosRecursos: ['senao'],
  },
  {
    id: 'fase-5',
    ordem: 5,
    nome: 'O corredor cego',
    conceito: 'enquanto',
    descricao: 'O tamanho muda; o laço relê "existe parede à frente?".',
    disponivel: true,
    novosRecursos: ['enquanto', 'nao'],
  },
  {
    id: 'fase-6',
    ordem: 6,
    nome: 'A patrulha',
    conceito: 'se dentro de enquanto',
    descricao: 'O guarda aparece num ponto sorteado.',
    disponivel: false,
    novosRecursos: ['atacar', 'inimigo_frente', 'cheguei_destino'],
  },
  {
    id: 'fase-7',
    ordem: 7,
    nome: 'A escada',
    conceito: 'repetir N vezes',
    descricao: 'O motivo se repete um número visível de vezes.',
    disponivel: false,
    novosRecursos: ['repetir'],
  },
  {
    id: 'fase-8',
    ordem: 8,
    nome: 'Três alcovas',
    conceito: 'Rotina',
    descricao: 'A mesma sequência ganha um nome e é chamada.',
    disponivel: false,
    novosRecursos: ['rotina'],
  },
  {
    id: 'fase-9',
    ordem: 9,
    nome: 'A porta lacrada',
    conceito: 'Variável, comparação',
    descricao: 'Vida e ataque mudam, e a porta lê o valor.',
    disponivel: true,
    novosRecursos: ['pegar', 'item_aqui', 'comparacao'],
  },
  {
    id: 'fase-10',
    ordem: 10,
    nome: 'O alforje',
    conceito: 'Array',
    descricao: 'A chave ocupa uma posição sorteada na bolsa.',
    disponivel: false,
    novosRecursos: ['alforje'],
  },
  {
    id: 'fase-11',
    ordem: 11,
    nome: 'O talento',
    conceito: 'Constante',
    descricao: 'Um atributo permanente entra na conta e não se reatribui.',
    disponivel: false,
    novosRecursos: ['talento'],
  },
  {
    id: 'fase-12',
    ordem: 12,
    nome: 'A encruzilhada',
    conceito: 'e, ou',
    descricao: 'A decisão depende de mais de um booleano ao mesmo tempo.',
    disponivel: false,
    novosRecursos: ['e', 'ou'],
  },
]

/**
 * Devolve o conjunto de recursos (ações, caixas e condições) que o catálogo já liberou
 * até a fase informada. Garante que fases iniciais não ofereçam blocos de fases futuras
 * (ex: sem `enquanto` na fase do muro, sem `rotina` antes das alcovas).
 */
export function recursosLiberadosAteAFase(ordemOuId: number | string): Set<string> {
  const resumo =
    typeof ordemOuId === 'number'
      ? CATALOGO_FASES.find((f) => f.ordem === ordemOuId)
      : CATALOGO_FASES.find((f) => f.id === ordemOuId)
  const limiteOrdem = resumo?.ordem ?? (typeof ordemOuId === 'number' ? ordemOuId : 1)

  const liberados = new Set<string>()
  for (const fase of CATALOGO_FASES) {
    if (fase.ordem <= limiteOrdem && fase.novosRecursos) {
      for (const recurso of fase.novosRecursos) {
        liberados.add(recurso)
      }
    }
  }
  return liberados
}

function condicaoPermitidaPeloCatalogo(condicao: Condicao, liberados: Set<string>): boolean {
  if (condicao.tipo === 'sensor') {
    return liberados.has(condicao.sensor)
  }
  if (condicao.tipo === 'nao') {
    return liberados.has('nao') && condicaoPermitidaPeloCatalogo(condicao.condicao, liberados)
  }
  return liberados.has('comparacao')
}

/**
 * Filtra os blocos, caixas e condições da fase aberta para garantir que a paleta
 * mostre apenas o que o catálogo liberou até aquela fase.
 */
export function paletaPermitidaPeloCatalogo(fase: Fase): {
  blocosLiberados: Bloco[]
  caixasLiberadas: NonNullable<Fase['caixasLiberadas']>
  condicoesLiberadas: NonNullable<Fase['condicoesLiberadas']>
} {
  const liberados = recursosLiberadosAteAFase(fase.id)

  return {
    blocosLiberados: fase.blocosLiberados.filter((bloco) => liberados.has(bloco.tipo)),
    caixasLiberadas: (fase.caixasLiberadas ?? []).filter((caixa) => liberados.has(caixa)),
    condicoesLiberadas: (fase.condicoesLiberadas ?? []).filter((condicao) =>
      condicaoPermitidaPeloCatalogo(condicao, liberados),
    ),
  }
}

const ORDEM: Direcao[] = ['norte', 'leste', 'sul', 'oeste']

const PASSO: Record<Direcao, Posicao> = {
  norte: { x: 0, y: -1 },
  leste: { x: 1, y: 0 },
  sul: { x: 0, y: 1 },
  oeste: { x: -1, y: 0 },
}

const MOVIMENTO_PARA_OLHAR = {
  cima: 'norte',
  direita: 'leste',
  baixo: 'sul',
  esquerda: 'oeste',
} as const

function clonarPersonagem(p: Personagem): Personagem {
  return {
    ...p,
    posicao: { ...p.posicao },
    alforje: [...p.alforje],
  }
}

function dentro(pos: Posicao, largura: number, altura: number): boolean {
  return pos.x >= 0 && pos.y >= 0 && pos.x < largura && pos.y < altura
}

function casaEm(mapa: Pick<Tentativa, 'casas' | 'largura'>, pos: Posicao): Casa {
  return mapa.casas[pos.y * mapa.largura + pos.x]
}

function girar(olhar: Direcao, sentido: 'esquerda' | 'direita'): Direcao {
  const idx = ORDEM.indexOf(olhar)
  const delta = sentido === 'direita' ? 1 : -1
  return ORDEM[(idx + delta + ORDEM.length) % ORDEM.length]
}

function andar(
  personagem: Personagem,
  direcao: Direcao,
  mapa: Pick<Tentativa, 'casas' | 'largura' | 'altura'>,
): { personagem: Personagem; veredito?: Veredito } {
  const delta = PASSO[direcao]
  const alvo = {
    x: personagem.posicao.x + delta.x,
    y: personagem.posicao.y + delta.y,
  }
  const virado = { ...clonarPersonagem(personagem), olhar: direcao }

  if (!dentro(alvo, mapa.largura, mapa.altura)) {
    return { personagem: virado, veredito: 'parede' }
  }

  const casa = casaEm(mapa, alvo)
  if (casa.tipo === 'parede' || (casa.tipo === 'portao' && !casa.aberto)) {
    return { personagem: virado, veredito: 'parede' }
  }
  if (casa.tipo === 'porta' && (casa.resistencia ?? 3) > 0) {
    return { personagem: virado, veredito: 'parede' }
  }
  if (casa.tipo === 'inimigo') {
    return { personagem: virado, veredito: 'inimigo' }
  }

  const avancou = { ...virado, posicao: alvo }
  if (casa.tipo === 'espinhos' || casa.tipo === 'armadilha') {
    const dano = casa.dano ?? 2
    avancou.vida = Math.max(0, avancou.vida - dano)
    if (avancou.vida <= 0) {
      return { personagem: avancou, veredito: 'vida_zerada' }
    }
  }
  if (casa.tipo === 'destino') {
    return { personagem: avancou, veredito: 'vitoria' }
  }

  return { personagem: avancou }
}

/**
 * Gera a tentativa local aplicando o sorteio determinístico da semente (quando o servidor HTTP não está ativo),
 * espelhando exatamente o estado que o servidor devolve ao abrir uma tentativa.
 * - Na Fase 4 (O portão): a semente sorteia se o portão está aberto ou fechado.
 * - Na Fase 5 (O corredor cego): a semente sorteia o comprimento do corredor (4, 5 ou 6 passos) antes da parede e a posição do destino na curva.
 */
export function sortearTentativaDaFase(
  fase: Fase,
  semente: number = 1,
  programa: Instrucao[] = [],
): Tentativa {
  if (fase.id === 'fase-4') {
    const portaoAberto = Math.abs(semente) % 2 === 1
    const casas = fase.casas.map((casa) =>
      casa.tipo === 'portao' ? { ...casa, aberto: portaoAberto } : { ...casa },
    )
    return {
      semente,
      faseId: fase.id,
      largura: fase.largura,
      altura: fase.altura,
      casas,
      inicio: clonarPersonagem(fase.inicio),
      limiteDePassos: fase.limiteDePassos,
      programa: [...programa],
      temNeblina: Boolean(fase.temNeblina),
    }
  }

  if (fase.id === 'fase-5') {
    // Comprimentos possíveis do corredor conforme a semente (ex: 3, 4 ou 5 passos livres antes da parede)
    const comprimentos = [3, 4, 5]
    const passosLivres = comprimentos[Math.abs(semente) % comprimentos.length]
    const largura = passosLivres + 2 // início + passosLivres + parede final
    const altura = 2
    const casas: Casa[] = Array.from({ length: largura * altura }, () => ({ tipo: 'parede' }))

    // Linha 0: corredor livre de x = 0 até x = passosLivres, e parede em x = passosLivres + 1
    for (let x = 0; x <= passosLivres; x += 1) {
      casas[x] = { tipo: 'vazio' }
    }
    casas[passosLivres + 1] = { tipo: 'parede' }

    // Linha 1: destino logo abaixo da última casa livre (curva à direita)
    casas[largura + passosLivres] = { tipo: 'destino' }

    return {
      semente,
      faseId: fase.id,
      largura,
      altura,
      casas,
      inicio: clonarPersonagem(fase.inicio),
      limiteDePassos: fase.limiteDePassos,
      programa: [...programa],
      temNeblina: true,
    }
  }

  return {
    semente,
    faseId: fase.id,
    largura: fase.largura,
    altura: fase.altura,
    casas: fase.casas.map((casa) => ({ ...casa })),
    inicio: clonarPersonagem(fase.inicio),
    limiteDePassos: fase.limiteDePassos,
    programa: [...programa],
    temNeblina: Boolean(fase.temNeblina),
  }
}

function obterApiUrl(apiUrlOverride?: string): string | undefined {
  if (apiUrlOverride) return apiUrlOverride
  const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
  return metaEnv?.VITE_API_URL
}

/**
 * Abre uma tentativa no servidor (ou fallback local) e devolve o estado completo da tentativa,
 * inclusive o mapa (`casas`, `largura`, `altura`, `inicio`, `semente`) depois do sorteio.
 * Critério de aceite: "O mapa da tentativa aberta é o estado devolvido pelo servidor, inclusive depois do sorteio."
 */
export async function abrirTentativaNoServidor(
  fase: Fase,
  semente: number = 1,
  programa: Instrucao[] = [],
  fetchImpl: typeof fetch = fetch,
  apiUrlOverride?: string,
): Promise<Tentativa> {
  const apiUrl = obterApiUrl(apiUrlOverride)
  if (apiUrl) {
    try {
      const resposta = await fetchImpl(`${apiUrl}/fases/${fase.id}/tentativas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semente, programa }),
      })
      if (resposta.ok) {
        const dados = (await resposta.json()) as Tentativa
        return {
          ...dados,
          casas: dados.casas.map((casa) => ({ ...casa })),
          inicio: clonarPersonagem(dados.inicio),
          temNeblina: dados.temNeblina ?? Boolean(fase.temNeblina),
        }
      }
    } catch {
      // Fallback determinístico quando o servidor HTTP não está ativo
    }
  }

  return sortearTentativaDaFase(fase, semente, programa)
}

/**
 * Executa o programa na tentativa aberta (usando exatamente o mapa devolvido pelo servidor na tentativa).
 */
export async function executarProgramaNaFase(
  faseOuTentativa: Fase | Tentativa,
  programa: Instrucao[],
): Promise<Resultado> {
  const faseId = 'faseId' in faseOuTentativa ? faseOuTentativa.faseId : faseOuTentativa.id
  const apiUrl = obterApiUrl()
  if (apiUrl) {
    try {
      const resposta = await fetch(`${apiUrl}/fases/${faseId}/executar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programa,
          semente: 'semente' in faseOuTentativa ? faseOuTentativa.semente : 1,
        }),
      })
      if (resposta.ok) {
        return (await resposta.json()) as Resultado
      }
    } catch {
      // Fallback para simulação fiel ao contrato do backend enquanto a API HTTP não está ativa
    }
  }

  const inicio = clonarPersonagem(faseOuTentativa.inicio)
  return interpretarArvore(faseOuTentativa, programa, inicio)
}

/** Limite de voltas de laço sem nenhuma ação, para um `enquanto` vazio não travar o cliente. */
const FATOR_VOLTAS_SEM_ACAO = 10

class FimDaTentativa {
  readonly veredito: Veredito
  constructor(veredito: Veredito) {
    this.veredito = veredito
  }
}

function lerSensor(
  sensor: Sensor,
  personagem: Personagem,
  mapa: Pick<Tentativa, 'casas' | 'largura' | 'altura'>,
): boolean {
  const aqui = casaEm(mapa, personagem.posicao)
  if (sensor === 'item_aqui') return aqui?.tipo === 'bau' || aqui?.tipo === 'item'
  if (sensor === 'cheguei_destino') return aqui?.tipo === 'destino'

  const delta = PASSO[personagem.olhar]
  const frente = { x: personagem.posicao.x + delta.x, y: personagem.posicao.y + delta.y }
  if (sensor === 'parede_frente') {
    if (!dentro(frente, mapa.largura, mapa.altura)) return true
    const casa = casaEm(mapa, frente)
    return (
      casa.tipo === 'parede' ||
      (casa.tipo === 'portao' && !casa.aberto) ||
      (casa.tipo === 'porta' && (casa.resistencia ?? 3) > 0)
    )
  }
  // inimigo_frente
  return dentro(frente, mapa.largura, mapa.altura) && casaEm(mapa, frente).tipo === 'inimigo'
}

export function avaliarCondicao(
  condicao: Condicao,
  personagem: Personagem,
  mapa: Pick<Tentativa, 'casas' | 'largura' | 'altura'>,
): boolean {
  switch (condicao.tipo) {
    case 'sensor':
      return lerSensor(condicao.sensor, personagem, mapa)
    case 'nao':
      return !avaliarCondicao(condicao.condicao, personagem, mapa)
    case 'comparacao': {
      const valor = personagem[condicao.esquerda]
      switch (condicao.operador) {
        case '>=':
          return valor >= condicao.direita
        case '<=':
          return valor <= condicao.direita
        case '>':
          return valor > condicao.direita
        case '<':
          return valor < condicao.direita
        case '==':
          return valor === condicao.direita
      }
    }
  }
}

/**
 * Percorre a árvore de cima para baixo: volta ao topo de um laço enquanto a
 * condição vale e salta o ramo que a condição descartou. Cada ação consome um passo.
 */
export function interpretarArvore(
  mapa: Pick<Tentativa, 'casas' | 'largura' | 'altura' | 'limiteDePassos'>,
  programa: Instrucao[],
  inicio: Personagem,
): Resultado {
  let personagem = clonarPersonagem(inicio)
  const eventos: Evento[] = []
  let passos = 0
  let voltasSemAcao = 0
  const limiteVoltas = mapa.limiteDePassos * FATOR_VOLTAS_SEM_ACAO

  function executarAcao(acao: Acao) {
    if (personagem.vida <= 0) {
      eventos.push({ bloco: acao, personagem: clonarPersonagem(personagem), veredito: 'vida_zerada' })
      throw new FimDaTentativa('vida_zerada')
    }
    if (passos >= mapa.limiteDePassos) {
      eventos.push({
        bloco: acao,
        personagem: clonarPersonagem(personagem),
        veredito: 'limite_de_passos',
      })
      throw new FimDaTentativa('limite_de_passos')
    }
    passos += 1
    voltasSemAcao = 0

    let efeito: { personagem: Personagem; veredito?: Veredito } = {
      personagem: clonarPersonagem(personagem),
    }
    if (acao.tipo === 'mover') {
      efeito = andar(personagem, MOVIMENTO_PARA_OLHAR[acao.direcao], mapa)
    } else if (acao.tipo === 'virar') {
      efeito = {
        personagem: { ...clonarPersonagem(personagem), olhar: girar(personagem.olhar, acao.sentido) },
      }
    } else if (acao.tipo === 'avancar') {
      efeito = andar(personagem, personagem.olhar, mapa)
    }

    personagem = efeito.personagem
    const veredito = efeito.veredito ?? 'sem_vitoria'
    eventos.push({ bloco: acao, personagem: clonarPersonagem(personagem), veredito })
    if (veredito !== 'sem_vitoria') throw new FimDaTentativa(veredito)
  }

  function contarVolta() {
    voltasSemAcao += 1
    if (voltasSemAcao > limiteVoltas) throw new FimDaTentativa('limite_de_passos')
  }

  function testar(condicao: Condicao | null): boolean {
    // Uma pergunta vazia nunca é verdadeira (o cliente já bloqueia o Play nesse caso).
    return condicao !== null && avaliarCondicao(condicao, personagem, mapa)
  }

  function executarLista(lista: Instrucao[]) {
    for (const instrucao of lista) {
      switch (instrucao.tipo) {
        case 'se': {
          const ramo = instrucao.ramos.find((r) => testar(r.condicao))
          if (ramo) executarLista(ramo.corpo)
          else if (instrucao.senao) executarLista(instrucao.senao)
          break
        }
        case 'enquanto':
          while (testar(instrucao.condicao)) {
            contarVolta()
            executarLista(instrucao.corpo)
          }
          break
        case 'repetir':
          for (let i = 0; i < instrucao.vezes; i += 1) {
            contarVolta()
            executarLista(instrucao.corpo)
          }
          break
        default:
          executarAcao(instrucao)
      }
    }
  }

  try {
    executarLista(programa)
  } catch (erro) {
    if (!(erro instanceof FimDaTentativa)) throw erro
    if (erro.veredito === 'vitoria') {
      return { eventos, veredito: 'vitoria', personagem, programa }
    }
    // Na falha, o personagem volta ao início e o programa é preservado.
    return { eventos, veredito: erro.veredito, personagem: clonarPersonagem(inicio), programa }
  }

  return { eventos, veredito: 'sem_vitoria', personagem, programa }
}

export function rotuloBloco(bloco: Bloco): string {
  if (bloco.tipo === 'mover') {
    const mapa = {
      esquerda: 'Mover-se à esquerda',
      direita: 'Mover-se à direita',
      cima: 'Mover-se para cima',
      baixo: 'Mover-se para baixo',
    }
    return mapa[bloco.direcao]
  }
  if (bloco.tipo === 'virar') {
    return bloco.sentido === 'esquerda' ? 'Virar à esquerda' : 'Virar à direita'
  }
  if (bloco.tipo === 'avancar') return 'Avançar'
  if (bloco.tipo === 'atacar') return 'Atacar'
  return 'Pegar'
}

export function iconeBloco(bloco: Bloco): string {
  if (bloco.tipo === 'mover') {
    const setas = {
      esquerda: '←',
      direita: '→',
      cima: '↑',
      baixo: '↓',
    }
    return setas[bloco.direcao]
  }
  if (bloco.tipo === 'virar') return bloco.sentido === 'esquerda' ? '↶' : '↷'
  if (bloco.tipo === 'avancar') return '▲'
  if (bloco.tipo === 'atacar') return '⚔'
  return '✦'
}

export function mensagemVeredito(veredito: Veredito, parouNoMarcoX: boolean): {
  titulo: string
  detalhe: string
  tom: 'sucesso' | 'erro' | 'aviso'
} {
  switch (veredito) {
    case 'vitoria':
      return {
        titulo: 'Fase concluída! Você chegou ao Destino!',
        detalhe:
          'Você montou um algoritmo sequencial de dois passos à direita e conduziu o personagem até o destino.',
        tom: 'sucesso',
      }
    case 'parede':
      return {
        titulo: 'Tentativa encerrada: bateu no limite ou parede!',
        detalhe:
          'O personagem tentou sair do corredor ou bateu numa parede e voltou ao início da fase. Sua sequência continua intacta no Programador de ações para você corrigir.',
        tom: 'erro',
      }
    case 'inimigo':
      return {
        titulo: 'Tentativa encerrada: colisão com inimigo!',
        detalhe:
          'Avançar direto contra um inimigo encerra a tentativa. O personagem voltou ao início para você ajustar o programa.',
        tom: 'erro',
      }
    case 'vida_zerada':
      return {
        titulo: 'Tentativa encerrada: vida chegou a 0!',
        detalhe: 'O personagem perdeu toda a vida e retornou ao início da fase.',
        tom: 'erro',
      }
    case 'limite_de_passos':
      return {
        titulo: 'Tentativa encerrada: limite de passos atingido!',
        detalhe:
          'A sequência excedeu o limite de passos da fase (repetição sem fim). O personagem voltou ao início.',
        tom: 'erro',
      }
    case 'sem_vitoria':
    default:
      if (parouNoMarcoX) {
        return {
          titulo: 'Quase lá! Você parou no marco intermediário (X).',
          detalhe:
            'Um único bloco "Mover-se à direita" leva o personagem até o X. Adicione um segundo bloco "Mover-se à direita" no Programador de ações e aperte Play!',
          tom: 'aviso',
        }
      }
      return {
        titulo: 'Sequência finalizada antes do Destino.',
        detalhe:
          'Os blocos terminaram de executar, mas o personagem ainda não alcançou o quadrado Destino. Ajuste os blocos no Programador de ações e tente novamente!',
        tom: 'aviso',
      }
  }
}

