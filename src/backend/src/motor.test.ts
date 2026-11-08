import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BLOCOS_DA_FASE_1, executarFase1, tentativaDaFase1 } from "./fase1.js";
import { executar } from "./motor.js";
import type { Bloco, Tentativa } from "./tipos.js";

const direita: Bloco = { tipo: "mover", direcao: "direita" };
const cima: Bloco = { tipo: "mover", direcao: "cima" };
const baixo: Bloco = { tipo: "mover", direcao: "baixo" };

describe("fase 1", () => {
  it("desenha a linha P, X e destino e libera só os quatro movimentos", () => {
    const tentativa = tentativaDaFase1([]);

    assert.deepEqual(
      tentativa.casas.map((casa) => (casa.tipo === "destino" ? "destino" : casa.marco ? "X" : "P")),
      ["P", "X", "destino"],
    );
    assert.deepEqual(
      BLOCOS_DA_FASE_1.map((bloco) => (bloco.tipo === "mover" ? bloco.direcao : bloco.tipo)),
      ["esquerda", "direita", "cima", "baixo"],
    );
  });

  it("para no X com um movimento à direita e não vence", () => {
    const resultado = executarFase1([direita]);

    assert.equal(resultado.veredito, "sem_vitoria");
    assert.deepEqual(resultado.personagem.posicao, { x: 1, y: 0 });
  });

  it("vence com dois movimentos à direita", () => {
    const resultado = executarFase1([direita, direita]);

    assert.equal(resultado.veredito, "vitoria");
    assert.deepEqual(resultado.personagem.posicao, { x: 2, y: 0 });
    assert.equal(resultado.eventos.length, 2);
  });

  it("só muda a posição quando o programa é executado", () => {
    const tentativa = tentativaDaFase1([direita, direita]);

    assert.deepEqual(tentativa.inicio.posicao, { x: 0, y: 0 });
    executar(tentativa);
    assert.deepEqual(tentativa.inicio.posicao, { x: 0, y: 0 });
  });

  it("recusa um bloco que a fase 1 não liberou", () => {
    assert.throws(() => executarFase1([{ tipo: "atacar" }]), /não liberado/);
  });
});

describe("motor", () => {
  it("executa a lista na ordem e gera um evento por passo", () => {
    const tentativa = mapaLivre([direita, baixo]);
    const resultado = executar(tentativa);

    assert.deepEqual(resultado.personagem.posicao, { x: 1, y: 1 });
    assert.deepEqual(
      resultado.eventos.map((evento) => evento.personagem.posicao),
      [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ],
    );
  });

  it("repete o mesmo resultado para o mesmo programa, mapa e semente", () => {
    const tentativa = tentativaDaFase1([direita]);

    assert.deepEqual(executar(tentativa), executar(tentativa));
  });

  it("gira o olhar sem sair da casa e avança nesse olhar", () => {
    const tentativa = mapaLivre([
      { tipo: "virar", sentido: "direita" },
      { tipo: "avancar" },
    ]);
    const resultado = executar(tentativa);

    assert.equal(resultado.eventos[0].personagem.olhar, "sul");
    assert.deepEqual(resultado.eventos[0].personagem.posicao, { x: 0, y: 0 });
    assert.deepEqual(resultado.personagem.posicao, { x: 0, y: 1 });
  });

  it("gasta o passo ao atacar uma casa vazia e não remove ninguém", () => {
    const tentativa = mapaLivre([{ tipo: "atacar" }]);
    const resultado = executar(tentativa);

    assert.equal(resultado.eventos.length, 1);
    assert.deepEqual(resultado.personagem.posicao, { x: 0, y: 0 });
    assert.equal(resultado.veredito, "sem_vitoria");
  });

  it("gasta o passo ao pegar numa casa sem item e mantém o alforje", () => {
    const tentativa = mapaLivre([{ tipo: "pegar" }]);
    const resultado = executar(tentativa);

    assert.deepEqual(resultado.personagem.alforje, []);
    assert.equal(resultado.eventos.length, 1);
  });

  it("trata parede, inimigo, vida zerada e limite de passos como vereditos diferentes", () => {
    const parede = executar(mapaLivre([cima]));
    const inimigo = executar(comCasa(1, 0, "inimigo", [direita]));
    const vida = executar({ ...mapaLivre([direita]), inicio: { ...mapaLivre([]).inicio, vida: 0 } });
    const limite = executar({ ...mapaLivre([direita, direita]), limiteDePassos: 1 });

    assert.equal(parede.veredito, "parede");
    assert.equal(inimigo.veredito, "inimigo");
    assert.equal(vida.veredito, "vida_zerada");
    assert.equal(limite.veredito, "limite_de_passos");
  });

  it("devolve o personagem ao início na falha e conserva o programa", () => {
    const programa: Bloco[] = [direita, cima];
    const antes = JSON.stringify(programa);
    const tentativa = mapaLivre(programa);
    const resultado = executar(tentativa);

    assert.equal(resultado.veredito, "parede");
    assert.deepEqual(resultado.personagem.posicao, { x: 0, y: 0 });
    assert.equal(resultado.programa, programa);
    assert.equal(JSON.stringify(programa), antes);
    assert.deepEqual(tentativa.inicio.posicao, { x: 0, y: 0 });
  });

  it("não trata a vitória como falha", () => {
    const resultado = executarFase1([direita, direita]);

    assert.equal(resultado.veredito, "vitoria");
    assert.deepEqual(resultado.personagem.posicao, { x: 2, y: 0 });
  });
});

function mapaLivre(programa: Bloco[]): Tentativa {
  const base = tentativaDaFase1(programa);
  return {
    ...base,
    largura: 3,
    altura: 2,
    casas: Array.from({ length: 6 }, () => ({ tipo: "vazio" as const })),
    limiteDePassos: 8,
  };
}

function comCasa(x: number, y: number, tipo: "inimigo", programa: Bloco[]): Tentativa {
  const tentativa = mapaLivre(programa);
  tentativa.casas[y * tentativa.largura + x] = { tipo };
  return tentativa;
}
