import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { abrirTentativa } from "./fase1.js";
import { FASE_2 } from "./fases.js";
import { executar } from "./motor.js";
import type { NoPrograma } from "./arvore.js";
import type { Bloco, Fase } from "./tipos.js";

const direita: Bloco = { tipo: "mover", direcao: "direita" };
const baixo: Bloco = { tipo: "mover", direcao: "baixo" };

describe("fase 2, a curva", () => {
  it("desenha quatro passos à direita a partir de P e a descida até o destino", () => {
    assert.deepEqual(desenhar(FASE_2), ["P....", "####.", "####D"]);
  });

  it("vence com quatro movimentos à direita e dois para baixo", () => {
    const resultado = jogar(FASE_2, [direita, direita, direita, direita, baixo, baixo]);

    assert.equal(resultado.veredito, "vitoria");
    assert.deepEqual(resultado.personagem.posicao, { x: 4, y: 2 });
  });

  it("encerra na borda ao descer antes de completar a linha e preserva o programa", () => {
    const programa = [direita, direita, baixo, direita, direita, baixo];
    const resultado = jogar(FASE_2, programa);

    assert.equal(resultado.veredito, "parede");
    assert.deepEqual(resultado.personagem.posicao, FASE_2.inicio.posicao);
    assert.deepEqual(resultado.programa, programa);
  });

  it("oferece só os quatro movimentos, sem bloco de decisão", () => {
    assert.deepEqual(
      FASE_2.blocosLiberados.map((item) => item.tipo),
      ["mover", "mover", "mover", "mover"],
    );
  });
});

function jogar(fase: Fase, programa: NoPrograma[]) {
  return executar(abrirTentativa(fase, programa, 1));
}

function desenhar(fase: Fase): string[] {
  const linhas: string[] = [];
  for (let y = 0; y < fase.altura; y += 1) {
    let linha = "";
    for (let x = 0; x < fase.largura; x += 1) {
      const casa = fase.casas[y * fase.largura + x];
      const inicio = fase.inicio.posicao.x === x && fase.inicio.posicao.y === y;
      linha += inicio ? "P" : casa.tipo === "parede" ? "#" : casa.tipo === "destino" ? "D" : ".";
    }
    linhas.push(linha);
  }
  return linhas;
}
