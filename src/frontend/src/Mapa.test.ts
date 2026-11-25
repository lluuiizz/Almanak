import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  FASE_1,
  FASE_3,
  FASE_4,
  FASE_5,
  FASE_9,
  abrirTentativaNoServidor,
  sortearTentativaDaFase,
} from './dadosFase1'
import {
  casaVisivelNaNeblina,
  ehCasaAtualOuVizinha,
  faseMostraOlhar,
  obterRepresentacaoCasa,
  tentativaTemNeblina,
} from './Mapa'
import type { Casa, Tentativa } from './tipos'

describe('Mapa desenhado (Issue #23)', () => {
  it('cada tipo de casa tem uma representação distinta (chave visual, classe CSS, ícone e rótulo)', () => {
    const casos: Array<{ nome: string; casa: Casa; temJogador: boolean }> = [
      { nome: 'jogador', casa: { tipo: 'vazio' }, temJogador: true },
      { nome: 'marco', casa: { tipo: 'vazio', marco: true }, temJogador: false },
      { nome: 'destino', casa: { tipo: 'destino' }, temJogador: false },
      { nome: 'parede', casa: { tipo: 'parede' }, temJogador: false },
      { nome: 'portao', casa: { tipo: 'portao', aberto: false }, temJogador: false },
      { nome: 'inimigo', casa: { tipo: 'inimigo' }, temJogador: false },
      { nome: 'bau', casa: { tipo: 'bau', conteudo: 'espada' }, temJogador: false },
      { nome: 'porta', casa: { tipo: 'porta', resistencia: 3 }, temJogador: false },
      { nome: 'espinhos', casa: { tipo: 'espinhos', dano: 2 }, temJogador: false },
      { nome: 'armadilha', casa: { tipo: 'armadilha', dano: 2 }, temJogador: false },
    ]

    const representacoes = casos.map((c) =>
      obterRepresentacaoCasa(c.casa, { temJogador: c.temJogador, ehInicio: false }),
    )

    const chaves = new Set(representacoes.map((r) => r.chaveVisual))
    const classes = new Set(representacoes.map((r) => r.classeCss))
    const icones = new Set(representacoes.map((r) => r.icone))
    const rotulos = new Set(representacoes.map((r) => r.rotulo))

    assert.equal(chaves.size, casos.length, 'Todas as chaves visuais devem ser distintas')
    assert.equal(classes.size, casos.length, 'Todas as classes CSS devem ser distintas')
    assert.equal(icones.size, casos.length, 'Todos os ícones devem ser distintos')
    assert.equal(rotulos.size, casos.length, 'Todos os rótulos devem ser distintos')
  })

  it('o olhar do personagem aparece a partir da fase em que virar existe', () => {
    // Fase 1 só tem mover cardeal -> olhar não aparece
    assert.equal(faseMostraOlhar(FASE_1), false)
    assert.equal(
      faseMostraOlhar([
        { tipo: 'mover', direcao: 'direita' },
        { tipo: 'mover', direcao: 'baixo' },
      ]),
      false,
    )

    // A partir da fase em que virar existe (ex: Fase 3, 4, 5, 9), o olhar aparece
    assert.equal(faseMostraOlhar(FASE_3), true)
    assert.equal(faseMostraOlhar(FASE_4), true)
    assert.equal(faseMostraOlhar(FASE_5), true)
    assert.equal(faseMostraOlhar(FASE_9), true)
    assert.equal(
      faseMostraOlhar([
        { tipo: 'avancar' },
        { tipo: 'virar', sentido: 'direita' },
      ]),
      true,
    )
  })

  it('na fase 5 só a casa atual e as vizinhas ficam visíveis; o resto permanece encoberto enquanto o personagem não se aproxima', () => {
    assert.equal(tentativaTemNeblina('fase-1'), false)
    assert.equal(tentativaTemNeblina('fase-5'), true)

    const posJogador = { x: 0, y: 0 }

    // Casa atual (0,0) e vizinhas diretas (1,0) e (0,1) visíveis
    assert.equal(ehCasaAtualOuVizinha(posJogador, { x: 0, y: 0 }), true)
    assert.equal(ehCasaAtualOuVizinha(posJogador, { x: 1, y: 0 }), true)
    assert.equal(ehCasaAtualOuVizinha(posJogador, { x: 0, y: 1 }), true)
    assert.equal(casaVisivelNaNeblina(posJogador, { x: 0, y: 0 }, true), true)
    assert.equal(casaVisivelNaNeblina(posJogador, { x: 1, y: 0 }, true), true)

    // Casas distantes permanecem encobertas
    assert.equal(casaVisivelNaNeblina(posJogador, { x: 2, y: 0 }, true), false)
    assert.equal(casaVisivelNaNeblina(posJogador, { x: 3, y: 0 }, true), false)
    assert.equal(casaVisivelNaNeblina(posJogador, { x: 1, y: 1 }, true), false)

    // Quando o personagem avança para (2,0), (2,0) e (3,0) passam a ficar visíveis
    const novaPos = { x: 2, y: 0 }
    assert.equal(casaVisivelNaNeblina(novaPos, { x: 2, y: 0 }, true), true)
    assert.equal(casaVisivelNaNeblina(novaPos, { x: 3, y: 0 }, true), true)
    assert.equal(casaVisivelNaNeblina(novaPos, { x: 4, y: 0 }, true), false)
  })

  it('o mapa da tentativa aberta é o estado devolvido pelo servidor, inclusive depois do sorteio', async () => {
    // 1. Sorteio determinístico na Fase 4 (portão fechado na semente par, aberto na ímpar)
    const tentativaFechada = sortearTentativaDaFase(FASE_4, 2)
    const tentativaAberta = sortearTentativaDaFase(FASE_4, 3)
    assert.equal(tentativaFechada.casas[2].aberto, false)
    assert.equal(tentativaAberta.casas[2].aberto, true)

    // 2. Sorteio determinístico na Fase 5 (comprimento do corredor varia com a semente)
    const corredorSemente1 = sortearTentativaDaFase(FASE_5, 1)
    const corredorSemente2 = sortearTentativaDaFase(FASE_5, 2)
    assert.notEqual(corredorSemente1.largura, corredorSemente2.largura)

    // 3. Resposta vinda do servidor sobrepõe qualquer estado local
    const tentativaDoServidor: Tentativa = {
      semente: 99,
      faseId: 'fase-4',
      largura: 4,
      altura: 1,
      casas: [
        { tipo: 'vazio' },
        { tipo: 'portao', aberto: true },
        { tipo: 'bau', conteudo: 'chave' },
        { tipo: 'destino' },
      ],
      inicio: {
        posicao: { x: 0, y: 0 },
        olhar: 'leste',
        vida: 3,
        ataque: 2,
        alforje: [],
      },
      limiteDePassos: 10,
      programa: [],
    }

    // Simula resposta HTTP do servidor quando abrirTentativaNoServidor é chamado
    const fetchMock = (async () =>
      ({
        ok: true,
        json: async () => tentativaDoServidor,
      }) as Response) as unknown as typeof fetch

    const recebida = await abrirTentativaNoServidor(
      FASE_4,
      99,
      [],
      fetchMock,
      'http://servidor-teste.local',
    )
    assert.equal(recebida.semente, 99)
    assert.equal(recebida.largura, 4)
    assert.equal(recebida.casas[1].tipo, 'portao')
    assert.equal(recebida.casas[1].aberto, true)
    assert.equal(recebida.casas[2].tipo, 'bau')
    assert.equal(recebida.inicio.vida, 3)
  })
})
