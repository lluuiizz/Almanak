import {
  FASE_1,
  FASE_3,
  FASE_4,
  FASE_5,
  interpretarArvore,
  sortearTentativaDaFase,
} from './src/dadosFase1.ts'

const FASE_2_CURVA = {
  id: 'fase-2',
  ordem: 2,
  nome: 'A curva',
  conceito: 'Ordem',
  enunciado:
    'Mapa em L. Ainda só sequência, agora longa o bastante para a ordem dos movimentos importar.',
  dicaTutorial: 'Siga à direita até o canto e depois desça até o Destino.',
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
  blocosLiberados: [
    { tipo: 'mover', direcao: 'esquerda' },
    { tipo: 'mover', direcao: 'direita' },
    { tipo: 'mover', direcao: 'cima' },
    { tipo: 'mover', direcao: 'baixo' },
  ],
  inicio: {
    posicao: { x: 0, y: 0 },
    olhar: 'leste',
    vida: 1,
    ataque: 1,
    alforje: [],
  },
  limiteDePassos: 10,
  condicaoDeVitoria: 'chegar_no_destino',
}

const FASES_MOCK = [FASE_1, FASE_2_CURVA, FASE_3, FASE_4, FASE_5]

function lerCorpoJson(req) {
  return new Promise((resolve) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const texto = Buffer.concat(chunks).toString('utf-8')
        resolve(texto ? JSON.parse(texto) : {})
      } catch {
        resolve({})
      }
    })
  })
}

function enviarJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function blocosParaApi(fase) {
  return [
    ...fase.blocosLiberados,
    ...(fase.caixasLiberadas ?? []).map((tipo) => ({ tipo })),
    ...(fase.condicoesLiberadas ?? []).map((cond) =>
      cond.tipo === 'sensor' ? { tipo: 'sensor', nome: cond.sensor } : cond,
    ),
  ]
}

export function mockApiPlugin() {
  const progressoPorJogador = new Map()
  const tentativasPorId = new Map()
  let seqTentativa = 0

  function obterProgresso(jogadorId) {
    let prog = progressoPorJogador.get(jogadorId)
    if (!prog) {
      prog = { fasesConcluidas: [], talento: null }
      progressoPorJogador.set(jogadorId, prog)
    }
    return prog
  }

  return {
    name: 'almanak-mock-api',
    configureServer(server) {
      server.middlewares.use('/__mock_api', async (req, res, next) => {
        const metodo = req.method ?? 'GET'
        const caminho = (req.url ?? '/').split('?')[0]

        if (metodo === 'GET' && caminho === '/fases') {
          enviarJson(
            res,
            200,
            FASES_MOCK.map((f) => ({
              id: f.id,
              ordem: f.ordem,
              nome: f.nome,
              conceito: f.conceito,
              descricao: f.enunciado,
              limiteDePassos: f.limiteDePassos,
              temNeblina: Boolean(f.temNeblina),
              blocosLiberados: blocosParaApi(f),
            })),
          )
          return
        }

        const matchFase = caminho.match(/^\/fases\/([^/]+)$/)
        if (metodo === 'GET' && matchFase) {
          const fase = FASES_MOCK.find((f) => f.id === decodeURIComponent(matchFase[1]))
          if (!fase) {
            enviarJson(res, 404, { erro: 'Fase não encontrada' })
            return
          }
          enviarJson(res, 200, {
            id: fase.id,
            ordem: fase.ordem,
            nome: fase.nome,
            conceito: fase.conceito,
            enunciado: fase.enunciado,
            dica: fase.dicaTutorial,
            largura: fase.largura,
            altura: fase.altura,
            casas: fase.casas,
            inicio: fase.inicio,
            limiteDePassos: fase.limiteDePassos,
            temNeblina: Boolean(fase.temNeblina),
            exibirOlhar: fase.exibirOlhar,
            blocosLiberados: blocosParaApi(fase),
          })
          return
        }

        const matchTentativa = caminho.match(/^\/fases\/([^/]+)\/tentativas$/)
        if (metodo === 'POST' && matchTentativa) {
          const fase = FASES_MOCK.find((f) => f.id === decodeURIComponent(matchTentativa[1]))
          if (!fase) {
            enviarJson(res, 404, { erro: 'Fase não encontrada' })
            return
          }
          const body = await lerCorpoJson(req)
          const semente = typeof body.semente === 'number' ? body.semente : 1
          const tentativa = sortearTentativaDaFase(fase, semente, [])
          seqTentativa += 1
          const id = `mock-tentativa-${seqTentativa}`
          const comId = { ...tentativa, id }
          tentativasPorId.set(id, comId)
          enviarJson(res, 201, {
            id,
            semente: comId.semente,
            faseId: comId.faseId,
            estadoInicial: {
              largura: comId.largura,
              altura: comId.altura,
              casas: comId.casas,
              personagem: comId.inicio,
              limiteDePassos: comId.limiteDePassos,
              temNeblina: Boolean(comId.temNeblina),
            },
          })
          return
        }

        const matchExecutar = caminho.match(/^\/fases\/([^/]+)\/executar$/)
        if (metodo === 'POST' && matchExecutar) {
          const faseId = decodeURIComponent(matchExecutar[1])
          const fase = FASES_MOCK.find((f) => f.id === faseId)
          if (!fase) {
            enviarJson(res, 404, { erro: 'Fase não encontrada' })
            return
          }
          const body = await lerCorpoJson(req)
          const programa = Array.isArray(body.programa) ? body.programa : []
          const tentativaId = typeof body.tentativaId === 'string' ? body.tentativaId : undefined
          const semente = typeof body.semente === 'number' ? body.semente : 1
          const jogadorId =
            typeof body.jogadorId === 'string'
              ? body.jogadorId
              : '00000000-0000-0000-0000-000000000001'

          const tentativa =
            (tentativaId ? tentativasPorId.get(tentativaId) : undefined) ??
            sortearTentativaDaFase(fase, semente, programa)

          const resultado = interpretarArvore(tentativa, programa, tentativa.inicio)
          if (resultado.veredito === 'vitoria') {
            const prog = obterProgresso(jogadorId)
            if (!prog.fasesConcluidas.includes(faseId)) {
              prog.fasesConcluidas.push(faseId)
            }
          }
          enviarJson(res, 200, resultado)
          return
        }

        const matchProgresso = caminho.match(/^\/jogadores\/([^/]+)\/progresso$/)
        if (metodo === 'GET' && matchProgresso) {
          const jogadorId = decodeURIComponent(matchProgresso[1])
          enviarJson(res, 200, obterProgresso(jogadorId))
          return
        }

        next()
      })
    },
  }
}
