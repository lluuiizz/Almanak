import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CATALOGO_FASES,
  FASE_1,
  FASE_3,
  FASE_4,
  FASE_5,
  MAPA_FASES_POR_ID,
  abrirTentativaNoServidor,
  paletaPermitidaPeloCatalogo,
  recursosLiberadosAteAFase,
} from './dadosFase1'
import type { Fase } from './tipos'

describe('Progressão do catálogo e paleta por fase', () => {
  it('há uma lista das doze fases com o conceito novo de cada uma', () => {
    assert.equal(CATALOGO_FASES.length, 12)
    assert.deepEqual(
      CATALOGO_FASES.map((f) => f.ordem),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    )
    for (const fase of CATALOGO_FASES) {
      assert.ok(fase.nome.trim().length > 0, `Fase ${fase.ordem} precisa de nome`)
      assert.ok(fase.conceito.trim().length > 0, `Fase ${fase.ordem} precisa de conceito`)
      assert.ok(fase.descricao.trim().length > 0, `Fase ${fase.ordem} precisa de descrição`)
    }
  })

  it('uma fase já concluída pode ser reaberta', async () => {
    const fasesConcluidas = ['fase-1', 'fase-3']
    for (const faseId of fasesConcluidas) {
      const fase = MAPA_FASES_POR_ID[faseId]
      assert.ok(fase, `Fase ${faseId} deve existir no mapa de fases`)
      const tentativa = await abrirTentativaNoServidor(fase, 1, [])
      assert.equal(tentativa.faseId, faseId)
      assert.equal(tentativa.casas.length, fase.largura * fase.altura)
    }
  })

  it('a paleta da fase aberta mostra apenas os blocos que o catálogo liberou', () => {
    const p1 = paletaPermitidaPeloCatalogo(FASE_1)
    assert.deepEqual(
      p1.blocosLiberados.map((b) => b.tipo),
      ['mover', 'mover', 'mover', 'mover'],
    )
    assert.deepEqual(p1.caixasLiberadas, [])
    assert.deepEqual(p1.condicoesLiberadas, [])

    const p3 = paletaPermitidaPeloCatalogo(FASE_3)
    assert.deepEqual(p3.caixasLiberadas, ['se'])
    assert.equal(p3.condicoesLiberadas.length, 1)

    const p4 = paletaPermitidaPeloCatalogo(FASE_4)
    assert.deepEqual(p4.caixasLiberadas, ['se'])

    const p5 = paletaPermitidaPeloCatalogo(FASE_5)
    assert.deepEqual(p5.caixasLiberadas, ['enquanto', 'se'])
  })

  it('não oferece enquanto na fase do muro nem rotina antes das alcovas', () => {
    // Na fase 3 (O muro), enquanto, repetir e rotina ainda não foram liberados
    const recursosMuro = recursosLiberadosAteAFase('fase-3')
    assert.equal(recursosMuro.has('se'), true)
    assert.equal(recursosMuro.has('enquanto'), false)
    assert.equal(recursosMuro.has('repetir'), false)
    assert.equal(recursosMuro.has('rotina'), false)

    // Mesmo se uma definição de fase tentar incluir enquanto/repetir na fase 3, o catálogo barra
    const fase3Adulterada: Fase = {
      ...FASE_3,
      caixasLiberadas: ['se', 'enquanto', 'repetir'],
      blocosLiberados: [...FASE_3.blocosLiberados, { tipo: 'atacar' }, { tipo: 'pegar' }],
    }
    const filtrada = paletaPermitidaPeloCatalogo(fase3Adulterada)
    assert.deepEqual(filtrada.caixasLiberadas, ['se'])
    assert.equal(
      filtrada.blocosLiberados.some((b) => b.tipo === 'atacar' || b.tipo === 'pegar'),
      false,
    )

    // Rotina não existe antes da fase 8 (Três alcovas) e passa a existir a partir dela
    for (let ordem = 1; ordem <= 7; ordem += 1) {
      assert.equal(
        recursosLiberadosAteAFase(ordem).has('rotina'),
        false,
        `Fase ${ordem} não pode oferecer rotina`,
      )
    }
    assert.equal(recursosLiberadosAteAFase(8).has('rotina'), true)
  })
})
