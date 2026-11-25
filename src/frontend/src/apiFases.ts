import type {
  Bloco,
  Casa,
  Condicao,
  Fase,
  FaseResumo,
  Instrucao,
  Personagem,
  Progresso,
  Resultado,
  Sensor,
  Tentativa,
  TipoCaixa,
} from './tipos'
import type { ItemPaleta } from './programa'

export const JOGADOR_LOCAL_ID = '00000000-0000-0000-0000-000000000001'

export class ErroApi extends Error {
  readonly status?: number

  constructor(mensagem: string, status?: number) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
  }
}

export function obterApiUrl(apiUrlOverride?: string): string {
  if (apiUrlOverride !== undefined) return apiUrlOverride
  const viteUrl =
    typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, unknown> }).env
      ? (import.meta.env.VITE_API_URL as string | undefined)
      : undefined
  return viteUrl || 'http://localhost:3000'
}

type RegistroBruto = Record<string, unknown>

function lerNumero(obj: RegistroBruto, ...chaves: string[]): number | undefined {
  for (const chave of chaves) {
    const val = obj[chave]
    if (typeof val === 'number' && !Number.isNaN(val)) return val
  }
  return undefined
}

function lerTexto(obj: RegistroBruto, ...chaves: string[]): string | undefined {
  for (const chave of chaves) {
    const val = obj[chave]
    if (typeof val === 'string') return val
  }
  return undefined
}

function lerBooleano(obj: RegistroBruto, ...chaves: string[]): boolean | undefined {
  for (const chave of chaves) {
    const val = obj[chave]
    if (typeof val === 'boolean') return val
  }
  return undefined
}

function lerArray<T>(obj: RegistroBruto, ...chaves: string[]): T[] | undefined {
  for (const chave of chaves) {
    const val = obj[chave]
    if (Array.isArray(val)) return val as T[]
  }
  return undefined
}

function normalizarPersonagem(bruto: unknown): Personagem {
  const obj = (bruto && typeof bruto === 'object' ? bruto : {}) as RegistroBruto
  const posBruta = (obj.posicao && typeof obj.posicao === 'object' ? obj.posicao : {}) as RegistroBruto
  const olharBruto = lerTexto(obj, 'olhar')
  const olhar =
    olharBruto === 'norte' || olharBruto === 'leste' || olharBruto === 'sul' || olharBruto === 'oeste'
      ? olharBruto
      : 'leste'

  return {
    posicao: {
      x: lerNumero(posBruta, 'x') ?? 0,
      y: lerNumero(posBruta, 'y') ?? 0,
    },
    olhar,
    vida: lerNumero(obj, 'vida') ?? 1,
    ataque: lerNumero(obj, 'ataque') ?? 1,
    alforje: lerArray<string>(obj, 'alforje') ?? [],
  }
}

export function fasePodeSerJogada(
  fase: Pick<FaseResumo, 'id' | 'ordem'>,
  todasFases: ReadonlyArray<Pick<FaseResumo, 'id' | 'ordem'>>,
  fasesConcluidas: readonly string[],
): boolean {
  if (fase.ordem === 1) return true
  if (fasesConcluidas.includes(fase.id)) return true
  const anterior = todasFases.find((item) => item.ordem === fase.ordem - 1)
  return Boolean(anterior && fasesConcluidas.includes(anterior.id))
}

export function normalizarFaseResumo(bruto: unknown): FaseResumo {
  const obj = (bruto && typeof bruto === 'object' ? bruto : {}) as RegistroBruto
  const id = lerTexto(obj, 'id') ?? ''
  const ordem = lerNumero(obj, 'ordem') ?? 1
  const nome = lerTexto(obj, 'nome') ?? `Fase ${ordem}`
  const conceito = lerTexto(obj, 'conceito') ?? ''
  const descricao =
    lerTexto(obj, 'descricao', 'porQueEntraAqui', 'por_que_entra_aqui', 'enunciado') ?? conceito
  const disponivel = lerBooleano(obj, 'disponivel') ?? true
  const novosRecursos = lerArray<string>(obj, 'novosRecursos', 'novos_recursos')

  return {
    id,
    ordem,
    nome,
    conceito,
    descricao,
    disponivel,
    ...(novosRecursos ? { novosRecursos } : {}),
  }
}

function extrairBlocoDaPaleta(item: unknown): ItemPaleta | null {
  if (!item || typeof item !== 'object') return null
  const reg = item as RegistroBruto
  const tipo = reg.tipo

  if (tipo === 'mover') {
    const dir = reg.direcao
    if (dir === 'esquerda' || dir === 'direita' || dir === 'cima' || dir === 'baixo') {
      return { categoria: 'acao', bloco: { tipo: 'mover', direcao: dir } }
    }
    return null
  }

  if (tipo === 'virar') {
    const sentido = reg.sentido
    if (sentido === 'esquerda' || sentido === 'direita') {
      return { categoria: 'acao', bloco: { tipo: 'virar', sentido } }
    }
    return null
  }

  if (tipo === 'avancar' || tipo === 'atacar' || tipo === 'pegar') {
    return { categoria: 'acao', bloco: { tipo } }
  }

  if (tipo === 'se') {
    return { categoria: 'caixa', caixa: 'se' }
  }

  if (tipo === 'sensor') {
    const nome = lerTexto(reg, 'nome', 'sensor')
    if (nome && nome.trim().length > 0) {
      return { categoria: 'condicao', condicao: { tipo: 'sensor', sensor: nome as Sensor } }
    }
    return null
  }

  // enquanto, repetir, rotina, chamar, comparacao, nao, e, ou e tipos desconhecidos são ignorados
  return null
}

/**
 * Converte `blocosLiberados` (formato JSON da API/#81) nos itens exibidos na paleta,
 * mantendo apenas ações suportadas, `se` e `sensor` com `nome`.
 */
export function itensDaPaletaDeBlocosLiberados(
  blocosLiberados: unknown[],
  caixasExtras: TipoCaixa[] = [],
  condicoesExtras: Condicao[] = [],
): ItemPaleta[] {
  const itens: ItemPaleta[] = []
  const chaves = new Set<string>()

  const adicionar = (item: ItemPaleta | null) => {
    if (!item) return
    const chave = JSON.stringify(item)
    if (chaves.has(chave)) return
    chaves.add(chave)
    itens.push(item)
  }

  for (const bruto of blocosLiberados) {
    adicionar(extrairBlocoDaPaleta(bruto))
  }
  for (const caixa of caixasExtras) {
    if (caixa === 'se') adicionar({ categoria: 'caixa', caixa: 'se' })
  }
  for (const cond of condicoesExtras) {
    if (cond.tipo === 'sensor') adicionar({ categoria: 'condicao', condicao: cond })
  }

  return itens
}

export function normalizarFase(bruto: unknown): Fase {
  const obj = (bruto && typeof bruto === 'object' ? bruto : {}) as RegistroBruto
  const id = lerTexto(obj, 'id') ?? ''
  const ordem = lerNumero(obj, 'ordem') ?? 1
  const nome = lerTexto(obj, 'nome') ?? `Fase ${ordem}`
  const conceito = lerTexto(obj, 'conceito') ?? ''
  const enunciado = lerTexto(obj, 'enunciado', 'descricao') ?? ''
  const dicaTutorial = lerTexto(obj, 'dicaTutorial', 'dica_tutorial', 'dica') ?? ''
  const largura = lerNumero(obj, 'largura') ?? 1
  const altura = lerNumero(obj, 'altura') ?? 1
  const casas = lerArray<Casa>(obj, 'casas', 'casasBase', 'casas_base') ?? []
  const blocosBrutos = lerArray<unknown>(obj, 'blocosLiberados', 'blocos_liberados') ?? []

  const acoes: Bloco[] = []
  const caixasExtraidas: TipoCaixa[] = []
  const condicoesExtraidas: Condicao[] = []

  for (const item of itensDaPaletaDeBlocosLiberados(blocosBrutos)) {
    if (item.categoria === 'acao') {
      acoes.push(item.bloco)
    } else if (item.categoria === 'caixa') {
      caixasExtraidas.push(item.caixa)
    } else if (item.categoria === 'condicao') {
      condicoesExtraidas.push(item.condicao)
    }
  }

  const inicio = normalizarPersonagem(obj.inicio ?? obj.inicioPersonagem ?? obj.inicio_personagem)
  const limiteDePassos = lerNumero(obj, 'limiteDePassos', 'limite_de_passos') ?? 8
  const temNeblina = lerBooleano(obj, 'temNeblina', 'tem_neblina')
  const exibirOlhar = lerBooleano(obj, 'exibirOlhar', 'exibir_olhar')
  const caixasLiberadas =
    lerArray<TipoCaixa>(obj, 'caixasLiberadas', 'caixas_liberadas') ??
    (caixasExtraidas.length > 0 ? caixasExtraidas : undefined)
  const condicoesLiberadas =
    lerArray<Condicao>(obj, 'condicoesLiberadas', 'condicoes_liberadas') ??
    (condicoesExtraidas.length > 0 ? condicoesExtraidas : undefined)

  return {
    id,
    ordem,
    nome,
    conceito,
    enunciado,
    dicaTutorial,
    largura,
    altura,
    casas: casas.map((c) => ({ ...c })),
    blocosLiberados: acoes,
    inicio,
    limiteDePassos,
    condicaoDeVitoria: 'chegar_no_destino',
    ...(temNeblina !== undefined ? { temNeblina } : {}),
    ...(exibirOlhar !== undefined ? { exibirOlhar } : {}),
    ...(caixasLiberadas ? { caixasLiberadas } : {}),
    ...(condicoesLiberadas ? { condicoesLiberadas } : {}),
  }
}

export function normalizarTentativa(bruto: unknown, fase?: Fase): Tentativa {
  const obj = (bruto && typeof bruto === 'object' ? bruto : {}) as RegistroBruto
  const estadoRaw = obj.estadoInicial ?? obj.estado_inicial
  const estado = (estadoRaw && typeof estadoRaw === 'object' ? estadoRaw : obj) as RegistroBruto

  const id = lerTexto(obj, 'id', 'tentativaId', 'tentativa_id')
  const semente = lerNumero(obj, 'semente') ?? 1
  const faseId = lerTexto(obj, 'faseId', 'fase_id') ?? fase?.id ?? ''
  const largura = lerNumero(estado, 'largura') ?? lerNumero(obj, 'largura') ?? fase?.largura ?? 1
  const altura = lerNumero(estado, 'altura') ?? lerNumero(obj, 'altura') ?? fase?.altura ?? 1
  const casas =
    lerArray<Casa>(estado, 'casas', 'casas_base') ??
    lerArray<Casa>(obj, 'casas', 'casas_base') ??
    fase?.casas ??
    []
  const inicioRaw =
    estado.personagem ??
    estado.inicio ??
    obj.inicio ??
    obj.inicioPersonagem ??
    obj.inicio_personagem
  const inicio = inicioRaw ? normalizarPersonagem(inicioRaw) : normalizarPersonagem(fase?.inicio)
  const limiteDePassos =
    lerNumero(estado, 'limiteDePassos', 'limite_de_passos') ??
    lerNumero(obj, 'limiteDePassos', 'limite_de_passos') ??
    fase?.limiteDePassos ??
    8
  const programa = lerArray<Instrucao>(obj, 'programa', 'programa_atual') ?? []
  const temNeblina =
    lerBooleano(estado, 'temNeblina', 'tem_neblina') ??
    lerBooleano(obj, 'temNeblina', 'tem_neblina') ??
    fase?.temNeblina

  return {
    ...(id ? { id } : {}),
    semente,
    faseId,
    largura,
    altura,
    casas: casas.map((c) => ({ ...c })),
    inicio,
    limiteDePassos,
    programa,
    ...(temNeblina !== undefined ? { temNeblina } : {}),
  }
}

async function requisitarJson(
  url: string,
  opcoes: RequestInit | undefined,
  fetchImpl: typeof fetch,
  contextoErro: string,
): Promise<unknown> {
  let resposta: Response
  try {
    resposta = await fetchImpl(url, opcoes)
  } catch {
    throw new ErroApi(`${contextoErro}: não foi possível conectar ao servidor.`)
  }

  if (!resposta.ok) {
    throw new ErroApi(`${contextoErro} (HTTP ${resposta.status}).`, resposta.status)
  }

  try {
    return await resposta.json()
  } catch {
    throw new ErroApi(`${contextoErro}: resposta inválida do servidor.`, resposta.status)
  }
}

/**
 * Busca a lista de fases cadastradas na API (`GET /fases`).
 * Não usa fallback local em caso de falha.
 */
export async function listarFasesDaApi(
  fetchImpl: typeof fetch = fetch,
  apiUrlOverride?: string,
): Promise<FaseResumo[]> {
  const apiUrl = obterApiUrl(apiUrlOverride)
  const payload = await requisitarJson(
    `${apiUrl}/fases`,
    { method: 'GET' },
    fetchImpl,
    'Falha ao listar fases na API',
  )

  const listaBruta = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as RegistroBruto).fases)
      ? ((payload as RegistroBruto).fases as unknown[])
      : null

  if (!listaBruta) {
    throw new ErroApi('Falha ao listar fases na API: formato de resposta inesperado.')
  }

  return listaBruta.map(normalizarFaseResumo).sort((a, b) => a.ordem - b.ordem)
}

/**
 * Busca a ficha completa de uma fase na API (`GET /fases/:id`).
 * Não usa fallback local em caso de falha.
 */
export async function buscarFaseNaApi(
  faseId: string,
  fetchImpl: typeof fetch = fetch,
  apiUrlOverride?: string,
): Promise<Fase> {
  const apiUrl = obterApiUrl(apiUrlOverride)
  const payload = await requisitarJson(
    `${apiUrl}/fases/${encodeURIComponent(faseId)}`,
    { method: 'GET' },
    fetchImpl,
    `Falha ao carregar a fase "${faseId}"`,
  )

  return normalizarFase(payload)
}

export function normalizarProgresso(bruto: unknown): Progresso {
  const obj = (bruto && typeof bruto === 'object' ? bruto : {}) as RegistroBruto
  const fasesConcluidas =
    lerArray<string>(obj, 'fasesConcluidas', 'fases_concluidas') ?? []
  const talentoBruto = obj.talento
  const talento = typeof talentoBruto === 'string' && talentoBruto.length > 0 ? talentoBruto : null

  return {
    fasesConcluidas: [...fasesConcluidas],
    talento,
  }
}

/**
 * Busca o progresso persistido do jogador (`GET /jogadores/:id/progresso`).
 */
export async function buscarProgressoDoJogador(
  jogadorId: string = JOGADOR_LOCAL_ID,
  fetchImpl: typeof fetch = fetch,
  apiUrlOverride?: string,
): Promise<Progresso> {
  const apiUrl = obterApiUrl(apiUrlOverride)
  const payload = await requisitarJson(
    `${apiUrl}/jogadores/${encodeURIComponent(jogadorId)}/progresso`,
    { method: 'GET' },
    fetchImpl,
    `Falha ao carregar progresso do jogador "${jogadorId}"`,
  )

  return normalizarProgresso(payload)
}

/**
 * Abre uma tentativa para a fase na API (`POST /fases/:id/tentativas`).
 * Não usa fallback local em caso de falha.
 */
export async function abrirTentativaNaApi(
  fase: Fase,
  semente?: number,
  programa: Instrucao[] = [],
  fetchImpl: typeof fetch = fetch,
  apiUrlOverride?: string,
  jogadorId: string = JOGADOR_LOCAL_ID,
): Promise<Tentativa> {
  const apiUrl = obterApiUrl(apiUrlOverride)
  const corpo: Record<string, unknown> = { programa, jogadorId }
  if (semente !== undefined) {
    corpo.semente = semente
  }

  const payload = await requisitarJson(
    `${apiUrl}/fases/${encodeURIComponent(fase.id)}/tentativas`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    },
    fetchImpl,
    `Falha ao abrir tentativa da fase "${fase.id}"`,
  )

  return normalizarTentativa(payload, fase)
}

/**
 * Executa o programa na API (`POST /fases/:id/executar`).
 * Não simula ou reconstitui a execução localmente em caso de falha.
 */
export async function executarTentativaNaApi(
  tentativa: Tentativa,
  programa: Instrucao[],
  fetchImpl: typeof fetch = fetch,
  apiUrlOverride?: string,
  jogadorId: string = JOGADOR_LOCAL_ID,
): Promise<Resultado> {
  const apiUrl = obterApiUrl(apiUrlOverride)
  const payload = await requisitarJson(
    `${apiUrl}/fases/${encodeURIComponent(tentativa.faseId)}/executar`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        programa,
        semente: tentativa.semente,
        jogadorId,
        ...(tentativa.id ? { tentativaId: tentativa.id } : {}),
      }),
    },
    fetchImpl,
    `Falha ao executar programa na fase "${tentativa.faseId}"`,
  )

  return payload as Resultado
}
