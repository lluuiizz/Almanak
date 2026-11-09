import type { Bloco, Fase, FaseResumo, Resultado, Veredito } from './tipos'

export const FASE_1: Fase = {
  id: 'fase-1',
  ordem: 1,
  nome: 'Tutorial',
  conceito: 'Sequência',
  enunciado:
    'Player, o seu objetivo é chegar até o quadrado escrito Destino. Para isso você dispõe das seguintes ações: mover-se à direita, mover-se à esquerda, mover-se para cima/baixo. Arraste os blocos de ações para o "Programador de ações" e aperte o botão de Play para que inicie a sequência.',
  dicaTutorial:
    'Um único bloco "mover-se à direita" faz o personagem dar um passo e parar no marco X. Coloque dois blocos "mover-se à direita" e aperte Play para alcançar o Destino!',
  largura: 3,
  altura: 1,
  casas: [{ tipo: 'vazio' }, { tipo: 'vazio', marco: true }, { tipo: 'destino' }],
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
  limiteDePassos: 8,
  condicaoDeVitoria: 'chegar_no_destino',
}

export const CATALOGO_FASES: FaseResumo[] = [
  {
    id: 'fase-1',
    ordem: 1,
    nome: 'Tutorial',
    conceito: 'Sequência',
    porQueEntraAqui: 'Um e dois passos até o destino.',
    disponivel: true,
  },
  {
    id: 'fase-2',
    ordem: 2,
    nome: 'A curva',
    conceito: 'Ordem',
    porQueEntraAqui: 'A sequência fica longa e a ordem passa a importar.',
    disponivel: false,
  },
  {
    id: 'fase-3',
    ordem: 3,
    nome: 'O muro',
    conceito: 'se e sensor',
    porQueEntraAqui: 'A reta está fechada; é preciso perguntar antes de andar.',
    disponivel: false,
  },
  {
    id: 'fase-4',
    ordem: 4,
    nome: 'O portão',
    conceito: 'senão',
    porQueEntraAqui: 'A mesma fase tem duas configurações.',
    disponivel: false,
  },
  {
    id: 'fase-5',
    ordem: 5,
    nome: 'O corredor cego',
    conceito: 'enquanto',
    porQueEntraAqui: 'O tamanho muda; o laço relê "existe parede à frente?".',
    disponivel: false,
  },
  {
    id: 'fase-6',
    ordem: 6,
    nome: 'A patrulha',
    conceito: 'se dentro de enquanto',
    porQueEntraAqui: 'O guarda aparece num ponto sorteado.',
    disponivel: false,
  },
  {
    id: 'fase-7',
    ordem: 7,
    nome: 'A escada',
    conceito: 'repetir N vezes',
    porQueEntraAqui: 'O motivo se repete um número visível de vezes.',
    disponivel: false,
  },
  {
    id: 'fase-8',
    ordem: 8,
    nome: 'Três alcovas',
    conceito: 'Rotina',
    porQueEntraAqui: 'A mesma sequência ganha um nome e é chamada.',
    disponivel: false,
  },
  {
    id: 'fase-9',
    ordem: 9,
    nome: 'A porta lacrada',
    conceito: 'Variável, comparação',
    porQueEntraAqui: 'Vida e ataque mudam, e a porta lê o valor.',
    disponivel: false,
  },
  {
    id: 'fase-10',
    ordem: 10,
    nome: 'O alforje',
    conceito: 'Array',
    porQueEntraAqui: 'A chave ocupa uma posição sorteada na bolsa.',
    disponivel: false,
  },
  {
    id: 'fase-11',
    ordem: 11,
    nome: 'O talento',
    conceito: 'Constante',
    porQueEntraAqui: 'Um atributo permanente entra na conta e não se reatribui.',
    disponivel: false,
  },
  {
    id: 'fase-12',
    ordem: 12,
    nome: 'A encruzilhada',
    conceito: 'e, ou',
    porQueEntraAqui: 'A decisão depende de mais de um booleano ao mesmo tempo.',
    disponivel: false,
  },
]

const tentativasAbertas = new Map<string, string>()

export function urlDaApi(): string {
  const configurada = import.meta.env.VITE_API_URL as string | undefined
  const base = configurada && configurada.length > 0 ? configurada : 'http://localhost:3000'
  return base.replace(/\/$/, '')
}

export async function executarProgramaNaFase(
  fase: Fase,
  programa: Bloco[],
  jaReabriu = false,
): Promise<Resultado> {
  const apiUrl = urlDaApi()
  let tentativaId = tentativasAbertas.get(fase.id)

  if (!tentativaId) {
    const abertura = await enviar(`${apiUrl}/fases/${fase.id}/tentativas`, {})
    if (!abertura.ok) {
      throw new Error(await mensagemDeErro(abertura, 'Não foi possível abrir a tentativa.'))
    }
    const criada = (await abertura.json()) as { id?: string }
    if (!criada.id) {
      throw new Error('A API não devolveu o id da tentativa.')
    }
    tentativaId = criada.id
    tentativasAbertas.set(fase.id, tentativaId)
  }

  const resposta = await enviar(`${apiUrl}/tentativas/${tentativaId}/execucoes`, { programa })
  if (resposta.status === 404 && !jaReabriu) {
    tentativasAbertas.delete(fase.id)
    return executarProgramaNaFase(fase, programa, true)
  }
  if (!resposta.ok) {
    throw new Error(await mensagemDeErro(resposta, 'O servidor recusou o programa.'))
  }
  return (await resposta.json()) as Resultado
}

async function enviar(url: string, corpo: unknown): Promise<Response> {
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    })
  } catch {
    throw new Error('O servidor não respondeu. A vitória só é decidida pela API.')
  }
}

async function mensagemDeErro(resposta: Response, reserva: string): Promise<string> {
  try {
    const corpo = (await resposta.json()) as { mensagem?: string }
    return corpo.mensagem ?? reserva
  } catch {
    return reserva
  }
}

export function rotuloBloco(bloco: Bloco): string {
  if (bloco.tipo === 'mover') {
    const mapa = {
      esquerda: 'Mover-se à esquerda',
      direita: 'Mover-se à direita',
      cima: 'Mover-se para cima',
      baixo: 'Mover-se para baixo',
    }
    return mapa[bloco.direcao]
  }
  if (bloco.tipo === 'virar') {
    return bloco.sentido === 'esquerda' ? 'Virar à esquerda' : 'Virar à direita'
  }
  if (bloco.tipo === 'avancar') return 'Avançar'
  if (bloco.tipo === 'atacar') return 'Atacar'
  return 'Pegar'
}

export function iconeBloco(bloco: Bloco): string {
  if (bloco.tipo === 'mover') {
    const setas = {
      esquerda: '←',
      direita: '→',
      cima: '↑',
      baixo: '↓',
    }
    return setas[bloco.direcao]
  }
  if (bloco.tipo === 'virar') return bloco.sentido === 'esquerda' ? '↶' : '↷'
  if (bloco.tipo === 'avancar') return '▲'
  if (bloco.tipo === 'atacar') return '⚔'
  return '✦'
}

export function mensagemVeredito(veredito: Veredito, parouNoMarcoX: boolean): {
  titulo: string
  detalhe: string
  tom: 'sucesso' | 'erro' | 'aviso'
} {
  switch (veredito) {
    case 'vitoria':
      return {
        titulo: 'Fase concluída! Você chegou ao Destino!',
        detalhe:
          'Você montou um algoritmo sequencial de dois passos à direita e conduziu o personagem até o destino.',
        tom: 'sucesso',
      }
    case 'parede':
      return {
        titulo: 'Tentativa encerrada: bateu no limite ou parede!',
        detalhe:
          'O personagem tentou sair do corredor ou bateu numa parede e voltou ao início da fase. Sua sequência continua intacta no Programador de ações para você corrigir.',
        tom: 'erro',
      }
    case 'inimigo':
      return {
        titulo: 'Tentativa encerrada: colisão com inimigo!',
        detalhe:
          'Avançar direto contra um inimigo encerra a tentativa. O personagem voltou ao início para você ajustar o programa.',
        tom: 'erro',
      }
    case 'vida_zerada':
      return {
        titulo: 'Tentativa encerrada: vida chegou a 0!',
        detalhe: 'O personagem perdeu toda a vida e retornou ao início da fase.',
        tom: 'erro',
      }
    case 'limite_de_passos':
      return {
        titulo: 'Tentativa encerrada: limite de passos atingido!',
        detalhe:
          'A sequência excedeu o limite de passos da fase (repetição sem fim). O personagem voltou ao início.',
        tom: 'erro',
      }
    case 'sem_vitoria':
    default:
      if (parouNoMarcoX) {
        return {
          titulo: 'Quase lá! Você parou no marco intermediário (X).',
          detalhe:
            'Um único bloco "Mover-se à direita" leva o personagem até o X. Adicione um segundo bloco "Mover-se à direita" no Programador de ações e aperte Play!',
          tom: 'aviso',
        }
      }
      return {
        titulo: 'Sequência finalizada antes do Destino.',
        detalhe:
          'Os blocos terminaram de executar, mas o personagem ainda não alcançou o quadrado Destino. Ajuste os blocos no Programador de ações e tente novamente!',
        tom: 'aviso',
      }
  }
}

