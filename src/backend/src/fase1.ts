import { executar } from "./motor.js";
import type { Bloco, Resultado, Tentativa } from "./tipos.js";

export const BLOCOS_DA_FASE_1: Bloco[] = [
  { tipo: "mover", direcao: "esquerda" },
  { tipo: "mover", direcao: "direita" },
  { tipo: "mover", direcao: "cima" },
  { tipo: "mover", direcao: "baixo" },
];

export function tentativaDaFase1(programa: Bloco[]): Tentativa {
  return {
    semente: 1,
    largura: 3,
    altura: 1,
    casas: [{ tipo: "vazio" }, { tipo: "vazio", marco: true }, { tipo: "destino" }],
    inicio: {
      posicao: { x: 0, y: 0 },
      olhar: "leste",
      vida: 1,
      ataque: 1,
      alforje: [],
    },
    limiteDePassos: 8,
    programa,
  };
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
  return BLOCOS_DA_FASE_1.some(
    (item) => item.tipo === "mover" && bloco.tipo === "mover" && item.direcao === bloco.direcao,
  );
}
