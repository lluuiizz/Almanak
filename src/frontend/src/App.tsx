import { useCallback, useEffect, useState, type DragEvent } from 'react'
import './App.css'
import {
  JOGADOR_LOCAL_ID,
  abrirTentativaNaApi,
  buscarFaseNaApi,
  buscarProgressoDoJogador,
  executarTentativaNaApi,
  fasePodeSerJogada,
  itensDaPaletaDeBlocosLiberados,
  listarFasesDaApi,
} from './apiFases'
import { iconeBloco, mensagemVeredito, rotuloBloco } from './dadosFase1'
import { TabuleiroMapa, faseMostraOlhar, tentativaTemNeblina } from './Mapa'
import {
  LISTA_RAIZ,
  adicionarSenaoSe,
  alternarSenao,
  chaveCondicao,
  contarBlocos,
  criarNo,
  definirCondicao,
  definirVezes,
  deslocarNo,
  inserirNo,
  moverNo,
  paraArvore,
  perguntasVazias,
  podeEncaixar,
  removerNo,
  removerRamo,
  rotuloCaixa,
  rotuloCondicao,
  type ItemPaleta,
  type NoPrograma,
} from './programa'
import {
  MIME_CONDICAO,
  MIME_CORPO,
  MIME_NO,
  Programador,
  iniciarArrasteItem,
  type AcoesProgramador,
  type Alvo,
  type Arrastando,
  type Destino,
} from './Programador'
import type { Fase, FaseResumo, Personagem, Resultado, Tentativa } from './tipos'

type AbaAtiva = 'jogo' | 'trilha'

const PASSO_ANIMACAO_MS = 520
const ALVO_RAIZ: Alvo = { encaixe: 'corpo', listaId: LISTA_RAIZ }

function itensDaPaleta(fase: Fase): ItemPaleta[] {
  return itensDaPaletaDeBlocosLiberados(
    fase.blocosLiberados,
    fase.caixasLiberadas ?? [],
    fase.condicoesLiberadas ?? [],
  )
}

function App() {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('jogo')
  const [fases, setFases] = useState<FaseResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroApi, setErroApi] = useState<string | null>(null)
  const [faseAtual, setFaseAtual] = useState<Fase | null>(null)
  const [sementeAtual, setSementeAtual] = useState<number>(1)
  const [tentativaAberta, setTentativaAberta] = useState<Tentativa | null>(null)
  const [arvore, setArvore] = useState<NoPrograma[]>([])
  const [alvo, setAlvo] = useState<Alvo>(ALVO_RAIZ)
  const [arrastando, setArrastando] = useState<Arrastando>(null)
  const [avisoEncaixe, setAvisoEncaixe] = useState<string | null>(null)
  const [personagem, setPersonagem] = useState<Personagem | null>(null)
  const [executando, setExecutando] = useState(false)
  const [refAtiva, setRefAtiva] = useState<string | null>(null)
  const [ultimoResultado, setUltimoResultado] = useState<Resultado | null>(null)
  const [fasesConcluidas, setFasesConcluidas] = useState<string[]>([])
  const [talento, setTalento] = useState<string | null>(null)

  const faseConcluida = faseAtual ? fasesConcluidas.includes(faseAtual.id) : false
  const mostrarOlhar = faseAtual ? faseMostraOlhar(faseAtual) : false
  const neblinaAtiva = tentativaAberta
    ? tentativaTemNeblina(tentativaAberta.faseId, tentativaAberta.temNeblina)
    : false
  const temSorteioNaFase = faseAtual?.id === 'fase-4' || faseAtual?.id === 'fase-5'
  const totalBlocos = contarBlocos(arvore)
  const vazias = perguntasVazias(arvore)
  const podeExecutar = Boolean(tentativaAberta) && !executando && totalBlocos > 0 && vazias === 0
  const paleta = faseAtual ? itensDaPaleta(faseAtual) : []

  const abrirFaseDaApi = useCallback(async (faseId: string, limparBlocos: boolean = true) => {
    setCarregando(true)
    setErroApi(null)
    try {
      const faseCarregada = await buscarFaseNaApi(faseId)
      const novaTentativa = await abrirTentativaNaApi(faseCarregada, undefined, [])
      setFaseAtual(faseCarregada)
      setSementeAtual(novaTentativa.semente)
      setTentativaAberta(novaTentativa)
      if (limparBlocos) {
        setArvore([])
        setAlvo(ALVO_RAIZ)
      }
      setUltimoResultado(null)
      setRefAtiva(null)
      setAvisoEncaixe(null)
      setPersonagem({
        ...novaTentativa.inicio,
        posicao: { ...novaTentativa.inicio.posicao },
        alforje: [...novaTentativa.inicio.alforje],
      })
    } catch (erro) {
      setFaseAtual(null)
      setTentativaAberta(null)
      setPersonagem(null)
      setErroApi(
        erro instanceof Error ? erro.message : 'Não foi possível carregar a fase na API.',
      )
    } finally {
      setCarregando(false)
    }
  }, [])

  const carregarCatalogoInicial = useCallback(async () => {
    setCarregando(true)
    setErroApi(null)
    try {
      const [lista, progresso] = await Promise.all([
        listarFasesDaApi(),
        buscarProgressoDoJogador(JOGADOR_LOCAL_ID),
      ])
      setFases(lista)
      setFasesConcluidas(progresso.fasesConcluidas)
      setTalento(progresso.talento)
      if (lista.length === 0) {
        setFaseAtual(null)
        setTentativaAberta(null)
        setPersonagem(null)
        setErroApi('Nenhuma fase cadastrada foi devolvida pela API.')
        return
      }
      const primeira =
        lista.find((f) => fasePodeSerJogada(f, lista, progresso.fasesConcluidas)) ?? lista[0]
      await abrirFaseDaApi(primeira.id, true)
    } catch (erro) {
      setFases([])
      setFaseAtual(null)
      setTentativaAberta(null)
      setPersonagem(null)
      setErroApi(
        erro instanceof Error ? erro.message : 'Não foi possível conectar à API de fases.',
      )
      setCarregando(false)
    }
  }, [abrirFaseDaApi])

  useEffect(() => {
    void carregarCatalogoInicial()
  }, [carregarCatalogoInicial])

  async function abrirNovaTentativa(
    faseAlvo: Fase | null = faseAtual,
    novaSemente: number = sementeAtual,
    limparBlocos: boolean = false,
  ) {
    if (executando || !faseAlvo) return
    setErroApi(null)
    try {
      const blocosAtuais = limparBlocos ? [] : paraArvore(arvore)
      const novaTentativa = await abrirTentativaNaApi(faseAlvo, novaSemente, blocosAtuais)
      setFaseAtual(faseAlvo)
      setSementeAtual(novaTentativa.semente)
      setTentativaAberta(novaTentativa)
      if (limparBlocos) {
        setArvore([])
        setAlvo(ALVO_RAIZ)
      }
      setUltimoResultado(null)
      setRefAtiva(null)
      setAvisoEncaixe(null)
      setPersonagem({
        ...novaTentativa.inicio,
        posicao: { ...novaTentativa.inicio.posicao },
        alforje: [...novaTentativa.inicio.alforje],
      })
    } catch (erro) {
      setErroApi(
        erro instanceof Error ? erro.message : 'Não foi possível abrir nova tentativa na API.',
      )
    }
  }

  function selecionarFase(faseId: string) {
    if (executando) return
    const resumo = fases.find((f) => f.id === faseId)
    if (!resumo || !fasePodeSerJogada(resumo, fases, fasesConcluidas)) {
      setAbaAtiva('trilha')
      return
    }
    setAbaAtiva('jogo')
    void abrirFaseDaApi(faseId, true)
  }

  function alterarArvore(f: (atual: NoPrograma[]) => NoPrograma[]) {
    if (executando) return
    setArvore(f)
    setAvisoEncaixe(null)
  }

  /** Encaixa um item da paleta num destino, respeitando pergunta × corpo. */
  function encaixarItem(item: ItemPaleta, destino: Destino) {
    if (!podeEncaixar(item.categoria, destino.encaixe)) {
      setAvisoEncaixe(
        item.categoria === 'condicao'
          ? 'Sensores e comparações encaixam só na pergunta de uma caixa (se, senão se, enquanto).'
          : 'Ações e caixas encaixam só no corpo. A pergunta recebe apenas um sensor ou uma comparação.',
      )
      return
    }
    if (item.categoria === 'condicao' && destino.encaixe === 'pergunta') {
      alterarArvore((atual) => definirCondicao(atual, destino.perguntaId, item.condicao))
      return
    }
    if (destino.encaixe === 'corpo') {
      const novo = criarNo(item)
      alterarArvore((atual) => inserirNo(atual, destino.listaId, destino.indice, novo))
      // Uma caixa recém-criada já fica pronta para receber a pergunta.
      if (novo.tipo === 'se') setAlvo({ encaixe: 'pergunta', perguntaId: novo.ramos[0].id })
      if (novo.tipo === 'enquanto') setAlvo({ encaixe: 'pergunta', perguntaId: novo.id })
    }
  }

  /** Clique na paleta: insere no alvo selecionado (fim do corpo ou pergunta). */
  function clicarItemPaleta(item: ItemPaleta) {
    if (executando) return
    if (alvo.encaixe === 'pergunta') {
      encaixarItem(item, alvo)
      return
    }
    encaixarItem(item, { encaixe: 'corpo', listaId: alvo.listaId, indice: Number.MAX_SAFE_INTEGER })
  }

  function soltar(destino: Destino, dados: DataTransfer) {
    setArrastando(null)
    if (executando) return
    const idMovido = dados.getData(MIME_NO)
    if (idMovido) {
      if (destino.encaixe === 'corpo') {
        alterarArvore((atual) => moverNo(atual, idMovido, destino.listaId, destino.indice))
      }
      return
    }
    const bruto = dados.getData(MIME_CONDICAO) || dados.getData(MIME_CORPO)
    if (!bruto) return
    try {
      encaixarItem(JSON.parse(bruto) as ItemPaleta, destino)
    } catch {
      // Ignora payload inválido
    }
  }

  const acoesProgramador: AcoesProgramador = {
    soltar,
    selecionarAlvo: (novo) => {
      if (executando) return
      setAlvo(novo)
      setAvisoEncaixe(null)
    },
    remover: (id) => {
      alterarArvore((atual) => removerNo(atual, id))
      setAlvo(ALVO_RAIZ)
    },
    deslocar: (id, delta) => alterarArvore((atual) => deslocarNo(atual, id, delta)),
    retirarCondicao: (perguntaId) => alterarArvore((atual) => definirCondicao(atual, perguntaId, null)),
    adicionarSenaoSe: (seId) => alterarArvore((atual) => adicionarSenaoSe(atual, seId)),
    removerRamo: (seId, ramoId) => {
      alterarArvore((atual) => removerRamo(atual, seId, ramoId))
      setAlvo(ALVO_RAIZ)
    },
    alternarSenao: (seId) => {
      alterarArvore((atual) => alternarSenao(atual, seId))
      setAlvo(ALVO_RAIZ)
    },
    definirVezes: (id, vezes) => alterarArvore((atual) => definirVezes(atual, id, vezes)),
    arrastarNo: (evento, id) => {
      if (executando) return
      evento.dataTransfer.effectAllowed = 'move'
      evento.dataTransfer.setData(MIME_NO, id)
      setArrastando('corpo')
    },
    fimArraste: () => setArrastando(null),
  }

  function iniciarArrasteDaPaleta(evento: DragEvent<HTMLDivElement>, item: ItemPaleta) {
    if (executando) return
    iniciarArrasteItem(evento, item)
    setArrastando(item.categoria === 'condicao' ? 'condicao' : 'corpo')
  }

  function limparProgramador() {
    if (executando) return
    setArvore([])
    setAlvo(ALVO_RAIZ)
    setAvisoEncaixe(null)
    setUltimoResultado(null)
    setRefAtiva(null)
    resetarPosicaoPersonagem()
  }

  function resetarPosicaoPersonagem() {
    if (!tentativaAberta) return
    setPersonagem({
      ...tentativaAberta.inicio,
      posicao: { ...tentativaAberta.inicio.posicao },
      alforje: [...tentativaAberta.inicio.alforje],
    })
  }

  async function executarPlay() {
    if (!podeExecutar || !tentativaAberta || !faseAtual) return

    setExecutando(true)
    setErroApi(null)
    setUltimoResultado(null)
    setRefAtiva(null)
    resetarPosicaoPersonagem()

    try {
      // A árvore enviada preserva o aninhamento de se / enquanto / repetir.
      const resultado = await executarTentativaNaApi(tentativaAberta, paraArvore(arvore))

      // Pausa inicial para o jogador ver o personagem na casa P antes do passo 1
      await new Promise((resolve) => setTimeout(resolve, 260))

      for (const ev of resultado.eventos) {
        setRefAtiva(ev.bloco.ref ?? null)
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
      setRefAtiva(null)
      setUltimoResultado(resultado)

      if (resultado.veredito === 'vitoria') {
        try {
          const progressoAtualizado = await buscarProgressoDoJogador(JOGADOR_LOCAL_ID)
          setFasesConcluidas(progressoAtualizado.fasesConcluidas)
          setTalento(progressoAtualizado.talento)
        } catch {
          setFasesConcluidas((atual) =>
            atual.includes(faseAtual.id) ? atual : [...atual, faseAtual.id],
          )
        }
      }
    } catch (erro) {
      setRefAtiva(null)
      resetarPosicaoPersonagem()
      setErroApi(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível executar o programa: a API não respondeu.',
      )
    } finally {
      setExecutando(false)
    }
  }

  const parouNoMarcoX =
    Boolean(tentativaAberta) &&
    ultimoResultado?.veredito === 'sem_vitoria' &&
    Boolean(
      tentativaAberta?.casas[
        ultimoResultado.personagem.posicao.y * tentativaAberta.largura +
          ultimoResultado.personagem.posicao.x
      ]?.marco,
    )

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
              {faseAtual ? `Fase ${faseAtual.ordem}: ${faseAtual.nome}` : 'Jogo'}
            </button>
            <button
              type="button"
              className={`nav-pill ${abaAtiva === 'trilha' ? 'active' : ''}`}
              onClick={() => setAbaAtiva('trilha')}
            >
              Trilha das Fases
            </button>
          </nav>
        </div>

        <div className="topbar-center">
          <div className="level-stepper" aria-label="Progresso de fases">
            {fases.map((fase) => {
              const concluida = fasesConcluidas.includes(fase.id)
              const jogavel = fasePodeSerJogada(fase, fases, fasesConcluidas)
              const atual = fase.id === faseAtual?.id
              return (
                <button
                  key={fase.id}
                  type="button"
                  disabled={!jogavel}
                  className={`step-dot ${atual ? 'current' : ''} ${concluida ? 'done' : ''} ${
                    !jogavel ? 'locked' : ''
                  }`}
                  onClick={() => selecionarFase(fase.id)}
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
            <strong className="stat-value">{personagem?.vida ?? '—'}</strong>
          </div>
          <div className="hud-stat" title="Atributo variável: Poder de ataque">
            <span className="stat-icon sword">⚔</span>
            <span className="stat-label">Ataque</span>
            <strong className="stat-value">{personagem?.ataque ?? '—'}</strong>
          </div>
          <div className="hud-stat" title="Constante permanente (Fase 11)">
            <span className="stat-icon medal">★</span>
            <span className="stat-label">Talento</span>
            <strong className="stat-value">{talento ?? '—'}</strong>
          </div>
        </div>
      </header>

      {erroApi && (
        <div className="api-error-banner" role="alert">
          <div>
            <strong>Falha ao comunicar com a API</strong>
            <p>{erroApi}</p>
          </div>
          <button
            type="button"
            className="btn-retry"
            onClick={() => {
              if (faseAtual) {
                void abrirFaseDaApi(faseAtual.id, false)
              } else {
                void carregarCatalogoInicial()
              }
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

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
              {faseAtual ? `Voltar para a Fase ${faseAtual.ordem} ▶` : 'Voltar ao jogo ▶'}
            </button>
          </div>

          {carregando && fases.length === 0 ? (
            <div className="api-state-card">Carregando catálogo de fases da API...</div>
          ) : fases.length === 0 ? (
            <div className="api-state-card">
              Nenhuma fase disponível no momento. A tela não usa dados locais quando a API falha.
            </div>
          ) : (
            <div className="roadmap-grid">
              {fases.map((item) => {
                const concluida = fasesConcluidas.includes(item.id)
                const jogavel = fasePodeSerJogada(item, fases, fasesConcluidas)
                return (
                  <article
                    key={item.id}
                    className={`roadmap-card ${jogavel ? 'unlocked' : 'locked'} ${
                      concluida ? 'completed' : ''
                    }`}
                  >
                    <div className="roadmap-card-top">
                      <span className="phase-number">FASE {item.ordem}</span>
                      <span className="concept-chip">{item.conceito}</span>
                    </div>
                    <h2>{item.nome}</h2>
                    <p>{item.descricao}</p>
                    <div className="roadmap-card-footer">
                      {concluida ? (
                        <>
                          <span className="status-tag done">✓ Concluída</span>
                          <button
                            type="button"
                            className="btn-card-open"
                            onClick={() => selecionarFase(item.id)}
                          >
                            Reabrir fase →
                          </button>
                        </>
                      ) : jogavel ? (
                        <button
                          type="button"
                          className="btn-card-open"
                          onClick={() => selecionarFase(item.id)}
                        >
                          Jogar agora →
                        </button>
                      ) : (
                        <span className="status-tag locked">🔒 Conclua a fase {item.ordem - 1}</span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </main>
      ) : !faseAtual || !tentativaAberta || !personagem ? (
        <main className="roadmap-container">
          <div className="api-state-card">
            {carregando ? (
              'Carregando fase e tentativa da API...'
            ) : (
              <>
                <p>
                  Não foi possível abrir a fase na API. A interface não reconstitui a fase com
                  dados locais.
                </p>
                <button
                  type="button"
                  className="btn-primary-play"
                  onClick={() => void carregarCatalogoInicial()}
                >
                  Recarregar da API
                </button>
              </>
            )}
          </div>
        </main>
      ) : (
        /* Workspace principal de 3 colunas inspirado no Coddy + HUD Fase Inicial do Almanak */
        <main className="hud-workspace">
          {/* COLUNA 1: Programador de ações (árvore com caixas aninhadas) */}
          <section className="panel programmer-panel" aria-label="Programador de ações">
            <header className="panel-header">
              <div className="panel-title-group">
                <span className="panel-dot cyan" />
                <h2>Programador de ações</h2>
              </div>
              <div className="panel-meta">
                <span className="step-counter" title="Blocos na folha • limite de passos na execução">
                  {totalBlocos} blocos • {tentativaAberta.limiteDePassos} passos
                </span>
                <button
                  type="button"
                  className="btn-clear"
                  onClick={limparProgramador}
                  disabled={executando || totalBlocos === 0}
                  title="Limpar todos os blocos da folha"
                >
                  Limpar
                </button>
              </div>
            </header>

            <div className="programmer-sheet">
              <Programador
                nos={arvore}
                acoes={acoesProgramador}
                desabilitado={executando}
                refAtiva={refAtiva}
                alvo={alvo}
                arrastando={arrastando}
              />
            </div>

            <footer className="panel-footer">
              {avisoEncaixe ? (
                <span className="footer-note aviso-encaixe" role="alert">
                  ⚠ {avisoEncaixe}
                </span>
              ) : (
                <span className="footer-note">
                  {alvo.encaixe === 'pergunta'
                    ? '❓ Pergunta selecionada: clique num sensor ou comparação da paleta.'
                    : '⚡ Clique numa área de encaixe para escolher onde os blocos clicados entram.'}
                </span>
              )}
            </footer>
          </section>

          {/* COLUNA 2 (Centro): Briefing + Mapa + Botão Play */}
          <section className="panel center-stage" aria-label="Mapa e Execução">
            {/* Card de Missão / Briefing estilo Coddy */}
            <div className="mission-card">
              <div className="mission-header">
                <div className="mission-badges">
                  <span className="badge-phase">
                    FASE {faseAtual.ordem} — {faseAtual.nome.toUpperCase()}
                  </span>
                  <span className="badge-concept">Conceito: {faseAtual.conceito}</span>
                  {neblinaAtiva && <span className="badge-fog">☁ Neblina de Guerra</span>}
                </div>
                {faseConcluida && <span className="badge-solved">✓ Fase Dominada</span>}
              </div>
              <p className="mission-description">{faseAtual.enunciado}</p>
              {faseAtual.dicaTutorial.trim().length > 0 && (
                <div className="mission-tip">
                  <strong>Dica da Fase:</strong> {faseAtual.dicaTutorial}
                </div>
              )}
            </div>

            {/* Palco do Mapa */}
            <div className="map-viewport">
              <div className="map-header-bar">
                <div className="map-header-left">
                  <span className="map-title">Mapa da Tentativa</span>
                  <span className="map-seed-badge" title="Semente devolvida pelo servidor para esta tentativa">
                    Semente #{tentativaAberta.semente}
                  </span>
                  {temSorteioNaFase && (
                    <button
                      type="button"
                      className="btn-reroll-seed"
                      disabled={executando}
                      onClick={() => void abrirNovaTentativa(faseAtual, sementeAtual + 1, false)}
                      title="Abrir nova tentativa no servidor com novo sorteio"
                    >
                      🎲 Novo sorteio
                    </button>
                  )}
                </div>
                <span className="map-coords">
                  Posição: ({personagem.posicao.x}, {personagem.posicao.y})
                  {mostrarOlhar && (
                    <>
                      {' '}
                      • Olhar: <strong>{personagem.olhar}</strong>
                    </>
                  )}
                </span>
              </div>

              <TabuleiroMapa
                tentativa={tentativaAberta}
                personagem={personagem}
                executando={executando}
                mostrarOlhar={mostrarOlhar}
                neblinaAtiva={neblinaAtiva}
              />

              {/* Área de Controle Principal: Botão Play circular + Status */}
              <div className="play-control-bar">
                <button
                  type="button"
                  className={`play-circle-btn ${executando ? 'running' : ''}`}
                  onClick={executarPlay}
                  disabled={!podeExecutar}
                  aria-label="Botão Play: Iniciar a execução da sequência montada"
                >
                  <span className="play-triangle" aria-hidden="true">
                    {executando ? '•••' : '▶'}
                  </span>
                </button>
                <div className="play-caption">
                  <strong>{executando ? 'Executando sequência...' : 'Botão Play'}</strong>
                  <span>
                    {totalBlocos === 0
                      ? 'Adicione pelo menos 1 bloco ao Programador de ações para habilitar o Play.'
                      : vazias > 0
                        ? `Encaixe um sensor em ${vazias} pergunta(s) vazia(s) para habilitar o Play.`
                        : 'Inicia a execução da árvore montada, um passo por ação.'}
                  </span>
                </div>
              </div>
            </div>

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
              Arraste até o <strong>Programador de ações</strong> ou clique para inserir no encaixe
              selecionado. Ações e caixas vão no corpo; sensores e comparações vão na pergunta.
            </p>

            <div className="palette-list">
              {(['acao', 'caixa', 'condicao'] as const).map((categoria) => {
                const itens = paleta.filter((item) => item.categoria === categoria)
                if (itens.length === 0) return null
                const titulo =
                  categoria === 'acao'
                    ? 'Ações • corpo'
                    : categoria === 'caixa'
                      ? 'Caixas • corpo'
                      : 'Sensores e comparações • pergunta'
                return (
                  <div className="palette-grupo" key={categoria}>
                    <h3 className="palette-grupo-titulo">{titulo}</h3>
                    {itens.map((item) => {
                      const chave =
                        item.categoria === 'acao'
                          ? JSON.stringify(item.bloco)
                          : item.categoria === 'caixa'
                            ? item.caixa
                            : chaveCondicao(item.condicao)
                      const icone =
                        item.categoria === 'acao'
                          ? iconeBloco(item.bloco)
                          : item.categoria === 'caixa'
                            ? item.caixa === 'se'
                              ? '⑂'
                              : '⟳'
                            : '?'
                      const rotulo =
                        item.categoria === 'acao'
                          ? rotuloBloco(item.bloco)
                          : item.categoria === 'caixa'
                            ? rotuloCaixa(item.caixa)
                            : rotuloCondicao(item.condicao)
                      const meta =
                        item.categoria === 'acao'
                          ? 'Ação • 1 passo'
                          : item.categoria === 'caixa'
                            ? 'Caixa • envolve outros blocos'
                            : item.condicao.tipo === 'comparacao'
                              ? 'Comparação • verdadeiro ou falso'
                              : 'Sensor • verdadeiro ou falso'
                      return (
                        <div
                          key={chave}
                          draggable={!executando}
                          onDragStart={(e) => iniciarArrasteDaPaleta(e, item)}
                          onDragEnd={() => setArrastando(null)}
                          onClick={() => clicarItemPaleta(item)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              clicarItemPaleta(item)
                            }
                          }}
                          role="button"
                          tabIndex={executando ? -1 : 0}
                          aria-disabled={executando}
                          className={`palette-block categoria-${item.categoria} ${
                            executando ? 'disabled' : ''
                          }`}
                        >
                          <span className="palette-block-arrow" aria-hidden="true">
                            {icone}
                          </span>
                          <div className="palette-block-info">
                            <span className="palette-block-title">{rotulo}</span>
                            <span className="palette-block-meta">{meta}</span>
                          </div>
                          <span className="palette-block-add" title="Adicionar ao programador">
                            +
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
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
