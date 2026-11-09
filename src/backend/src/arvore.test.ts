import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BlocoNaoLiberado, ProgramaInvalido, exigirAcoesLiberadas, validarPrograma } from "./arvore.js";
import { BLOCOS_DA_FASE_1 } from "./fase1.js";

describe("árvore de blocos", () => {
  it("guarda os filhos do se, do enquanto e do repetir na ordem da folha", () => {
    const programa = validarPrograma([
      {
        tipo: "se",
        pergunta: { tipo: "sensor", nome: "parede_frente" },
        entao: [
          { tipo: "mover", direcao: "baixo" },
          { tipo: "mover", direcao: "direita" },
        ],
        senaoSe: [
          {
            pergunta: { tipo: "sensor", nome: "inimigo_frente" },
            entao: [{ tipo: "atacar" }],
          },
        ],
        senao: [{ tipo: "avancar" }],
      },
      {
        tipo: "enquanto",
        pergunta: { tipo: "nao", operando: { tipo: "sensor", nome: "destino" } },
        corpo: [{ tipo: "avancar" }, { tipo: "pegar" }],
      },
      {
        tipo: "repetir",
        vezes: 3,
        corpo: [{ tipo: "mover", direcao: "direita" }],
      },
      {
        tipo: "rotina",
        nome: "contornar",
        corpo: [{ tipo: "virar", sentido: "esquerda" }, { tipo: "avancar" }],
      },
      { tipo: "chamar", nome: "contornar" },
    ]);

    const se = programa[0];
    assert.equal(se.tipo, "se");
    if (se.tipo !== "se") {
      return;
    }
    assert.deepEqual(
      se.entao.map((bloco) => (bloco.tipo === "mover" ? bloco.direcao : bloco.tipo)),
      ["baixo", "direita"],
    );
    assert.equal(se.senaoSe?.[0].entao[0].tipo, "atacar");
    assert.equal(se.senao?.[0].tipo, "avancar");

    const laco = programa[1];
    assert.equal(laco.tipo, "enquanto");
    if (laco.tipo === "enquanto") {
      assert.deepEqual(
        laco.corpo.map((bloco) => bloco.tipo),
        ["avancar", "pegar"],
      );
      assert.equal(laco.pergunta.tipo, "nao");
    }
  });

  it("aceita comparação, e e ou na pergunta", () => {
    const programa = validarPrograma([
      {
        tipo: "se",
        pergunta: {
          tipo: "e",
          esquerda: { tipo: "sensor", nome: "parede_frente" },
          direita: {
            tipo: "ou",
            esquerda: { tipo: "sensor", nome: "item_aqui" },
            direita: {
              tipo: "comparacao",
              operador: ">=",
              esquerda: { tipo: "valor", nome: "ataque" },
              direita: { tipo: "numero", valor: 3 },
            },
          },
        },
        entao: [{ tipo: "atacar" }],
      },
    ]);

    assert.equal(programa[0].tipo, "se");
  });

  it("rejeita sensor no corpo de uma ação", () => {
    assert.throws(
      () =>
        validarPrograma([
          {
            tipo: "mover",
            direcao: "direita",
            corpo: [{ tipo: "sensor", nome: "parede_frente" }],
          },
        ]),
      (erro: unknown) => erro instanceof ProgramaInvalido && /sensor no corpo/.test(erro.message),
    );
  });

  it("rejeita ação no lugar da pergunta", () => {
    assert.throws(
      () =>
        validarPrograma([
          {
            tipo: "se",
            pergunta: { tipo: "mover", direcao: "direita" },
            entao: [{ tipo: "avancar" }],
          },
        ]),
      (erro: unknown) => erro instanceof ProgramaInvalido && erro.message === "ação no lugar da pergunta",
    );
  });

  it("rejeita escrita numa constante", () => {
    assert.throws(
      () => validarPrograma([{ tipo: "valor", nome: "DANO_TALENTO", escrita: true }]),
      (erro: unknown) => erro instanceof ProgramaInvalido && erro.message === "escrita numa constante",
    );
  });

  it("na fase 1 só libera os quatro movimentos", () => {
    const programa = validarPrograma([
      { tipo: "mover", direcao: "direita" },
      { tipo: "mover", direcao: "direita" },
    ]);

    assert.equal(exigirAcoesLiberadas(programa, BLOCOS_DA_FASE_1).length, 2);
    assert.throws(
      () => exigirAcoesLiberadas(validarPrograma([{ tipo: "atacar" }]), BLOCOS_DA_FASE_1),
      BlocoNaoLiberado,
    );
    assert.throws(
      () =>
        exigirAcoesLiberadas(
          validarPrograma([
            {
              tipo: "se",
              pergunta: { tipo: "sensor", nome: "parede_frente" },
              entao: [{ tipo: "mover", direcao: "baixo" }],
            },
          ]),
          BLOCOS_DA_FASE_1,
        ),
      BlocoNaoLiberado,
    );
  });
});
