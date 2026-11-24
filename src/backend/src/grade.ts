import type { Casa, Direcao, Mundo, Posicao } from "./tipos.js";

const PASSO: Record<Direcao, Posicao> = {
  norte: { x: 0, y: -1 },
  leste: { x: 1, y: 0 },
  sul: { x: 0, y: 1 },
  oeste: { x: -1, y: 0 },
};

export function vizinha(posicao: Posicao, direcao: Direcao): Posicao {
  const delta = PASSO[direcao];
  return { x: posicao.x + delta.x, y: posicao.y + delta.y };
}

export function dentro(mundo: Mundo, posicao: Posicao): boolean {
  return posicao.x >= 0 && posicao.y >= 0 && posicao.x < mundo.largura && posicao.y < mundo.altura;
}

export function casaEm(mundo: Mundo, posicao: Posicao): Casa | null {
  return dentro(mundo, posicao) ? mundo.casas[posicao.y * mundo.largura + posicao.x] : null;
}
