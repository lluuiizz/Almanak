import { executar } from "./motor.js";
import type { Bloco, Fase, Personagem, Progresso, Resultado, Tentativa } from "./tipos.js";

const inicioDaFase1: Personagem = {
  posicao: { x: 0, y: 0 },
  olhar: "leste",
  vida: 1,
  ataque: 1,
  alforje: [],
};

export const FASE_1: Fase = {
  id: "fase-1",
  largura: 3,
  altura: 1,
  casas: [{ tipo: "vazio" }, { tipo: "vazio", marco: true }, { tipo: "destino" }],
  blocosLiberados: [
    { tipo: "mover", direcao: "esquerda" },
    { tipo: "mover", direcao: "direita" },
    { tipo: "mover", direcao: "cima" },
    { tipo: "mover", direcao: "baixo" },
  ],
  inicio: inicioDaFase1,
  limiteDePassos: 8,
  condicaoDeVitoria: "chegar_no_destino",
  enunciado:
    'Player, o seu objetivo é chegar até o quadrado escrito Destino. Para isso você dispõe das seguintes ações: mover-se à direita, mover-se à esquerda, mover-se para cima/baixo. Arraste os blocos de ações para o "Programador de ações" e aperte o botão de Play para que inicie a sequência.',
  dica:
    'Um único bloco "mover-se à direita" faz o personagem dar um passo e parar no marco X. Coloque dois blocos "mover-se à direita" e aperte Play para alcançar o Destino!',
  temNeblina: false,
};

export const BLOCOS_DA_FASE_1 = FASE_1.blocosLiberados;

export function progressoInicial(): Progresso {
  return { fasesConcluidas: [], talento: null };
}

export function abrirTentativa(fase: Fase, programa: Bloco[], semente: number): Tentativa {
  return {
    semente,
    faseId: fase.id,
    largura: fase.largura,
    altura: fase.altura,
    casas: fase.casas.map((casa) => ({ ...casa })),
    inicio: clonarPersonagem(fase.inicio),
    limiteDePassos: fase.limiteDePassos,
    programa,
    temNeblina: fase.temNeblina ?? false,
  };
}

export function concluirFase(progresso: Progresso, faseId: string): Progresso {
  if (progresso.fasesConcluidas.includes(faseId)) {
    return copiarProgresso(progresso);
  }

  return {
    fasesConcluidas: [...progresso.fasesConcluidas, faseId],
    talento: progresso.talento,
  };
}

export function escolherTalento(progresso: Progresso, talento: string): Progresso {
  return {
    fasesConcluidas: [...progresso.fasesConcluidas],
    talento,
  };
}

export function tentativaDaFase1(programa: Bloco[]): Tentativa {
  return abrirTentativa(FASE_1, programa, 1);
}

export function executarFase1(programa: Bloco[]): Resultado {
  for (const bloco of programa) {
    if (!liberado(bloco)) {
      throw new Error("bloco não liberado na fase 1");
    }
  }

  return executar(tentativaDaFase1(programa));
}

function liberado(bloco: Bloco): boolean {
  return FASE_1.blocosLiberados.some(
    (item) => item.tipo === "mover" && bloco.tipo === "mover" && item.direcao === bloco.direcao,
  );
}

function clonarPersonagem(personagem: Personagem): Personagem {
  return {
    ...personagem,
    posicao: { ...personagem.posicao },
    alforje: [...personagem.alforje],
  };
}

function copiarProgresso(progresso: Progresso): Progresso {
  return {
    fasesConcluidas: [...progresso.fasesConcluidas],
    talento: progresso.talento,
  };
}
