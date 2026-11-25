import { useState, type DragEvent, type ReactNode } from 'react'
import { iconeBloco, rotuloBloco } from './dadosFase1'
import {
  LISTA_RAIZ,
  VEZES_MAX,
  VEZES_MIN,
  listaCorpoId,
  listaSenaoId,
  rotuloCondicao,
  type ItemPaleta,
  type NoPrograma,
} from './programa'
import type { Condicao } from './tipos'

/* --------------------------------------------------------------------------
 * Arraste: cada categoria usa um tipo MIME próprio. No `dragover` o navegador
 * só expõe os tipos (não o conteúdo), e é por eles que cada encaixe decide se
 * aceita o que está sendo arrastado. Sensores só caem na pergunta; ações e
 * caixas só caem no corpo.
 * -------------------------------------------------------------------------- */

export const MIME_CORPO = 'application/x-almanak-corpo'
export const MIME_CONDICAO = 'application/x-almanak-condicao'
export const MIME_NO = 'application/x-almanak-no'

export type Arrastando = 'corpo' | 'condicao' | null

export type Destino =
  | { encaixe: 'corpo'; listaId: string; indice: number }
  | { encaixe: 'pergunta'; perguntaId: string }

export type Alvo = { encaixe: 'corpo'; listaId: string } | { encaixe: 'pergunta'; perguntaId: string }

export function iniciarArrasteItem(evento: DragEvent<HTMLElement>, item: ItemPaleta) {
  evento.dataTransfer.effectAllowed = 'copy'
  const mime = item.categoria === 'condicao' ? MIME_CONDICAO : MIME_CORPO
  evento.dataTransfer.setData(mime, JSON.stringify(item))
}

function aceitaNoCorpo(evento: DragEvent<HTMLElement>): boolean {
  const tipos = evento.dataTransfer.types
  return tipos.includes(MIME_CORPO) || tipos.includes(MIME_NO)
}

function aceitaNaPergunta(evento: DragEvent<HTMLElement>): boolean {
  return evento.dataTransfer.types.includes(MIME_CONDICAO)
}

export interface AcoesProgramador {
  soltar: (destino: Destino, dados: DataTransfer) => void
  selecionarAlvo: (alvo: Alvo) => void
  remover: (id: string) => void
  deslocar: (id: string, delta: -1 | 1) => void
  retirarCondicao: (perguntaId: string) => void
  adicionarSenaoSe: (seId: string) => void
  removerRamo: (seId: string, ramoId: string) => void
  alternarSenao: (seId: string) => void
  definirVezes: (id: string, vezes: number) => void
  arrastarNo: (evento: DragEvent<HTMLElement>, id: string) => void
  fimArraste: () => void
}

interface ContextoProgramador {
  acoes: AcoesProgramador
  desabilitado: boolean
  refAtiva: string | null
  alvo: Alvo
}

/* ------------------------------- lista ------------------------------------ */

function ListaCorpo({
  ctx,
  listaId,
  nos,
  vazio,
}: {
  ctx: ContextoProgramador
  listaId: string
  nos: NoPrograma[]
  vazio: string
}) {
  const [sobre, setSobre] = useState(false)
  const selecionada = ctx.alvo.encaixe === 'corpo' && ctx.alvo.listaId === listaId

  function soltarNoFim(evento: DragEvent<HTMLElement>) {
    if (!aceitaNoCorpo(evento)) return
    evento.preventDefault()
    evento.stopPropagation()
    setSobre(false)
    ctx.acoes.soltar({ encaixe: 'corpo', listaId, indice: nos.length }, evento.dataTransfer)
  }

  return (
    <div
      className={`corpo ${listaId === LISTA_RAIZ ? 'corpo-raiz' : ''} ${
        selecionada ? 'alvo-selecionado' : ''
      }`}
      data-lista-id={listaId}
    >
      {nos.length > 0 && (
        <ol className="program-list">
          {nos.map((no, indice) => (
            <ItemNo
              key={no.id}
              ctx={ctx}
              no={no}
              indice={indice}
              total={nos.length}
              listaId={listaId}
            />
          ))}
        </ol>
      )}
      <div
        className={`corpo-encaixe ${sobre ? 'sobre' : ''} ${nos.length === 0 ? 'vazio' : ''}`}
        role="button"
        tabIndex={ctx.desabilitado ? -1 : 0}
        aria-label={`Encaixe de ações: ${vazio}`}
        onClick={() => ctx.acoes.selecionarAlvo({ encaixe: 'corpo', listaId })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            ctx.acoes.selecionarAlvo({ encaixe: 'corpo', listaId })
          }
        }}
        onDragOver={(e) => {
          if (ctx.desabilitado || !aceitaNoCorpo(e)) return
          e.preventDefault()
          e.stopPropagation()
          setSobre(true)
        }}
        onDragLeave={() => setSobre(false)}
        onDrop={soltarNoFim}
      >
        {nos.length === 0 ? vazio : '+ solte aqui'}
      </div>
    </div>
  )
}

/* ------------------------------ pergunta ---------------------------------- */

function Pergunta({
  ctx,
  perguntaId,
  condicao,
}: {
  ctx: ContextoProgramador
  perguntaId: string
  condicao: Condicao | null
}) {
  const [sobre, setSobre] = useState(false)
  const selecionada = ctx.alvo.encaixe === 'pergunta' && ctx.alvo.perguntaId === perguntaId

  return (
    <span
      className={`pergunta ${condicao ? 'preenchida' : 'vazia'} ${sobre ? 'sobre' : ''} ${
        selecionada ? 'alvo-selecionado' : ''
      }`}
      data-pergunta-id={perguntaId}
      role="button"
      tabIndex={ctx.desabilitado ? -1 : 0}
      aria-label={condicao ? `Pergunta: ${rotuloCondicao(condicao)}` : 'Pergunta vazia'}
      onClick={(e) => {
        e.stopPropagation()
        ctx.acoes.selecionarAlvo({ encaixe: 'pergunta', perguntaId })
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          ctx.acoes.selecionarAlvo({ encaixe: 'pergunta', perguntaId })
        }
      }}
      onDragOver={(e) => {
        if (ctx.desabilitado || !aceitaNaPergunta(e)) return
        e.preventDefault()
        e.stopPropagation()
        setSobre(true)
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => {
        if (!aceitaNaPergunta(e)) return
        e.preventDefault()
        e.stopPropagation()
        setSobre(false)
        ctx.acoes.soltar({ encaixe: 'pergunta', perguntaId }, e.dataTransfer)
      }}
    >
      (
      {condicao ? (
        <>
          <span className="pergunta-texto">{rotuloCondicao(condicao)}</span>
          <button
            type="button"
            className="pergunta-retirar"
            disabled={ctx.desabilitado}
            aria-label="Retirar sensor da pergunta"
            title="Retirar"
            onClick={(e) => {
              e.stopPropagation()
              ctx.acoes.retirarCondicao(perguntaId)
            }}
          >
            ✕
          </button>
        </>
      ) : (
        <span className="pergunta-placeholder">encaixe um sensor</span>
      )}
      )
    </span>
  )
}

/* ------------------------------ item / nó --------------------------------- */

function BotoesNo({
  ctx,
  id,
  indice,
  total,
}: {
  ctx: ContextoProgramador
  id: string
  indice: number
  total: number
}) {
  return (
    <div className="program-item-actions">
      <button
        type="button"
        className="btn-icon"
        onClick={() => ctx.acoes.deslocar(id, -1)}
        disabled={ctx.desabilitado || indice === 0}
        aria-label="Subir bloco"
        title="Mover para cima"
      >
        ↑
      </button>
      <button
        type="button"
        className="btn-icon"
        onClick={() => ctx.acoes.deslocar(id, 1)}
        disabled={ctx.desabilitado || indice === total - 1}
        aria-label="Descer bloco"
        title="Mover para baixo"
      >
        ↓
      </button>
      <button
        type="button"
        className="btn-icon remove"
        onClick={() => ctx.acoes.remover(id)}
        disabled={ctx.desabilitado}
        aria-label="Remover bloco"
        title="Remover bloco"
      >
        ✕
      </button>
    </div>
  )
}

function ItemNo({
  ctx,
  no,
  indice,
  total,
  listaId,
}: {
  ctx: ContextoProgramador
  no: NoPrograma
  indice: number
  total: number
  listaId: string
}) {
  const [sobre, setSobre] = useState(false)

  // Soltar sobre um item insere antes dele, na mesma lista.
  const propsArraste = {
    draggable: !ctx.desabilitado,
    onDragStart: (e: DragEvent<HTMLElement>) => {
      e.stopPropagation()
      ctx.acoes.arrastarNo(e, no.id)
    },
    onDragEnd: () => ctx.acoes.fimArraste(),
    onDragOver: (e: DragEvent<HTMLElement>) => {
      if (ctx.desabilitado || !aceitaNoCorpo(e)) return
      e.preventDefault()
      e.stopPropagation()
      setSobre(true)
    },
    onDragLeave: () => setSobre(false),
    onDrop: (e: DragEvent<HTMLElement>) => {
      if (!aceitaNoCorpo(e)) return
      e.preventDefault()
      e.stopPropagation()
      setSobre(false)
      ctx.acoes.soltar({ encaixe: 'corpo', listaId, indice }, e.dataTransfer)
    },
  }

  if (no.tipo === 'acao') {
    const ativo = ctx.refAtiva === no.id
    return (
      <li
        {...propsArraste}
        className={`program-item ${ativo ? 'executing' : ''} ${sobre ? 'drop-antes' : ''}`}
        data-no-id={no.id}
      >
        <span className="block-badge" aria-hidden="true">
          {iconeBloco(no.bloco)}
        </span>
        <span className="block-name">{rotuloBloco(no.bloco)}</span>
        <BotoesNo ctx={ctx} id={no.id} indice={indice} total={total} />
      </li>
    )
  }

  let conteudo: ReactNode
  if (no.tipo === 'se') {
    conteudo = (
      <>
        {no.ramos.map((ramo, i) => (
          <div className="caixa-secao" key={ramo.id}>
            <div className="caixa-cabecalho" {...(i === 0 ? propsArraste : {})}>
              <span className="caixa-palavra">{i === 0 ? 'se' : 'senão se'}</span>
              <Pergunta ctx={ctx} perguntaId={ramo.id} condicao={ramo.condicao} />
              {i === 0 && <span className="caixa-palavra suave">então</span>}
              {i === 0 ? (
                <BotoesNo ctx={ctx} id={no.id} indice={indice} total={total} />
              ) : (
                <button
                  type="button"
                  className="btn-icon remove"
                  disabled={ctx.desabilitado}
                  onClick={() => ctx.acoes.removerRamo(no.id, ramo.id)}
                  aria-label="Remover ramo senão se"
                  title="Remover este senão se"
                >
                  ✕
                </button>
              )}
            </div>
            <ListaCorpo ctx={ctx} listaId={ramo.id} nos={ramo.corpo} vazio="ações deste ramo" />
          </div>
        ))}
        {no.senao !== null && (
          <div className="caixa-secao">
            <div className="caixa-cabecalho">
              <span className="caixa-palavra">senão</span>
            </div>
            <ListaCorpo
              ctx={ctx}
              listaId={listaSenaoId(no.id)}
              nos={no.senao}
              vazio="ações do senão"
            />
          </div>
        )}
        <div className="caixa-rodape">
          <button
            type="button"
            className="btn-ramo"
            disabled={ctx.desabilitado}
            onClick={() => ctx.acoes.adicionarSenaoSe(no.id)}
          >
            + senão se
          </button>
          <button
            type="button"
            className="btn-ramo"
            disabled={ctx.desabilitado}
            onClick={() => ctx.acoes.alternarSenao(no.id)}
          >
            {no.senao === null ? '+ senão' : '− senão'}
          </button>
        </div>
      </>
    )
  } else if (no.tipo === 'enquanto') {
    conteudo = (
      <div className="caixa-secao">
        <div className="caixa-cabecalho" {...propsArraste}>
          <span className="caixa-palavra">enquanto</span>
          <Pergunta ctx={ctx} perguntaId={no.id} condicao={no.condicao} />
          <BotoesNo ctx={ctx} id={no.id} indice={indice} total={total} />
        </div>
        <ListaCorpo ctx={ctx} listaId={listaCorpoId(no.id)} nos={no.corpo} vazio="ações repetidas" />
      </div>
    )
  } else {
    conteudo = (
      <div className="caixa-secao">
        <div className="caixa-cabecalho" {...propsArraste}>
          <span className="caixa-palavra">repetir</span>
          <input
            type="number"
            className="caixa-vezes"
            min={VEZES_MIN}
            max={VEZES_MAX}
            value={no.vezes}
            disabled={ctx.desabilitado}
            aria-label="Número de repetições"
            onChange={(e) => ctx.acoes.definirVezes(no.id, Number(e.target.value))}
          />
          <span className="caixa-palavra">vezes</span>
          <BotoesNo ctx={ctx} id={no.id} indice={indice} total={total} />
        </div>
        <ListaCorpo ctx={ctx} listaId={listaCorpoId(no.id)} nos={no.corpo} vazio="ações repetidas" />
      </div>
    )
  }

  return (
    <li
      className={`caixa caixa-${no.tipo} ${sobre ? 'drop-antes' : ''}`}
      data-no-id={no.id}
      data-tipo-caixa={no.tipo}
    >
      {conteudo}
    </li>
  )
}

/* ------------------------------- raiz ------------------------------------- */

export function Programador({
  nos,
  acoes,
  desabilitado,
  refAtiva,
  alvo,
  arrastando,
}: {
  nos: NoPrograma[]
  acoes: AcoesProgramador
  desabilitado: boolean
  refAtiva: string | null
  alvo: Alvo
  arrastando: Arrastando
}) {
  const ctx: ContextoProgramador = { acoes, desabilitado, refAtiva, alvo }
  return (
    <div className={`programador-arvore ${arrastando ? `arrastando-${arrastando}` : ''}`}>
      <ListaCorpo
        ctx={ctx}
        listaId={LISTA_RAIZ}
        nos={nos}
        vazio="Arraste blocos para cá (ou clique neles na paleta) para montar a sequência."
      />
    </div>
  )
}
