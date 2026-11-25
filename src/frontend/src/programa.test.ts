import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { FASE_5, interpretarArvore, sortearTentativaDaFase } from './dadosFase1'
import {
  LISTA_RAIZ,
  adicionarSenaoSe,
  alternarSenao,
  contarBlocos,
  criarNo,
  definirCondicao,
  definirVezes,
  inserirNo,
  listaCorpoId,
  listaSenaoId,
  moverNo,
  paraArvore,
  perguntasVazias,
  podeEncaixar,
  removerRamo,
  type NoEnquanto,
  type NoPrograma,
  type NoSe,
} from './programa'
import type { Condicao, Instrucao, Tentativa } from './tipos'

const avancar = criarNo({ categoria: 'acao', bloco: { tipo: 'avancar' } })
const paredeFrente: Condicao = { tipo: 'sensor', sensor: 'parede_frente' }
const naoParede: Condicao = { tipo: 'nao', condicao: paredeFrente }

function novaAcao(bloco: Parameters<typeof criarNo>[0] & { categoria: 'acao' }) {
  return criarNo(bloco)
}

function novoSe(): NoSe {
  return criarNo({ categoria: 'caixa', caixa: 'se' }) as NoSe
}

function novoEnquanto(): NoEnquanto {
  return criarNo({ categoria: 'caixa', caixa: 'enquanto' }) as NoEnquanto
}

/** Remove `ref` (só usado pelo cliente para destacar o bloco) para comparar estruturas. */
function semRef(arvore: Instrucao[]): unknown {
  return JSON.parse(JSON.stringify(arvore, (chave, valor) => (chave === 'ref' ? undefined : valor)))
}

describe('Programador em árvore (blocos-caixa)', () => {
  it('um bloco-caixa tem a pergunta no cabeçalho e o corpo como lista própria', () => {
    const enquanto = novoEnquanto()
    let arvore: NoPrograma[] = inserirNo([], LISTA_RAIZ, 0, enquanto)
    arvore = definirCondicao(arvore, enquanto.id, naoParede)
    arvore = inserirNo(arvore, listaCorpoId(enquanto.id), 0, avancar)

    assert.deepEqual(semRef(paraArvore(arvore)), [
      { tipo: 'enquanto', condicao: naoParede, corpo: [{ tipo: 'avancar' }] },
    ])
  })

  it('se tem ramos então, senão se e senão', () => {
    const se = novoSe()
    let arvore: NoPrograma[] = inserirNo([], LISTA_RAIZ, 0, se)
    arvore = adicionarSenaoSe(arvore, se.id)
    arvore = alternarSenao(arvore, se.id)

    const atual = arvore[0] as NoSe
    assert.equal(atual.ramos.length, 2, 'então + senão se')
    assert.deepEqual(atual.senao, [], 'senão presente')

    const [entao, senaoSe] = atual.ramos
    arvore = definirCondicao(arvore, entao.id, { tipo: 'sensor', sensor: 'inimigo_frente' })
    arvore = definirCondicao(arvore, senaoSe.id, paredeFrente)
    arvore = inserirNo(arvore, entao.id, 0, novaAcao({ categoria: 'acao', bloco: { tipo: 'atacar' } }))
    arvore = inserirNo(
      arvore,
      senaoSe.id,
      0,
      novaAcao({ categoria: 'acao', bloco: { tipo: 'virar', sentido: 'esquerda' } }),
    )
    arvore = inserirNo(arvore, listaSenaoId(se.id), 0, avancar)

    assert.deepEqual(semRef(paraArvore(arvore)), [
      {
        tipo: 'se',
        ramos: [
          { condicao: { tipo: 'sensor', sensor: 'inimigo_frente' }, corpo: [{ tipo: 'atacar' }] },
          { condicao: paredeFrente, corpo: [{ tipo: 'virar', sentido: 'esquerda' }] },
        ],
        senao: [{ tipo: 'avancar' }],
      },
    ])

    // O ramo então não pode ser removido; um senão se pode.
    assert.equal((removerRamo(arvore, se.id, entao.id)[0] as NoSe).ramos.length, 2)
    assert.equal((removerRamo(arvore, se.id, senaoSe.id)[0] as NoSe).ramos.length, 1)
    // O senão pode ser retirado.
    assert.equal((alternarSenao(arvore, se.id)[0] as NoSe).senao, null)
  })

  it('sensor ou comparação só encaixa na pergunta; ações e caixas só no corpo', () => {
    assert.equal(podeEncaixar('condicao', 'pergunta'), true)
    assert.equal(podeEncaixar('condicao', 'corpo'), false)
    assert.equal(podeEncaixar('acao', 'corpo'), true)
    assert.equal(podeEncaixar('acao', 'pergunta'), false)
    assert.equal(podeEncaixar('caixa', 'corpo'), true)
    assert.equal(podeEncaixar('caixa', 'pergunta'), false)
    assert.throws(() => criarNo({ categoria: 'condicao', condicao: paredeFrente }), /pergunta/)

    // definirCondicao só afeta perguntas: um id de lista de corpo ou de ação não muda nada.
    const arvore = inserirNo([], LISTA_RAIZ, 0, avancar)
    assert.deepEqual(definirCondicao(arvore, avancar.id, paredeFrente), arvore)
  })

  it('caixas podem conter outras caixas, como um se dentro de um enquanto', () => {
    const enquanto = novoEnquanto()
    const se = novoSe()
    let arvore: NoPrograma[] = inserirNo([], LISTA_RAIZ, 0, enquanto)
    arvore = definirCondicao(arvore, enquanto.id, {
      tipo: 'nao',
      condicao: { tipo: 'sensor', sensor: 'cheguei_destino' },
    })
    arvore = inserirNo(arvore, listaCorpoId(enquanto.id), 0, se)
    arvore = definirCondicao(arvore, se.ramos[0].id, paredeFrente)
    arvore = alternarSenao(arvore, se.id)
    arvore = inserirNo(
      arvore,
      se.ramos[0].id,
      0,
      novaAcao({ categoria: 'acao', bloco: { tipo: 'virar', sentido: 'esquerda' } }),
    )
    arvore = inserirNo(arvore, listaSenaoId(se.id), 0, avancar)

    assert.equal(contarBlocos(arvore), 4)
    assert.equal(perguntasVazias(arvore), 0)
    const enviada = paraArvore(arvore)
    assert.equal(enviada[0].tipo, 'enquanto')
    assert.equal((enviada[0] as { corpo: Instrucao[] }).corpo[0].tipo, 'se')

    // Uma caixa não pode ser movida para dentro de si mesma.
    assert.deepEqual(moverNo(arvore, enquanto.id, listaSenaoId(se.id), 0), arvore)
    // Mas a ação pode sair do senão para a raiz.
    const movida = moverNo(arvore, avancar.id, LISTA_RAIZ, 1)
    assert.equal(movida.length, 2)
    assert.equal(movida[1].id, avancar.id)
  })

  it('a árvore enviada no Play preserva o aninhamento e é executada respeitando-o', () => {
    // enquanto (não parede à frente) avançar; virar à direita; avançar
    const enquanto = novoEnquanto()
    let arvore: NoPrograma[] = inserirNo([], LISTA_RAIZ, 0, enquanto)
    arvore = definirCondicao(arvore, enquanto.id, naoParede)
    arvore = inserirNo(arvore, listaCorpoId(enquanto.id), 0, avancar)
    arvore = inserirNo(
      arvore,
      LISTA_RAIZ,
      1,
      novaAcao({ categoria: 'acao', bloco: { tipo: 'virar', sentido: 'direita' } }),
    )
    arvore = inserirNo(arvore, LISTA_RAIZ, 2, novaAcao({ categoria: 'acao', bloco: { tipo: 'avancar' } }))

    const enviada = paraArvore(arvore)
    // Ida e volta por JSON (o que trafega no Play) mantém a mesma árvore.
    assert.deepEqual(JSON.parse(JSON.stringify(enviada)), enviada)

    // O mesmo programa vence o corredor cego em todos os comprimentos sorteados.
    for (const semente of [1, 2, 3]) {
      const tentativa: Tentativa = sortearTentativaDaFase(FASE_5, semente, enviada)
      const resultado = interpretarArvore(tentativa, enviada, tentativa.inicio)
      assert.equal(resultado.veredito, 'vitoria', `semente ${semente}`)
      assert.deepEqual(resultado.programa, enviada)
      // Cada evento aponta para o nó da folha que o gerou.
      assert.ok(resultado.eventos.every((ev) => typeof ev.bloco.ref === 'string'))
    }
  })

  it('repetir N vezes repete o corpo e um laço sem fim para no limite de passos', () => {
    const repetir = criarNo({ categoria: 'caixa', caixa: 'repetir' })
    let arvore: NoPrograma[] = inserirNo([], LISTA_RAIZ, 0, repetir)
    arvore = definirVezes(arvore, repetir.id, 3)
    arvore = inserirNo(arvore, listaCorpoId(repetir.id), 0, avancar)
    const tentativa = sortearTentativaDaFase(FASE_5, 3) // corredor com 5 casas livres
    const r = interpretarArvore(tentativa, paraArvore(arvore), tentativa.inicio)
    assert.equal(r.eventos.length, 3)
    assert.deepEqual(r.personagem.posicao, { x: 3, y: 0 })

    const eterno: Instrucao[] = [
      { tipo: 'enquanto', condicao: paredeFrente, corpo: [{ tipo: 'virar', sentido: 'esquerda' }, { tipo: 'virar', sentido: 'direita' }] },
    ]
    const preso = interpretarArvore(
      { ...tentativa, casas: tentativa.casas.map(() => ({ tipo: 'parede' as const })), inicio: tentativa.inicio },
      eterno,
      tentativa.inicio,
    )
    assert.equal(preso.veredito, 'limite_de_passos')
  })
})
