import type { Bloco, Casa, Direcao, Fase, Personagem, Posicao, Tentativa } from './tipos'

export interface RepresentacaoCasa {
  chaveVisual:
    | 'jogador'
    | 'marco'
    | 'destino'
    | 'parede'
    | 'portao'
    | 'inimigo'
    | 'bau'
    | 'porta'
    | 'espinhos'
    | 'armadilha'
    | 'vazio'
  classeCss: string
  icone: string
  rotulo: string
  legenda: string
  detalhe?: string
}

/**
 * Determina se o olhar do personagem deve ser exibido na fase atual.
 * Critério de aceite: "O olhar do personagem aparece a partir da fase em que virar existe."
 * No README, o olhar nasce na fase 3 (O muro) / quando os blocos `virar` existem na paleta
 * ou a partir da fase em que virar é introduzido.
 */
export function faseMostraOlhar(
  faseOuBlocos: Pick<Fase, 'ordem' | 'blocosLiberados' | 'exibirOlhar'> | Bloco[],
): boolean {
  if (Array.isArray(faseOuBlocos)) {
    return faseOuBlocos.some((bloco) => bloco.tipo === 'virar')
  }
  if (typeof faseOuBlocos.exibirOlhar === 'boolean') {
    return faseOuBlocos.exibirOlhar
  }
  if (faseOuBlocos.blocosLiberados.some((bloco) => bloco.tipo === 'virar')) {
    return true
  }
  // A partir da fase 3 ("O muro") o personagem passa a ter um olhar e blocos de giro/avançar entram na progressão
  return faseOuBlocos.ordem >= 3
}

/**
 * Determina se uma fase ou tentativa tem neblina ativa (Fase 5 — O corredor cego).
 */
export function tentativaTemNeblina(
  faseIdOuOrdem: string | number,
  temNeblinaExplicita?: boolean,
): boolean {
  if (typeof temNeblinaExplicita === 'boolean') {
    return temNeblinaExplicita
  }
  if (typeof faseIdOuOrdem === 'number') {
    return faseIdOuOrdem === 5
  }
  return faseIdOuOrdem === 'fase-5'
}

/**
 * Verifica se duas posições são a mesma casa ou vizinhas no mapa.
 * Critério de aceite: "Na fase 5 só a casa atual e as vizinhas ficam visíveis.
 * O resto permanece encoberto enquanto o personagem não se aproxima."
 */
export function ehCasaAtualOuVizinha(origem: Posicao, alvo: Posicao): boolean {
  const dx = Math.abs(origem.x - alvo.x)
  const dy = Math.abs(origem.y - alvo.y)
  return dx + dy <= 1
}

/**
 * Calcula o conjunto de chaves `"x,y"` visíveis para o personagem.
 * Quando `neblinaAtiva` é verdadeiro (Fase 5), apenas a casa atual e suas vizinhas
 * diretas (ou visitadas ao se aproximar) ficam visíveis.
 */
export function casaVisivelNaNeblina(
  posicaoJogador: Posicao,
  posicaoCasa: Posicao,
  neblinaAtiva: boolean,
  casasReveladas?: ReadonlySet<string>,
): boolean {
  if (!neblinaAtiva) return true
  if (ehCasaAtualOuVizinha(posicaoJogador, posicaoCasa)) return true
  if (casasReveladas && casasReveladas.has(`${posicaoCasa.x},${posicaoCasa.y}`)) return true
  return false
}

export function iconeOlhar(olhar: Direcao): string {
  const mapa: Record<Direcao, string> = {
    norte: '▲',
    leste: '▶',
    sul: '▼',
    oeste: '◀',
  }
  return mapa[olhar]
}

/**
 * Devolve uma representação visual distinta para cada elemento do mapa citado na issue:
 * - casa do jogador
 * - marco X
 * - destino
 * - paredes
 * - portão
 * - inimigo
 * - baú (item / bau)
 * - porta
 * - espinhos
 * - armadilha
 */
export function obterRepresentacaoCasa(
  casa: Casa,
  opcoes: { temJogador: boolean; ehInicio: boolean },
): RepresentacaoCasa {
  if (opcoes.temJogador) {
    return {
      chaveVisual: 'jogador',
      classeCss: 'cell-active cell-type-jogador',
      icone: 'P',
      rotulo: 'Player',
      legenda: 'Casa do Jogador',
    }
  }

  if (casa.marco) {
    return {
      chaveVisual: 'marco',
      classeCss: 'cell-checkpoint cell-type-marco',
      icone: 'X',
      rotulo: 'X',
      legenda: 'Marco (X)',
    }
  }

  switch (casa.tipo) {
    case 'destino':
      return {
        chaveVisual: 'destino',
        classeCss: 'cell-goal cell-type-destino',
        icone: '⚑',
        rotulo: 'Destino',
        legenda: 'Objetivo',
      }

    case 'parede':
      return {
        chaveVisual: 'parede',
        classeCss: 'cell-wall cell-type-parede',
        icone: '█',
        rotulo: 'Parede',
        legenda: 'Parede / Muro',
      }

    case 'portao': {
      const aberto = casa.aberto === true
      return {
        chaveVisual: 'portao',
        classeCss: `cell-gate cell-type-portao ${aberto ? 'gate-open' : 'gate-closed'}`,
        icone: aberto ? '∏' : '╬',
        rotulo: aberto ? 'Portão aberto' : 'Portão fechado',
        legenda: 'Portão',
        detalhe: aberto ? 'Passagem livre' : 'Bloqueado',
      }
    }

    case 'inimigo':
      return {
        chaveVisual: 'inimigo',
        classeCss: 'cell-enemy cell-type-inimigo',
        icone: '☠',
        rotulo: 'Inimigo',
        legenda: casa.resistencia ? `Guardião (Res. ${casa.resistencia})` : 'Guarda / Inimigo',
      }

    case 'bau':
    case 'item':
      return {
        chaveVisual: 'bau',
        classeCss: 'cell-chest cell-type-bau',
        icone: '❖',
        rotulo: casa.conteudo ? `Baú (${casa.conteudo})` : 'Baú',
        legenda: 'Baú / Item',
        detalhe: casa.conteudo,
      }

    case 'porta':
      return {
        chaveVisual: 'porta',
        classeCss: 'cell-door cell-type-porta',
        icone: '⛩',
        rotulo: 'Porta',
        legenda: casa.resistencia ? `Porta lacrada (Res. ${casa.resistencia})` : 'Porta lacrada',
      }

    case 'espinhos':
      return {
        chaveVisual: 'espinhos',
        classeCss: 'cell-spikes cell-type-espinhos',
        icone: '▲▲',
        rotulo: 'Espinhos',
        legenda: casa.dano ? `Espinhos (-${casa.dano} vida)` : 'Espinhos',
      }

    case 'armadilha':
      return {
        chaveVisual: 'armadilha',
        classeCss: 'cell-trap cell-type-armadilha',
        icone: '⊗',
        rotulo: 'Armadilha',
        legenda: casa.dano ? `Armadilha (-${casa.dano} vida)` : 'Armadilha',
      }

    case 'vazio':
    default:
      return {
        chaveVisual: 'vazio',
        classeCss: 'cell-empty cell-type-vazio',
        icone: opcoes.ehInicio ? '◎' : '·',
        rotulo: opcoes.ehInicio ? 'Início' : '',
        legenda: opcoes.ehInicio ? 'Posição Inicial' : 'Caminho',
      }
  }
}

interface TabuleiroMapaProps {
  tentativa: Tentativa
  personagem: Personagem
  executando: boolean
  mostrarOlhar: boolean
  neblinaAtiva: boolean
  casasReveladas?: ReadonlySet<string>
}

export function TabuleiroMapa({
  tentativa,
  personagem,
  executando,
  mostrarOlhar,
  neblinaAtiva,
  casasReveladas,
}: TabuleiroMapaProps) {
  return (
    <div
      className="map-board"
      role="region"
      aria-label={`Tabuleiro da fase ${tentativa.faseId}`}
      data-fase-id={tentativa.faseId}
      data-semente={tentativa.semente}
      data-neblina={neblinaAtiva ? 'ativa' : 'inativa'}
    >
      <div
        className="map-grid"
        data-largura={tentativa.largura}
        data-altura={tentativa.altura}
        style={{
          gridTemplateColumns: `repeat(${tentativa.largura}, minmax(108px, 150px))`,
          gridTemplateRows: `repeat(${tentativa.altura}, minmax(108px, auto))`,
        }}
      >
        {tentativa.casas.map((casa, idx) => {
          const x = idx % tentativa.largura
          const y = Math.floor(idx / tentativa.largura)
          const posCasa = { x, y }
          const temJogador = personagem.posicao.x === x && personagem.posicao.y === y
          const ehInicio = tentativa.inicio.posicao.x === x && tentativa.inicio.posicao.y === y
          const visivel = casaVisivelNaNeblina(
            personagem.posicao,
            posCasa,
            neblinaAtiva,
            casasReveladas,
          )

          if (!visivel) {
            return (
              <div
                key={`${x}-${y}`}
                className="map-cell cell-fog"
                data-coord={`${x},${y}`}
                data-tipo-visual="neblina"
                aria-label={`Casa (${x}, ${y}) encoberta pela neblina`}
              >
                <span className="cell-coord">
                  ({x}, {y})
                </span>
                <div className="cell-center">
                  <div className="fog-cloud" title="Encoberto pela neblina">
                    <span className="fog-icon" aria-hidden="true">
                      ☁
                    </span>
                    <span className="fog-label">Neblina</span>
                  </div>
                </div>
                <span className="cell-caption">Encoberto</span>
              </div>
            )
          }

          const rep = obterRepresentacaoCasa(casa, { temJogador, ehInicio })

          return (
            <div
              key={`${x}-${y}`}
              className={`map-cell ${rep.classeCss}`}
              data-coord={`${x},${y}`}
              data-tipo-visual={rep.chaveVisual}
            >
              <span className="cell-coord">
                casa {idx + 1} ({x},{y})
              </span>

              <div className="cell-center">
                {temJogador ? (
                  <div
                    className={`player-token ${
                      mostrarOlhar ? `facing-${personagem.olhar} with-gaze` : 'without-gaze'
                    } ${executando ? 'walking' : ''}`}
                    data-olhar={mostrarOlhar ? personagem.olhar : 'oculto'}
                  >
                    <div className="player-avatar">
                      {mostrarOlhar ? (
                        <span
                          className="player-eyes"
                          title={`Olhar: ${personagem.olhar}`}
                          aria-label={`Olhar para ${personagem.olhar}`}
                        />
                      ) : (
                        <span className="player-core" aria-hidden="true">
                          P
                        </span>
                      )}
                    </div>
                    <span className="player-tag">
                      Player {mostrarOlhar ? iconeOlhar(personagem.olhar) : ''}
                    </span>
                  </div>
                ) : (
                  <div className={`tile-token token-${rep.chaveVisual}`}>
                    {rep.chaveVisual === 'marco' && (
                      <span className="checkpoint-mark" title="Marco intermediário (X)">
                        X
                      </span>
                    )}

                    {rep.chaveVisual === 'destino' && (
                      <div className="goal-flag">
                        <span className="goal-icon" aria-hidden="true">
                          {rep.icone}
                        </span>
                        <span className="goal-text">{rep.rotulo}</span>
                      </div>
                    )}

                    {rep.chaveVisual === 'parede' && (
                      <div className="tile-badge tile-wall" title="Parede intransponível">
                        <span className="tile-symbol" aria-hidden="true">
                          {rep.icone}
                        </span>
                        <span className="tile-label">{rep.rotulo}</span>
                      </div>
                    )}

                    {rep.chaveVisual === 'portao' && (
                      <div className="tile-badge tile-gate" title={rep.rotulo}>
                        <span className="tile-symbol" aria-hidden="true">
                          {rep.icone}
                        </span>
                        <span className="tile-label">{rep.rotulo}</span>
                      </div>
                    )}

                    {rep.chaveVisual === 'inimigo' && (
                      <div className="tile-badge tile-enemy" title="Inimigo no caminho">
                        <span className="tile-symbol" aria-hidden="true">
                          {rep.icone}
                        </span>
                        <span className="tile-label">{rep.rotulo}</span>
                      </div>
                    )}

                    {rep.chaveVisual === 'bau' && (
                      <div className="tile-badge tile-chest" title="Baú com item ou bônus">
                        <span className="tile-symbol" aria-hidden="true">
                          {rep.icone}
                        </span>
                        <span className="tile-label">{rep.rotulo}</span>
                      </div>
                    )}

                    {rep.chaveVisual === 'porta' && (
                      <div className="tile-badge tile-door" title="Porta lacrada">
                        <span className="tile-symbol" aria-hidden="true">
                          {rep.icone}
                        </span>
                        <span className="tile-label">{rep.rotulo}</span>
                      </div>
                    )}

                    {rep.chaveVisual === 'espinhos' && (
                      <div className="tile-badge tile-spikes" title="Espinhos causam dano">
                        <span className="tile-symbol" aria-hidden="true">
                          {rep.icone}
                        </span>
                        <span className="tile-label">{rep.rotulo}</span>
                      </div>
                    )}

                    {rep.chaveVisual === 'armadilha' && (
                      <div className="tile-badge tile-trap" title="Armadilha no piso">
                        <span className="tile-symbol" aria-hidden="true">
                          {rep.icone}
                        </span>
                        <span className="tile-label">{rep.rotulo}</span>
                      </div>
                    )}

                    {rep.chaveVisual === 'vazio' && ehInicio && (
                      <span className="start-ghost">Início</span>
                    )}
                  </div>
                )}
              </div>

              <span className="cell-caption">{rep.legenda}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
