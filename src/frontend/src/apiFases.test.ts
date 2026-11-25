import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  ErroApi,
  JOGADOR_LOCAL_ID,
  abrirTentativaNaApi,
  buscarFaseNaApi,
  buscarProgressoDoJogador,
  executarTentativaNaApi,
  fasePodeSerJogada,
  itensDaPaletaDeBlocosLiberados,
  listarFasesDaApi,
  normalizarFase,
  normalizarTentativa,
} from './apiFases'
import { rotuloBloco } from './dadosFase1'
import { rotuloCaixa, rotuloCondicao } from './programa'

const dirAtual = dirname(fileURLToPath(import.meta.url))

function mockFetchRotas(rotas: Record<string, { status?: number; body: unknown }>): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const metodo = init?.method ?? 'GET'
    const chave = `${metodo} ${url}`
    const rota = rotas[chave]
    if (!rota) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ erro: 'Não encontrado' }),
      } as Response
    }
    const status = rota.status ?? 200
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => rota.body,
    } as Response
  }) as unknown as typeof fetch
}

describe('Integração da tela com a API de fases (sem constantes locais)', () => {
  it('App.tsx e apiFases.ts não leem FASE_1 nem CATALOGO_FASES', () => {
    const appCodigo = readFileSync(join(dirAtual, 'App.tsx'), 'utf-8')
    const apiCodigo = readFileSync(join(dirAtual, 'apiFases.ts'), 'utf-8')

    assert.equal(appCodigo.includes('FASE_1'), false, 'App.tsx não pode ler FASE_1')
    assert.equal(appCodigo.includes('CATALOGO_FASES'), false, 'App.tsx não pode ler CATALOGO_FASES')
    assert.equal(
      appCodigo.includes("'Tutorial'") || appCodigo.includes('"Tutorial"') || appCodigo.includes('— TUTORIAL'),
      false,
      'App.tsx não pode fixar "Tutorial"',
    )
    assert.equal(appCodigo.includes('porQueEntraAqui'), false, 'App.tsx deve usar descricao da API')
    assert.equal(apiCodigo.includes('FASE_1'), false, 'apiFases.ts não pode ler FASE_1')
    assert.equal(
      apiCodigo.includes('CATALOGO_FASES'),
      false,
      'apiFases.ts não pode ler CATALOGO_FASES',
    )
  })

  it('lista, abre, obtém mapa/paleta e executa o Play da fase 1 do banco via API', async () => {
    const baseUrl = 'http://api.almanak.local'
    const fetchMock = mockFetchRotas({
      [`GET ${baseUrl}/fases`]: {
        body: [
          {
            id: 'fase-1',
            ordem: 1,
            nome: 'Tutorial',
            conceito: 'Sequência',
            descricao: 'Um e dois passos até o destino.',
          },
        ],
      },
      [`GET ${baseUrl}/fases/fase-1`]: {
        body: {
          id: 'fase-1',
          ordem: 1,
          nome: 'Tutorial',
          conceito: 'Sequência',
          descricao: 'Chegue ao destino.',
          largura: 3,
          altura: 1,
          limite_de_passos: 8,
          tem_neblina: false,
          inicio_personagem: {
            posicao: { x: 0, y: 0 },
            olhar: 'leste',
            vida: 1,
            ataque: 1,
            alforje: [],
          },
          casas_base: [{ tipo: 'vazio' }, { tipo: 'vazio', marco: true }, { tipo: 'destino' }],
          blocos_liberados: [{ tipo: 'mover', direcao: 'direita' }],
        },
      },
      [`POST ${baseUrl}/fases/fase-1/tentativas`]: {
        status: 201,
        body: {
          semente: 7,
          faseId: 'fase-1',
          largura: 3,
          altura: 1,
          casas: [{ tipo: 'vazio' }, { tipo: 'vazio', marco: true }, { tipo: 'destino' }],
          inicio: {
            posicao: { x: 0, y: 0 },
            olhar: 'leste',
            vida: 1,
            ataque: 1,
            alforje: [],
          },
          limiteDePassos: 8,
          programa: [],
        },
      },
      [`POST ${baseUrl}/fases/fase-1/executar`]: {
        body: {
          eventos: [],
          veredito: 'vitoria',
          personagem: {
            posicao: { x: 2, y: 0 },
            olhar: 'leste',
            vida: 1,
            ataque: 1,
            alforje: [],
          },
          programa: [
            { tipo: 'mover', direcao: 'direita' },
            { tipo: 'mover', direcao: 'direita' },
          ],
        },
      },
    })

    const lista = await listarFasesDaApi(fetchMock, baseUrl)
    assert.equal(lista.length, 1)
    assert.equal(lista[0].id, 'fase-1')
    assert.equal(lista[0].descricao, 'Um e dois passos até o destino.')

    const fase = await buscarFaseNaApi('fase-1', fetchMock, baseUrl)
    assert.equal(fase.nome, 'Tutorial')
    assert.equal(fase.limiteDePassos, 8)
    assert.equal(fase.blocosLiberados.length, 1)

    const tentativa = await abrirTentativaNaApi(fase, undefined, [], fetchMock, baseUrl)
    assert.equal(tentativa.semente, 7)
    assert.equal(tentativa.casas[2].tipo, 'destino')

    const resultado = await executarTentativaNaApi(
      tentativa,
      [
        { tipo: 'mover', direcao: 'direita' },
        { tipo: 'mover', direcao: 'direita' },
      ],
      fetchMock,
      baseUrl,
    )
    assert.equal(resultado.veredito, 'vitoria')
  })

  it('exibe segunda fase de sequência vinda apenas da tabela sem alteração no frontend', async () => {
    const baseUrl = 'http://api.almanak.local'
    const fetchMock = mockFetchRotas({
      [`GET ${baseUrl}/fases`]: {
        body: [
          {
            id: 'fase-1',
            ordem: 1,
            nome: 'Tutorial',
            conceito: 'Sequência',
            descricao: 'Tutorial',
          },
          {
            id: 'fase-2',
            ordem: 2,
            nome: 'A curva',
            conceito: 'Ordem',
            descricao: 'Mapa em L criado apenas no banco.',
          },
        ],
      },
      [`GET ${baseUrl}/fases/fase-2`]: {
        body: {
          id: 'fase-2',
          ordem: 2,
          nome: 'A curva',
          conceito: 'Ordem',
          descricao: 'Siga à direita e desça até o destino.',
          largura: 4,
          altura: 3,
          limite_de_passos: 10,
          tem_neblina: false,
          inicio_personagem: {
            posicao: { x: 0, y: 0 },
            olhar: 'leste',
            vida: 1,
            ataque: 1,
            alforje: [],
          },
          casas_base: [
            { tipo: 'vazio' },
            { tipo: 'vazio' },
            { tipo: 'vazio' },
            { tipo: 'vazio' },
            { tipo: 'parede' },
            { tipo: 'parede' },
            { tipo: 'parede' },
            { tipo: 'vazio' },
            { tipo: 'parede' },
            { tipo: 'parede' },
            { tipo: 'parede' },
            { tipo: 'destino' },
          ],
          blocos_liberados: [
            { tipo: 'mover', direcao: 'direita' },
            { tipo: 'mover', direcao: 'baixo' },
          ],
        },
      },
      [`POST ${baseUrl}/fases/fase-2/tentativas`]: {
        status: 201,
        body: {
          semente: 1,
          fase_id: 'fase-2',
          largura: 4,
          altura: 3,
          limite_de_passos: 10,
          inicio_personagem: {
            posicao: { x: 0, y: 0 },
            olhar: 'leste',
            vida: 1,
            ataque: 1,
            alforje: [],
          },
          casas: [
            { tipo: 'vazio' },
            { tipo: 'vazio' },
            { tipo: 'vazio' },
            { tipo: 'vazio' },
            { tipo: 'parede' },
            { tipo: 'parede' },
            { tipo: 'parede' },
            { tipo: 'vazio' },
            { tipo: 'parede' },
            { tipo: 'parede' },
            { tipo: 'parede' },
            { tipo: 'destino' },
          ],
        },
      },
    })

    const lista = await listarFasesDaApi(fetchMock, baseUrl)
    assert.deepEqual(
      lista.map((f) => f.id),
      ['fase-1', 'fase-2'],
    )
    assert.equal(lista[1].disponivel, true)

    const fase2 = await buscarFaseNaApi('fase-2', fetchMock, baseUrl)
    assert.equal(fase2.largura, 4)
    assert.equal(fase2.altura, 3)
    assert.deepEqual(
      fase2.blocosLiberados.map((b) => (b.tipo === 'mover' ? b.direcao : b.tipo)),
      ['direita', 'baixo'],
    )

    const tentativa2 = await abrirTentativaNaApi(fase2, undefined, [], fetchMock, baseUrl)
    assert.equal(tentativa2.faseId, 'fase-2')
    assert.equal(tentativa2.casas.length, 12)
    assert.equal(tentativa2.casas[11].tipo, 'destino')
  })

  it('se a API não responde, falha explicitamente e não reconstitui a fase com dado local', async () => {
    const baseUrl = 'http://api.almanak.local'
    const fetchForaDoAr = (async () => {
      throw new TypeError('fetch failed')
    }) as unknown as typeof fetch

    await assert.rejects(
      () => listarFasesDaApi(fetchForaDoAr, baseUrl),
      (err: unknown) => err instanceof ErroApi,
    )

    await assert.rejects(
      () => buscarFaseNaApi('fase-1', fetchForaDoAr, baseUrl),
      (err: unknown) => err instanceof ErroApi,
    )

    const fetch500 = mockFetchRotas({
      [`GET ${baseUrl}/fases`]: { status: 500, body: { erro: 'Banco indisponível' } },
    })

    await assert.rejects(
      () => listarFasesDaApi(fetch500, baseUrl),
      (err: unknown) => err instanceof ErroApi && err.status === 500,
    )
  })

  it('recarrega fasesConcluidas do jogador local na API após vitória e mantém talento nulo na fase 1', async () => {
    const baseUrl = 'http://api.almanak.local'
    assert.equal(JOGADOR_LOCAL_ID, '00000000-0000-0000-0000-000000000001')

    let fasesPersistidas: string[] = []
    const fetchMock = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const metodo = init?.method ?? 'GET'
      if (metodo === 'GET' && url === `${baseUrl}/jogadores/${JOGADOR_LOCAL_ID}/progresso`) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ fasesConcluidas: fasesPersistidas, talento: null }),
        } as Response
      }
      if (metodo === 'POST' && url === `${baseUrl}/fases/fase-1/executar`) {
        const body = JSON.parse(String(init?.body ?? '{}')) as { programa?: unknown[] }
        const venceu = Array.isArray(body.programa) && body.programa.length === 2
        if (venceu && !fasesPersistidas.includes('fase-1')) {
          fasesPersistidas = [...fasesPersistidas, 'fase-1']
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            eventos: [],
            veredito: venceu ? 'vitoria' : 'sem_vitoria',
            personagem: {
              posicao: { x: venceu ? 2 : 1, y: 0 },
              olhar: 'leste',
              vida: 1,
              ataque: 1,
              alforje: [],
            },
            programa: body.programa ?? [],
          }),
        } as Response
      }
      return { ok: false, status: 404, json: async () => ({}) } as Response
    }) as unknown as typeof fetch

    const tentativaSimulada = {
      semente: 1,
      faseId: 'fase-1',
      largura: 3,
      altura: 1,
      casas: [{ tipo: 'vazio' as const }, { tipo: 'vazio' as const }, { tipo: 'destino' as const }],
      inicio: { posicao: { x: 0, y: 0 }, olhar: 'leste' as const, vida: 1, ataque: 1, alforje: [] },
      limiteDePassos: 8,
      programa: [],
    }

    // Veredito diferente de 'vitoria' não conclui a fase
    const semVitoria = await executarTentativaNaApi(
      tentativaSimulada,
      [{ tipo: 'mover', direcao: 'direita' }],
      fetchMock,
      baseUrl,
    )
    assert.equal(semVitoria.veredito, 'sem_vitoria')
    const progressoAntes = await buscarProgressoDoJogador(JOGADOR_LOCAL_ID, fetchMock, baseUrl)
    assert.deepEqual(progressoAntes.fasesConcluidas, [])

    // Após vitória, recarregar o progresso mantém 'fase-1' concluída e talento continua null
    const vitoria = await executarTentativaNaApi(
      tentativaSimulada,
      [
        { tipo: 'mover', direcao: 'direita' },
        { tipo: 'mover', direcao: 'direita' },
      ],
      fetchMock,
      baseUrl,
    )
    assert.equal(vitoria.veredito, 'vitoria')
    const progressoDepois = await buscarProgressoDoJogador(JOGADOR_LOCAL_ID, fetchMock, baseUrl)
    assert.deepEqual(progressoDepois.fasesConcluidas, ['fase-1'])
    assert.equal(progressoDepois.talento, null)

    // App.tsx não trata faseConcluida como talento ativo
    const appCodigo = readFileSync(join(dirAtual, 'App.tsx'), 'utf-8')
    assert.equal(appCodigo.includes("faseConcluida ? 'Ativo'"), false)
  })

  it('monta paleta a partir de blocosLiberados (#81) e ignora tipos futuros ou desconhecidos', () => {
    const faseComBlocosMisto = normalizarFase({
      id: 'fase-3',
      ordem: 3,
      nome: 'O muro',
      conceito: 'se e sensor',
      largura: 3,
      altura: 1,
      casas_base: [{ tipo: 'vazio' }, { tipo: 'parede' }, { tipo: 'destino' }],
      inicio_personagem: { posicao: { x: 0, y: 0 }, olhar: 'leste', vida: 1, ataque: 1, alforje: [] },
      blocos_liberados: [
        { tipo: 'mover', direcao: 'direita' },
        { tipo: 'virar', sentido: 'esquerda' },
        { tipo: 'avancar' },
        { tipo: 'atacar' },
        { tipo: 'pegar' },
        { tipo: 'se' },
        { tipo: 'sensor', nome: 'parede_frente' },
        // Tipos futuros ou desconhecidos que não devem aparecer nem quebrar a tela
        { tipo: 'enquanto' },
        { tipo: 'repetir' },
        { tipo: 'rotina' },
        { tipo: 'chamar', nome: 'aux' },
        { tipo: 'comparacao', esquerda: 'vida', operador: '>=', direita: 1 },
        { tipo: 'nao' },
        { tipo: 'e' },
        { tipo: 'ou' },
        { tipo: 'desconhecido_qualquer' },
      ],
    })

    const itens = itensDaPaletaDeBlocosLiberados(
      faseComBlocosMisto.blocosLiberados,
      faseComBlocosMisto.caixasLiberadas,
      faseComBlocosMisto.condicoesLiberadas,
    )

    assert.equal(itens.length, 7)

    const rotulos = itens.map((item) => {
      if (item.categoria === 'acao') return rotuloBloco(item.bloco)
      if (item.categoria === 'caixa') return rotuloCaixa(item.caixa)
      return rotuloCondicao(item.condicao)
    })

    assert.deepEqual(rotulos, [
      'Mover-se à direita',
      'Virar à esquerda',
      'Avançar',
      'Atacar',
      'Pegar',
      'se … então … senão',
      'existe parede à frente?',
    ])

    // Fase 1 só com os quatro movimentos, sem bloco de decisão
    const itensFase1 = itensDaPaletaDeBlocosLiberados([
      { tipo: 'mover', direcao: 'esquerda' },
      { tipo: 'mover', direcao: 'direita' },
      { tipo: 'mover', direcao: 'cima' },
      { tipo: 'mover', direcao: 'baixo' },
    ])
    assert.equal(itensFase1.length, 4)
    assert.ok(itensFase1.every((i) => i.categoria === 'acao' && i.bloco.tipo === 'mover'))
  })

  it('lê enunciado, dica, conceito e limiteDePassos da ficha e omite dica quando nula', () => {
    const comDica = normalizarFase({
      id: 'fase-1',
      ordem: 1,
      nome: 'Tutorial',
      conceito: 'Sequência',
      enunciado: 'Enunciado vindo do banco.',
      dica: 'Dica vinda do banco.',
      limiteDePassos: 14,
      largura: 3,
      altura: 1,
      casas: [{ tipo: 'vazio' }, { tipo: 'vazio' }, { tipo: 'destino' }],
      blocosLiberados: [],
    })

    assert.equal(comDica.enunciado, 'Enunciado vindo do banco.')
    assert.equal(comDica.dicaTutorial, 'Dica vinda do banco.')
    assert.equal(comDica.conceito, 'Sequência')
    assert.equal(comDica.limiteDePassos, 14)

    const semDica = normalizarFase({
      id: 'fase-2',
      ordem: 2,
      nome: 'A curva',
      conceito: 'Ordem',
      enunciado: 'Enunciado sem dica.',
      dica: null,
      limiteDePassos: 12,
      largura: 2,
      altura: 1,
      casas: [{ tipo: 'vazio' }, { tipo: 'destino' }],
      blocosLiberados: [],
    })

    assert.equal(semDica.dicaTutorial, '')
    assert.equal(semDica.limiteDePassos, 12)

    const appCodigo = readFileSync(join(dirAtual, 'App.tsx'), 'utf-8')
    assert.equal(appCodigo.includes("'fase-1'"), false)
    assert.equal(appCodigo.includes('"fase-1"'), false)
  })

  it('normaliza tentativa com estadoInicial (largura, altura, casas, personagem) e Mapa define linhas e colunas', () => {
    const tentativa = normalizarTentativa({
      id: 'tentativa-123',
      semente: 42,
      faseId: 'fase-2',
      estadoInicial: {
        largura: 4,
        altura: 3,
        casas: [
          { tipo: 'vazio' },
          { tipo: 'vazio' },
          { tipo: 'vazio' },
          { tipo: 'vazio' },
          { tipo: 'parede' },
          { tipo: 'parede' },
          { tipo: 'parede' },
          { tipo: 'vazio' },
          { tipo: 'parede' },
          { tipo: 'parede' },
          { tipo: 'parede' },
          { tipo: 'destino' },
        ],
        personagem: {
          posicao: { x: 0, y: 0 },
          olhar: 'leste',
          vida: 1,
          ataque: 1,
          alforje: [],
        },
      },
    })

    assert.equal(tentativa.id, 'tentativa-123')
    assert.equal(tentativa.semente, 42)
    assert.equal(tentativa.largura, 4)
    assert.equal(tentativa.altura, 3)
    assert.equal(tentativa.casas.length, 12)
    assert.equal(tentativa.casas[2 * 4 + 3].tipo, 'destino')
    assert.deepEqual(tentativa.inicio.posicao, { x: 0, y: 0 })
    assert.equal(tentativa.inicio.olhar, 'leste')

    const mapaCodigo = readFileSync(join(dirAtual, 'Mapa.tsx'), 'utf-8')
    assert.equal(mapaCodigo.includes('gridTemplateRows'), true)
    assert.equal(mapaCodigo.includes('tentativa.altura'), true)
    assert.equal(mapaCodigo.includes('gridTemplateColumns'), true)
    assert.equal(mapaCodigo.includes('tentativa.largura'), true)
  })

  it('liberação das fases usa ordem e fasesConcluidas, sem disponivel fixo por id', () => {
    const soFase1 = [{ id: 'fase-1', ordem: 1 }]
    assert.equal(fasePodeSerJogada(soFase1[0], soFase1, []), true)

    const tresFases = [
      { id: 'fase-1', ordem: 1 },
      { id: 'fase-2', ordem: 2 },
      { id: 'fase-3', ordem: 3 },
    ]

    // Nenhuma concluída: só ordem 1 abre; 2 e 3 ficam travadas
    assert.equal(fasePodeSerJogada(tresFases[0], tresFases, []), true)
    assert.equal(fasePodeSerJogada(tresFases[1], tresFases, []), false)
    assert.equal(fasePodeSerJogada(tresFases[2], tresFases, []), false)

    // Concluir fase 1 libera fase 2 e permite reabrir fase 1; fase 3 continua travada
    assert.equal(fasePodeSerJogada(tresFases[0], tresFases, ['fase-1']), true)
    assert.equal(fasePodeSerJogada(tresFases[1], tresFases, ['fase-1']), true)
    assert.equal(fasePodeSerJogada(tresFases[2], tresFases, ['fase-1']), false)

    // Ordem N em fasesConcluidas pode ser reaberta mesmo sem N-1 na lista
    assert.equal(fasePodeSerJogada(tresFases[2], tresFases, ['fase-3']), true)

    const appCodigo = readFileSync(join(dirAtual, 'App.tsx'), 'utf-8')
    assert.equal(appCodigo.includes('.disponivel'), false)
  })
})
