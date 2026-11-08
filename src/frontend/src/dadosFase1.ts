import type {
  Bloco,
  Casa,
  Direcao,
  Evento,
  Fase,
  FaseResumo,
  Personagem,
  Posicao,
  Resultado,
  Veredito,
} from './tipos'

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

const ORDEM: Direcao[] = ['norte', 'leste', 'sul', 'oeste']

const PASSO: Record<Direcao, Posicao> = {
  norte: { x: 0, y: -1 },
  leste: { x: 1, y: 0 },
  sul: { x: 0, y: 1 },
  oeste: { x: -1, y: 0 },
}

const MOVIMENTO_PARA_OLHAR = {
  cima: 'norte',
  direita: 'leste',
  baixo: 'sul',
  esquerda: 'oeste',
} as const

function clonarPersonagem(p: Personagem): Personagem {
  return {
    ...p,
    posicao: { ...p.posicao },
    alforje: [...p.alforje],
  }
}

function dentro(pos: Posicao, largura: number, altura: number): boolean {
  return pos.x >= 0 && pos.y >= 0 && pos.x < largura && pos.y < altura
}

function casaEm(fase: Fase, pos: Posicao): Casa {
  return fase.casas[pos.y * fase.largura + pos.x]
}

function girar(olhar: Direcao, sentido: 'esquerda' | 'direita'): Direcao {
  const idx = ORDEM.indexOf(olhar)
  const delta = sentido === 'direita' ? 1 : -1
  return ORDEM[(idx + delta + ORDEM.length) % ORDEM.length]
}

function andar(
  personagem: Personagem,
  direcao: Direcao,
  fase: Fase,
): { personagem: Personagem; veredito?: Veredito } {
  const delta = PASSO[direcao]
  const alvo = {
    x: personagem.posicao.x + delta.x,
    y: personagem.posicao.y + delta.y,
  }
  const virado = { ...clonarPersonagem(personagem), olhar: direcao }

  if (!dentro(alvo, fase.largura, fase.altura)) {
    return { personagem: virado, veredito: 'parede' }
  }

  const casa = casaEm(fase, alvo)
  if (casa.tipo === 'parede') {
    return { personagem: virado, veredito: 'parede' }
  }
  if (casa.tipo === 'inimigo') {
    return { personagem: virado, veredito: 'inimigo' }
  }

  const avancou = { ...virado, posicao: alvo }
  if (casa.tipo === 'destino') {
    return { personagem: avancou, veredito: 'vitoria' }
  }

  return { personagem: avancou }
}

/**
 * Executa o programa enviado pelo jogador.
 * Caso VITE_API_URL esteja definida e acessível, envia para o backend;
 * caso contrário, usa o contrato idêntico a src/backend/src/motor.ts.
 */
export async function executarProgramaNaFase(
  fase: Fase,
  programa: Bloco[],
): Promise<Resultado> {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined
  if (apiUrl) {
    try {
      const resposta = await fetch(`${apiUrl}/fases/${fase.id}/executar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programa }),
      })
      if (resposta.ok) {
        return (await resposta.json()) as Resultado
      }
    } catch {
      // Fallback para simulação fiel ao contrato do backend enquanto a API HTTP não está ativa
    }
  }

  const inicio = clonarPersonagem(fase.inicio)
  let personagem = clonarPersonagem(fase.inicio)
  const eventos: Evento[] = []
  let passos = 0

  for (const bloco of programa) {
    if (personagem.vida <= 0) {
      eventos.push({ bloco, personagem: clonarPersonagem(personagem), veredito: 'vida_zerada' })
      return { eventos, veredito: 'vida_zerada', personagem: clonarPersonagem(inicio), programa }
    }

    if (passos >= fase.limiteDePassos) {
      eventos.push({
        bloco,
        personagem: clonarPersonagem(personagem),
        veredito: 'limite_de_passos',
      })
      return {
        eventos,
        veredito: 'limite_de_passos',
        personagem: clonarPersonagem(inicio),
        programa,
      }
    }

    passos += 1
    let efeito: { personagem: Personagem; veredito?: Veredito } = {
      personagem: clonarPersonagem(personagem),
    }

    if (bloco.tipo === 'mover') {
      efeito = andar(personagem, MOVIMENTO_PARA_OLHAR[bloco.direcao], fase)
    } else if (bloco.tipo === 'virar') {
      efeito = {
        personagem: { ...clonarPersonagem(personagem), olhar: girar(personagem.olhar, bloco.sentido) },
      }
    } else if (bloco.tipo === 'avancar') {
      efeito = andar(personagem, personagem.olhar, fase)
    }

    personagem = efeito.personagem
    const veredito = efeito.veredito ?? 'sem_vitoria'
    eventos.push({ bloco, personagem: clonarPersonagem(personagem), veredito })

    if (veredito === 'vitoria') {
      return { eventos, veredito, personagem, programa }
    }
    if (veredito !== 'sem_vitoria') {
      return { eventos, veredito, personagem: clonarPersonagem(inicio), programa }
    }
  }

  return {
    eventos,
    veredito: 'sem_vitoria',
    personagem,
    programa,
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

