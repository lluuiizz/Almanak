import { exigirAcoesLiberadas, type NoPrograma } from "./arvore.js";
import { executar } from "./motor.js";
import { clonarPersonagem } from "./personagem.js";
import type { Bloco, Fase, Personagem, Progresso, Resultado, Tentativa } from "./tipos.js";

export const MOVIMENTOS: Bloco[] = [
  { tipo: "mover", direcao: "esquerda" },
  { tipo: "mover", direcao: "direita" },
  { tipo: "mover", direcao: "cima" },
  { tipo: "mover", direcao: "baixo" },
];

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
  blocosLiberados: MOVIMENTOS,
  inicio: inicioDaFase1,
  limiteDePassos: 8,
  condicaoDeVitoria: "chegar_no_destino",
};

export const BLOCOS_DA_FASE_1 = MOVIMENTOS;

export function progressoInicial(): Progresso {
  return { fasesConcluidas: [], talento: null };
}

export function abrirTentativa(fase: Fase, programa: NoPrograma[], semente: number): Tentativa {
  return {
    semente,
    faseId: fase.id,
    largura: fase.largura,
    altura: fase.altura,
    casas: fase.casas.map((casa) => ({ ...casa })),
    inicio: clonarPersonagem(fase.inicio),
    limiteDePassos: fase.limiteDePassos,
    programa,
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
  return executar(tentativaDaFase1(exigirAcoesLiberadas(programa, BLOCOS_DA_FASE_1)));
}

function copiarProgresso(progresso: Progresso): Progresso {
  return {
    fasesConcluidas: [...progresso.fasesConcluidas],
    talento: progresso.talento,
  };
}
