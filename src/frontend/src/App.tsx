import { useState, type DragEvent } from 'react'
import './App.css'
import {
  CATALOGO_FASES,
  FASE_1,
  executarProgramaNaFase,
  iconeBloco,
  mensagemVeredito,
  rotuloBloco,
} from './dadosFase1'
import type { Bloco, BlocoInstancia, Personagem, Resultado } from './tipos'

type AbaAtiva = 'jogo' | 'trilha'

const PASSO_ANIMACAO_MS = 520

function criarIdBloco(): string {
  return `bloco-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function App() {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('jogo')
  const [programa, setPrograma] = useState<BlocoInstancia[]>([])
  const [personagem, setPersonagem] = useState<Personagem>(() => ({
    ...FASE_1.inicio,
    posicao: { ...FASE_1.inicio.posicao },
    alforje: [...FASE_1.inicio.alforje],
  }))
  const [executando, setExecutando] = useState(false)
  const [indiceBlocoAtivo, setIndiceBlocoAtivo] = useState<number | null>(null)
  const [ultimoResultado, setUltimoResultado] = useState<Resultado | null>(null)
  const [fasesConcluidas, setFasesConcluidas] = useState<string[]>([])
  const [arrastandoSobreProgramador, setArrastandoSobreProgramador] = useState(false)
  const [indiceReordenacao, setIndiceReordenacao] = useState<number | null>(null)
  const [erroApi, setErroApi] = useState<string | null>(null)

  const faseConcluida = fasesConcluidas.includes(FASE_1.id)

  function adicionarBloco(bloco: Bloco, indiceDestino?: number) {
    if (executando) return
    const novoItem: BlocoInstancia = { id: criarIdBloco(), bloco: { ...bloco } }
    setPrograma((atual) => {
      if (indiceDestino === undefined || indiceDestino < 0 || indiceDestino >= atual.length) {
        return [...atual, novoItem]
      }
      const copia = [...atual]
      copia.splice(indiceDestino, 0, novoItem)
      return copia
    })
  }

  function removerBloco(id: string) {
    if (executando) return
    setPrograma((atual) => atual.filter((item) => item.id !== id))
  }

  function moverBlocoNaLista(origem: number, destino: number) {
    if (executando) return
    setPrograma((atual) => {
      if (
        origem < 0 ||
        origem >= atual.length ||
        destino < 0 ||
        destino >= atual.length ||
        origem === destino
      ) {
        return atual
      }
      const copia = [...atual]
      const [removido] = copia.splice(origem, 1)
      copia.splice(destino, 0, removido)
      return copia
    })
  }

  function limparProgramador() {
    if (executando) return
    setPrograma([])
    setUltimoResultado(null)
    setIndiceBlocoAtivo(null)
    resetarPosicaoPersonagem()
  }

  function resetarPosicaoPersonagem() {
    setPersonagem({
      ...FASE_1.inicio,
      posicao: { ...FASE_1.inicio.posicao },
      alforje: [...FASE_1.inicio.alforje],
    })
  }

  function iniciarArrasteDaPaleta(evento: DragEvent<HTMLDivElement>, bloco: Bloco) {
    if (executando) return
    evento.dataTransfer.effectAllowed = 'copy'
    evento.dataTransfer.setData('application/x-almanak-origem', 'paleta')
    evento.dataTransfer.setData('application/x-almanak-bloco', JSON.stringify(bloco))
  }

  function iniciarArrasteDoProgramador(evento: DragEvent<HTMLLIElement>, indice: number) {
    if (executando) return
    setIndiceReordenacao(indice)
    evento.dataTransfer.effectAllowed = 'move'
    evento.dataTransfer.setData('application/x-almanak-origem', 'programador')
    evento.dataTransfer.setData('application/x-almanak-indice', String(indice))
  }

  function soltarNoProgramador(evento: DragEvent<HTMLElement>, indiceAlvo?: number) {
    evento.preventDefault()
    evento.stopPropagation()
    setArrastandoSobreProgramador(false)
    setIndiceReordenacao(null)

    if (executando) return

    const origem = evento.dataTransfer.getData('application/x-almanak-origem')
    if (origem === 'paleta') {
      const bruto = evento.dataTransfer.getData('application/x-almanak-bloco')
      if (!bruto) return
      try {
        const bloco = JSON.parse(bruto) as Bloco
        adicionarBloco(bloco, indiceAlvo)
      } catch {
        // Ignora payload inválido
      }
      return
    }

    if (origem === 'programador') {
      const indiceOrigem = Number(evento.dataTransfer.getData('application/x-almanak-indice'))
      if (Number.isNaN(indiceOrigem)) return
      const destino = indiceAlvo !== undefined ? indiceAlvo : programa.length - 1
      moverBlocoNaLista(indiceOrigem, destino)
    }
  }

  async function executarPlay() {
    if (executando || programa.length === 0) return

    setExecutando(true)
    setUltimoResultado(null)
    setErroApi(null)
    setIndiceBlocoAtivo(null)
    resetarPosicaoPersonagem()

    const listaBlocos = programa.map((item) => item.bloco)
    let resultado
    try {
      resultado = await executarProgramaNaFase(FASE_1, listaBlocos)
    } catch (erro) {
      setErroApi(erro instanceof Error ? erro.message : 'O servidor não respondeu.')
      setIndiceBlocoAtivo(null)
      setExecutando(false)
      return
    }

    // Pausa inicial para o jogador ver o personagem na casa P antes do passo 1
    await new Promise((resolve) => setTimeout(resolve, 260))

    for (let i = 0; i < resultado.eventos.length; i += 1) {
      const ev = resultado.eventos[i]
      setIndiceBlocoAtivo(i)
      setPersonagem({
        ...ev.personagem,
        posicao: { ...ev.personagem.posicao },
        alforje: [...ev.personagem.alforje],
      })
      await new Promise((resolve) => setTimeout(resolve, PASSO_ANIMACAO_MS))
    }

    // Na falha, o motor devolve o personagem ao início e preserva o programa
    setPersonagem({
      ...resultado.personagem,
      posicao: { ...resultado.personagem.posicao },
      alforje: [...resultado.personagem.alforje],
    })
    setIndiceBlocoAtivo(null)
    setUltimoResultado(resultado)
    setExecutando(false)

    if (resultado.veredito === 'vitoria' && !fasesConcluidas.includes(FASE_1.id)) {
      setFasesConcluidas((atual) => [...atual, FASE_1.id])
    }
  }

  const parouNoMarcoX =
    ultimoResultado?.veredito === 'sem_vitoria' &&
    ultimoResultado.personagem.posicao.x === 1 &&
    ultimoResultado.personagem.posicao.y === 0

  const feedback = ultimoResultado
    ? mensagemVeredito(ultimoResultado.veredito, parouNoMarcoX)
    : null

  return (
    <div className="coddy-shell">
      {/* Barra superior estilo Coddy.tech */}
      <header className="coddy-topbar">
        <div className="topbar-left">
          <div className="brand-badge" aria-hidden="true">
            <span>{'</>'}</span>
          </div>
          <div className="brand-copy">
            <span className="brand-title">ALMANAK</span>
            <span className="brand-subtitle">Lógica de Programação em Blocos</span>
          </div>

          <nav className="topbar-nav" aria-label="Navegação principal">
            <button
              type="button"
              className={`nav-pill ${abaAtiva === 'jogo' ? 'active' : ''}`}
              onClick={() => setAbaAtiva('jogo')}
            >
              HUD Fase Inicial
            </button>
            <button
              type="button"
              className={`nav-pill ${abaAtiva === 'trilha' ? 'active' : ''}`}
              onClick={() => setAbaAtiva('trilha')}
            >
              Trilha das 12 Fases
            </button>
          </nav>
        </div>

        <div className="topbar-center">
          <div className="level-stepper" aria-label="Progresso de fases">
            {CATALOGO_FASES.map((fase) => {
              const concluida = fasesConcluidas.includes(fase.id)
              const atual = fase.id === FASE_1.id
              return (
                <button
                  key={fase.id}
                  type="button"
                  className={`step-dot ${atual ? 'current' : ''} ${concluida ? 'done' : ''} ${
                    !fase.disponivel ? 'locked' : ''
                  }`}
                  onClick={() => setAbaAtiva(fase.disponivel ? 'jogo' : 'trilha')}
                  title={`Fase ${fase.ordem}: ${fase.nome} (${fase.conceito})`}
                >
                  {concluida ? '✓' : fase.ordem}
                </button>
              )
            })}
          </div>
        </div>

        <div className="topbar-right">
          <div className="hud-stat" title="Atributo variável: Vida do personagem">
            <span className="stat-icon heart">♥</span>
            <span className="stat-label">Vida</span>
            <strong className="stat-value">{personagem.vida}</strong>
          </div>
          <div className="hud-stat" title="Atributo variável: Poder de ataque">
            <span className="stat-icon sword">⚔</span>
            <span className="stat-label">Ataque</span>
            <strong className="stat-value">{personagem.ataque}</strong>
          </div>
          <div className="hud-stat" title="Constante permanente (Fase 11)">
            <span className="stat-icon medal">★</span>
            <span className="stat-label">Talento</span>
            <strong className="stat-value">{faseConcluida ? 'Ativo' : '—'}</strong>
          </div>
        </div>
      </header>

      {abaAtiva === 'trilha' ? (
        <main className="roadmap-container">
          <div className="roadmap-header">
            <div>
              <span className="badge-concept">Mapa da Progressão Conceitual</span>
              <h1>Jornada de Fundamentos da Programação</h1>
              <p>
                A cada fase dominada, novos obstáculos entram no mapa e novos blocos passam a
                existir: algoritmos sequenciais, sensores, condicionais, laços, funções, variáveis,
                arrays e constantes.
              </p>
            </div>
            <button type="button" className="btn-primary-play" onClick={() => setAbaAtiva('jogo')}>
              Voltar para a Fase 1 ▶
            </button>
          </div>

          <div className="roadmap-grid">
            {CATALOGO_FASES.map((item) => {
              const concluida = fasesConcluidas.includes(item.id)
              return (
                <article
                  key={item.id}
                  className={`roadmap-card ${item.disponivel ? 'unlocked' : 'locked'} ${
                    concluida ? 'completed' : ''
                  }`}
                >
                  <div className="roadmap-card-top">
                    <span className="phase-number">FASE {item.ordem}</span>
                    <span className="concept-chip">{item.conceito}</span>
                  </div>
                  <h2>{item.nome}</h2>
                  <p>{item.porQueEntraAqui}</p>
                  <div className="roadmap-card-footer">
                    {concluida ? (
                      <span className="status-tag done">✓ Concluída</span>
                    ) : item.disponivel ? (
                      <button
                        type="button"
                        className="btn-card-open"
                        onClick={() => setAbaAtiva('jogo')}
                      >
                        Jogar agora →
                      </button>
                    ) : (
                      <span className="status-tag locked">🔒 Em breve</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </main>
      ) : (
        /* Workspace principal de 3 colunas inspirado no Coddy + HUD Fase Inicial do Almanak */
        <main className="hud-workspace">
          {/* COLUNA 1: Programador de ações */}
          <section
            className={`panel programmer-panel ${arrastandoSobreProgramador ? 'drag-over' : ''}`}
            aria-label="Programador de ações"
            onDragOver={(e) => {
              e.preventDefault()
              if (!executando) setArrastandoSobreProgramador(true)
            }}
            onDragLeave={() => setArrastandoSobreProgramador(false)}
            onDrop={(e) => soltarNoProgramador(e)}
          >
            <header className="panel-header">
              <div className="panel-title-group">
                <span className="panel-dot cyan" />
                <h2>Programador de ações</h2>
              </div>
              <div className="panel-meta">
                <span className="step-counter">
                  {programa.length} / {FASE_1.limiteDePassos} blocos
                </span>
                <button
                  type="button"
                  className="btn-clear"
                  onClick={limparProgramador}
                  disabled={executando || programa.length === 0}
                  title="Limpar todos os blocos da folha"
                >
                  Limpar
                </button>
              </div>
            </header>

            <div className="programmer-sheet">
              {programa.length === 0 ? (
                <div className="empty-programmer">
                  <div className="empty-icon">⇣</div>
                  <p className="empty-title">A folha do programador está vazia</p>
                  <p className="empty-hint">
                    Arraste blocos da coluna <strong>Blocos de ação</strong> para cá (ou clique
                    neles) para montar a sua sequência antes de apertar <strong>Play</strong>.
                  </p>
                </div>
              ) : (
                <ol className="program-list">
                  {programa.map((item, idx) => {
                    const ativo = indiceBlocoAtivo === idx
                    const arrastandoEste = indiceReordenacao === idx
                    return (
                      <li
                        key={item.id}
                        draggable={!executando}
                        onDragStart={(e) => iniciarArrasteDoProgramador(e, idx)}
                        onDragEnd={() => setIndiceReordenacao(null)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => soltarNoProgramador(e, idx)}
                        className={`program-item ${ativo ? 'executing' : ''} ${
                          arrastandoEste ? 'dragging' : ''
                        }`}
                      >
                        <span className="line-number">{idx + 1}</span>
                        <span className="block-badge" aria-hidden="true">
                          {iconeBloco(item.bloco)}
                        </span>
                        <span className="block-name">{rotuloBloco(item.bloco)}</span>

                        <div className="program-item-actions">
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => moverBlocoNaLista(idx, idx - 1)}
                            disabled={executando || idx === 0}
                            aria-label={`Subir bloco ${idx + 1}`}
                            title="Mover para cima"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => moverBlocoNaLista(idx, idx + 1)}
                            disabled={executando || idx === programa.length - 1}
                            aria-label={`Descer bloco ${idx + 1}`}
                            title="Mover para baixo"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="btn-icon remove"
                            onClick={() => removerBloco(item.id)}
                            disabled={executando}
                            aria-label={`Remover bloco ${idx + 1}`}
                            title="Remover bloco"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>

            <footer className="panel-footer">
              <span className="footer-note">
                ⚡ As ações só acontecem no mapa depois que você aperta <strong>Play</strong>.
              </span>
            </footer>
          </section>

          {/* COLUNA 2 (Centro): Briefing + Mapa + Botão Play */}
          <section className="panel center-stage" aria-label="Mapa e Execução">
            {/* Card de Missão / Briefing estilo Coddy */}
            <div className="mission-card">
              <div className="mission-header">
                <div className="mission-badges">
                  <span className="badge-phase">FASE {FASE_1.ordem} — TUTORIAL</span>
                  <span className="badge-concept">Conceito: {FASE_1.conceito}</span>
                </div>
                {faseConcluida && <span className="badge-solved">✓ Fase Dominada</span>}
              </div>
              <p className="mission-description">{FASE_1.enunciado}</p>
              <div className="mission-tip">
                <strong>Dica do Tutorial:</strong> {FASE_1.dicaTutorial}
              </div>
            </div>

            {/* Palco do Mapa */}
            <div className="map-viewport">
              <div className="map-header-bar">
                <span className="map-title">Mapa</span>
                <span className="map-coords">
                  Posição: ({personagem.posicao.x}, {personagem.posicao.y}) • Olhar:{' '}
                  <strong>{personagem.olhar}</strong>
                </span>
              </div>

              <div className="map-board" role="region" aria-label="Tabuleiro da Fase 1">
                <div
                  className="map-grid"
                  style={{
                    gridTemplateColumns: `repeat(${FASE_1.largura}, minmax(120px, 160px))`,
                  }}
                >
                  {FASE_1.casas.map((casa, idx) => {
                    const x = idx % FASE_1.largura
                    const y = Math.floor(idx / FASE_1.largura)
                    const temJogador =
                      personagem.posicao.x === x && personagem.posicao.y === y
                    const ehInicio = FASE_1.inicio.posicao.x === x && FASE_1.inicio.posicao.y === y
                    const ehMarco = Boolean(casa.marco)
                    const ehDestino = casa.tipo === 'destino'

                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`map-cell ${ehDestino ? 'cell-goal' : ''} ${
                          ehMarco ? 'cell-checkpoint' : ''
                        } ${temJogador ? 'cell-active' : ''}`}
                      >
                        <span className="cell-coord">casa {idx + 1}</span>

                        <div className="cell-center">
                          {ehMarco && !temJogador && (
                            <span className="checkpoint-mark" title="Marco intermediário (X)">
                              X
                            </span>
                          )}

                          {ehDestino && !temJogador && (
                            <div className="goal-flag">
                              <span className="goal-icon">⚑</span>
                              <span className="goal-text">Destino</span>
                            </div>
                          )}

                          {ehInicio && !temJogador && (
                            <span className="start-ghost">Início</span>
                          )}

                          {temJogador && (
                            <div
                              className={`player-token facing-${personagem.olhar} ${
                                executando ? 'walking' : ''
                              }`}
                            >
                              <div className="player-avatar">
                                <span className="player-eyes" />
                              </div>
                              <span className="player-tag">Player</span>
                            </div>
                          )}
                        </div>

                        <span className="cell-caption">
                          {ehInicio
                            ? 'Posição Inicial'
                            : ehMarco
                              ? 'Marco (X)'
                              : ehDestino
                                ? 'Objetivo'
                                : 'Caminho'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Área de Controle Principal: Botão Play circular + Status */}
              <div className="play-control-bar">
                <button
                  type="button"
                  className={`play-circle-btn ${executando ? 'running' : ''}`}
                  onClick={executarPlay}
                  disabled={executando || programa.length === 0}
                  aria-label="Botão Play: Iniciar a execução da sequência montada"
                >
                  <span className="play-triangle" aria-hidden="true">
                    {executando ? '•••' : '▶'}
                  </span>
                </button>
                <div className="play-caption">
                  <strong>{executando ? 'Executando sequência...' : 'Botão Play'}</strong>
                  <span>
                    {programa.length === 0
                      ? 'Adicione pelo menos 1 bloco ao Programador de ações para habilitar o Play.'
                      : 'Inicia a execução da sequência montada, um passo por bloco.'}
                  </span>
                </div>
              </div>
            </div>

            {erroApi && (
              <div className="verdict-banner tone-erro" role="alert">
                <div className="verdict-content">
                  <strong>Não foi possível executar</strong>
                  <p>{erroApi}</p>
                </div>
              </div>
            )}

            {/* Banner de Veredito após o Play */}
            {feedback && (
              <div className={`verdict-banner tone-${feedback.tom}`} role="status">
                <div className="verdict-content">
                  <strong>{feedback.titulo}</strong>
                  <p>{feedback.detalhe}</p>
                </div>
                <button
                  type="button"
                  className="btn-retry"
                  onClick={() => {
                    setUltimoResultado(null)
                    resetarPosicaoPersonagem()
                  }}
                >
                  {ultimoResultado?.veredito === 'vitoria' ? 'Jogar novamente' : 'Corrigir sequência'}
                </button>
              </div>
            )}
          </section>

          {/* COLUNA 3: Blocos de ação */}
          <aside className="panel palette-panel" aria-label="Blocos de ação">
            <header className="panel-header">
              <div className="panel-title-group">
                <span className="panel-dot purple" />
                <h2>Blocos de ação</h2>
              </div>
              <span className="unlimited-badge">∞ Ilimitados</span>
            </header>

            <p className="palette-instructions">
              Arraste um comando até o <strong>Programador de ações</strong> à esquerda ou clique no
              bloco para inseri-lo no fim da fila:
            </p>

            <div className="palette-list">
              {FASE_1.blocosLiberados.map((bloco, i) => (
                <div
                  key={`${bloco.tipo}-${i}`}
                  draggable={!executando}
                  onDragStart={(e) => iniciarArrasteDaPaleta(e, bloco)}
                  onClick={() => adicionarBloco(bloco)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      adicionarBloco(bloco)
                    }
                  }}
                  role="button"
                  tabIndex={executando ? -1 : 0}
                  aria-disabled={executando}
                  className={`palette-block ${executando ? 'disabled' : ''}`}
                >
                  <span className="palette-block-arrow" aria-hidden="true">
                    {iconeBloco(bloco)}
                  </span>
                  <div className="palette-block-info">
                    <span className="palette-block-title">{rotuloBloco(bloco)}</span>
                    <span className="palette-block-meta">Ação • 1 passo</span>
                  </div>
                  <span className="palette-block-add" title="Adicionar ao programador">
                    +
                  </span>
                </div>
              ))}
            </div>

            <div className="upcoming-concepts-box">
              <h3>Próximas Ferramentas</h3>
              <p>Conforme você avançar pelas 12 fases, esta paleta desbloqueará:</p>
              <ul>
                <li>
                  <code>se / senão</code> + sensores de mundo (Fase 3 e 4)
                </li>
                <li>
                  Laços <code>enquanto</code> e <code>repetir N vezes</code> (Fase 5 e 7)
                </li>
                <li>
                  Rotinas reutilizáveis e variáveis (Fase 8 e 9)
                </li>
                <li>
                  Alforje (Array) e Talentos constantes (Fase 10 e 11)
                </li>
              </ul>
            </div>
          </aside>
        </main>
      )}
    </div>
  )
}

export default App
