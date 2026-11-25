import type { Bloco, Condicao, Instrucao, TipoCaixa } from './tipos'

/* ==========================================================================
 * Árvore editável do Programador de ações.
 *
 * Cada nó tem um `id` estável para a interface. Cada lista de blocos (a raiz,
 * o corpo de um ramo, o `senão`, o corpo de um laço) tem um `listaId`, e cada
 * pergunta (cabeçalho) tem um `perguntaId`. As operações abaixo são puras:
 * recebem a árvore e devolvem uma árvore nova.
 * ========================================================================== */

export const LISTA_RAIZ = 'raiz'

export interface NoAcao {
  id: string
  tipo: 'acao'
  bloco: Bloco
}

export interface RamoEditavel {
  /** Também é o `perguntaId` da pergunta e o `listaId` do corpo do ramo. */
  id: string
  condicao: Condicao | null
  corpo: NoPrograma[]
}

export interface NoSe {
  id: string
  tipo: 'se'
  ramos: RamoEditavel[]
  senao: NoPrograma[] | null
}

export interface NoEnquanto {
  id: string
  tipo: 'enquanto'
  condicao: Condicao | null
  corpo: NoPrograma[]
}

export interface NoRepetir {
  id: string
  tipo: 'repetir'
  vezes: number
  corpo: NoPrograma[]
}

export type NoPrograma = NoAcao | NoSe | NoEnquanto | NoRepetir

/** O que pode ser arrastado da paleta. */
export type ItemPaleta =
  | { categoria: 'acao'; bloco: Bloco }
  | { categoria: 'caixa'; caixa: TipoCaixa }
  | { categoria: 'condicao'; condicao: Condicao }

/** Onde algo pode ser encaixado. */
export type Encaixe = 'corpo' | 'pergunta'

export const VEZES_MIN = 1
export const VEZES_MAX = 20

/* ------------------------------ ids --------------------------------------- */

let contador = 0
export function novoId(prefixo = 'no'): string {
  contador += 1
  return `${prefixo}-${contador}-${Math.random().toString(36).slice(2, 7)}`
}

export function listaSenaoId(seId: string): string {
  return `${seId}:senao`
}

export function listaCorpoId(noId: string): string {
  return `${noId}:corpo`
}

/* --------------------------- regras de encaixe ---------------------------- */

/**
 * Sensores e comparações encaixam só na pergunta.
 * Ações e caixas encaixam só no corpo.
 */
export function podeEncaixar(item: ItemPaleta['categoria'], encaixe: Encaixe): boolean {
  if (item === 'condicao') return encaixe === 'pergunta'
  return encaixe === 'corpo'
}

/* ------------------------------ criação ----------------------------------- */

export function criarNo(item: ItemPaleta): NoPrograma {
  if (item.categoria === 'acao') {
    return { id: novoId('acao'), tipo: 'acao', bloco: { ...item.bloco } }
  }
  if (item.categoria === 'caixa') {
    if (item.caixa === 'se') {
      return {
        id: novoId('se'),
        tipo: 'se',
        ramos: [{ id: novoId('ramo'), condicao: null, corpo: [] }],
        senao: null,
      }
    }
    if (item.caixa === 'enquanto') {
      return { id: novoId('enquanto'), tipo: 'enquanto', condicao: null, corpo: [] }
    }
    return { id: novoId('repetir'), tipo: 'repetir', vezes: 2, corpo: [] }
  }
  throw new Error('Sensores e comparações só encaixam na pergunta de uma caixa.')
}

/* ---------------------- percurso genérico das listas ---------------------- */

/** Aplica `f` a cada lista da árvore (inclusive a raiz), de dentro para fora. */
function mapearListas(
  nos: NoPrograma[],
  listaId: string,
  f: (lista: NoPrograma[], listaId: string) => NoPrograma[],
): NoPrograma[] {
  const filhos = nos.map((no) => mapearFilhos(no, f))
  return f(filhos, listaId)
}

function mapearFilhos(
  no: NoPrograma,
  f: (lista: NoPrograma[], listaId: string) => NoPrograma[],
): NoPrograma {
  switch (no.tipo) {
    case 'acao':
      return no
    case 'se':
      return {
        ...no,
        ramos: no.ramos.map((ramo) => ({ ...ramo, corpo: mapearListas(ramo.corpo, ramo.id, f) })),
        senao: no.senao === null ? null : mapearListas(no.senao, listaSenaoId(no.id), f),
      }
    case 'enquanto':
    case 'repetir':
      return { ...no, corpo: mapearListas(no.corpo, listaCorpoId(no.id), f) }
  }
}

function mapearNos(nos: NoPrograma[], f: (no: NoPrograma) => NoPrograma): NoPrograma[] {
  return mapearListas(nos, LISTA_RAIZ, (lista) => lista.map(f))
}

export function encontrarNo(nos: NoPrograma[], id: string): NoPrograma | null {
  for (const no of nos) {
    if (no.id === id) return no
    for (const lista of listasFilhas(no)) {
      const achado = encontrarNo(lista, id)
      if (achado) return achado
    }
  }
  return null
}

function listasFilhas(no: NoPrograma): NoPrograma[][] {
  switch (no.tipo) {
    case 'acao':
      return []
    case 'se':
      return [...no.ramos.map((r) => r.corpo), ...(no.senao ? [no.senao] : [])]
    case 'enquanto':
    case 'repetir':
      return [no.corpo]
  }
}

/** Todos os `listaId` que existem dentro de um nó (inclusive aninhados). */
function listasDentroDe(no: NoPrograma): Set<string> {
  const ids = new Set<string>()
  mapearFilhos(no, (lista, listaId) => {
    ids.add(listaId)
    return lista
  })
  return ids
}

/* ------------------------------ operações --------------------------------- */

export function inserirNo(
  nos: NoPrograma[],
  listaId: string,
  indice: number,
  novo: NoPrograma,
): NoPrograma[] {
  return mapearListas(nos, LISTA_RAIZ, (lista, id) => {
    if (id !== listaId) return lista
    const pos = Math.max(0, Math.min(indice, lista.length))
    return [...lista.slice(0, pos), novo, ...lista.slice(pos)]
  })
}

export function removerNo(nos: NoPrograma[], id: string): NoPrograma[] {
  return mapearListas(nos, LISTA_RAIZ, (lista) => lista.filter((no) => no.id !== id))
}

/**
 * Move um nó existente para outra posição. Recusa mover uma caixa para dentro
 * dela mesma (o que destruiria a árvore).
 */
export function moverNo(
  nos: NoPrograma[],
  id: string,
  listaDestino: string,
  indiceDestino: number,
): NoPrograma[] {
  const no = encontrarNo(nos, id)
  if (!no) return nos
  if (listasDentroDe(no).has(listaDestino)) return nos

  const origem = localizar(nos, id)
  let indice = indiceDestino
  // Ao mover para baixo na mesma lista, a remoção desloca o índice de destino.
  if (origem && origem.listaId === listaDestino && origem.indice < indiceDestino) {
    indice -= 1
  }
  return inserirNo(removerNo(nos, id), listaDestino, indice, no)
}

/** Lista e posição em que um nó está. */
export function localizar(
  nos: NoPrograma[],
  id: string,
): { listaId: string; indice: number; tamanho: number } | null {
  let achado: { listaId: string; indice: number; tamanho: number } | null = null
  mapearListas(nos, LISTA_RAIZ, (lista, listaId) => {
    const indice = lista.findIndex((no) => no.id === id)
    if (indice >= 0) achado = { listaId, indice, tamanho: lista.length }
    return lista
  })
  return achado
}

/** Sobe (-1) ou desce (+1) um nó dentro da sua própria lista. */
export function deslocarNo(nos: NoPrograma[], id: string, delta: -1 | 1): NoPrograma[] {
  const pos = localizar(nos, id)
  if (!pos) return nos
  const alvo = pos.indice + delta
  if (alvo < 0 || alvo >= pos.tamanho) return nos
  return mapearListas(nos, LISTA_RAIZ, (lista, listaId) => {
    if (listaId !== pos.listaId) return lista
    const copia = [...lista]
    const [item] = copia.splice(pos.indice, 1)
    copia.splice(alvo, 0, item)
    return copia
  })
}

/**
 * Encaixa (ou retira, com `null`) um sensor/comparação numa pergunta.
 * `perguntaId` é o id de um ramo de `se` ou o id de um `enquanto`.
 */
export function definirCondicao(
  nos: NoPrograma[],
  perguntaId: string,
  condicao: Condicao | null,
): NoPrograma[] {
  return mapearNos(nos, (no) => {
    if (no.tipo === 'enquanto' && no.id === perguntaId) return { ...no, condicao }
    if (no.tipo === 'se' && no.ramos.some((r) => r.id === perguntaId)) {
      return {
        ...no,
        ramos: no.ramos.map((r) => (r.id === perguntaId ? { ...r, condicao } : r)),
      }
    }
    return no
  })
}

export function adicionarSenaoSe(nos: NoPrograma[], seId: string): NoPrograma[] {
  return mapearNos(nos, (no) =>
    no.tipo === 'se' && no.id === seId
      ? { ...no, ramos: [...no.ramos, { id: novoId('ramo'), condicao: null, corpo: [] }] }
      : no,
  )
}

/** Remove um `senão se` (o ramo `então`, o primeiro, não pode ser removido). */
export function removerRamo(nos: NoPrograma[], seId: string, ramoId: string): NoPrograma[] {
  return mapearNos(nos, (no) => {
    if (no.tipo !== 'se' || no.id !== seId) return no
    if (no.ramos[0]?.id === ramoId) return no
    return { ...no, ramos: no.ramos.filter((r) => r.id !== ramoId) }
  })
}

export function alternarSenao(nos: NoPrograma[], seId: string): NoPrograma[] {
  return mapearNos(nos, (no) =>
    no.tipo === 'se' && no.id === seId ? { ...no, senao: no.senao === null ? [] : null } : no,
  )
}

export function definirVezes(nos: NoPrograma[], id: string, vezes: number): NoPrograma[] {
  const valor = Math.max(VEZES_MIN, Math.min(VEZES_MAX, Math.round(vezes) || VEZES_MIN))
  return mapearNos(nos, (no) => (no.tipo === 'repetir' && no.id === id ? { ...no, vezes: valor } : no))
}

/* ---------------------------- leitura / envio ----------------------------- */

/**
 * Converte a árvore editável na árvore enviada no Play, preservando o
 * aninhamento. Cada ação leva `ref` com o id do nó para o cliente destacar o
 * bloco em execução; o servidor pode ignorá-lo.
 */
export function paraArvore(nos: NoPrograma[]): Instrucao[] {
  return nos.map((no): Instrucao => {
    switch (no.tipo) {
      case 'acao':
        return { ...no.bloco, ref: no.id }
      case 'se':
        return {
          tipo: 'se',
          ramos: no.ramos.map((r) => ({ condicao: r.condicao, corpo: paraArvore(r.corpo) })),
          senao: no.senao === null ? null : paraArvore(no.senao),
        }
      case 'enquanto':
        return { tipo: 'enquanto', condicao: no.condicao, corpo: paraArvore(no.corpo) }
      case 'repetir':
        return { tipo: 'repetir', vezes: no.vezes, corpo: paraArvore(no.corpo) }
    }
  })
}

export function contarBlocos(nos: NoPrograma[]): number {
  return nos.reduce((total, no) => total + 1 + listasFilhas(no).reduce((s, l) => s + contarBlocos(l), 0), 0)
}

/** Perguntas ainda vazias. O Play fica bloqueado enquanto houver alguma. */
export function perguntasVazias(nos: NoPrograma[]): number {
  let vazias = 0
  mapearNos(nos, (no) => {
    if (no.tipo === 'enquanto' && no.condicao === null) vazias += 1
    if (no.tipo === 'se') vazias += no.ramos.filter((r) => r.condicao === null).length
    return no
  })
  return vazias
}

/* ------------------------------- rótulos ---------------------------------- */

const ROTULO_SENSOR: Record<string, string> = {
  parede_frente: 'existe parede à frente?',
  inimigo_frente: 'existe inimigo à frente?',
  item_aqui: 'existe item aqui?',
  cheguei_destino: 'cheguei ao destino?',
}

export function rotuloCondicao(condicao: Condicao): string {
  switch (condicao.tipo) {
    case 'sensor':
      return ROTULO_SENSOR[condicao.sensor] ?? condicao.sensor
    case 'nao':
      return `não ${rotuloCondicao(condicao.condicao)}`
    case 'comparacao':
      return `${condicao.esquerda} ${condicao.operador} ${condicao.direita}`
  }
}

export function rotuloCaixa(caixa: TipoCaixa): string {
  if (caixa === 'se') return 'se … então … senão'
  if (caixa === 'enquanto') return 'enquanto …'
  return 'repetir N vezes'
}

export function chaveCondicao(condicao: Condicao): string {
  return JSON.stringify(condicao)
}
