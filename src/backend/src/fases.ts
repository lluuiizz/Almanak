import { MOVIMENTOS } from "./fase1.js";
import type { Casa, Fase, Posicao } from "./tipos.js";

const LEGENDA: Record<string, Casa["tipo"]> = {
  ".": "vazio",
  P: "vazio",
  "#": "parede",
  D: "destino",
};

interface Planta {
  largura: number;
  altura: number;
  casas: Casa[];
  inicio: Posicao;
}

const CURVA = planta(["P....", "####.", "####D"]);

export const FASE_2: Fase = {
  id: "fase-2",
  largura: CURVA.largura,
  altura: CURVA.altura,
  casas: CURVA.casas,
  blocosLiberados: [...MOVIMENTOS],
  inicio: { posicao: CURVA.inicio, olhar: "leste", vida: 1, ataque: 1, alforje: [] },
  limiteDePassos: 12,
  condicaoDeVitoria: "chegar_no_destino",
};

function planta(linhas: string[]): Planta {
  const casas: Casa[] = [];
  const inicios: Posicao[] = [];

  for (const [y, linha] of linhas.entries()) {
    for (const [x, simbolo] of [...linha].entries()) {
      const tipo = LEGENDA[simbolo];
      if (tipo === undefined) {
        throw new Error(`símbolo desconhecido na planta da fase: ${simbolo}`);
      }
      casas.push({ tipo });
      if (simbolo === "P") {
        inicios.push({ x, y });
      }
    }
  }

  if (inicios.length !== 1) {
    throw new Error("a planta da fase precisa marcar um único início com P");
  }
  return { largura: linhas[0].length, altura: linhas.length, casas, inicio: inicios[0] };
}
