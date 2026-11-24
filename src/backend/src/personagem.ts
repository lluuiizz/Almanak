import type { Personagem } from "./tipos.js";

export function clonarPersonagem(personagem: Personagem): Personagem {
  return {
    ...personagem,
    posicao: { ...personagem.posicao },
    alforje: [...personagem.alforje],
  };
}
