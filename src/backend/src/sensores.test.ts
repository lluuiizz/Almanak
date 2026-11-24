import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BlocoNaoLiberado, SENSORES } from "./arvore.js";
import { exigirSensorConsultavel, lerSensor } from "./sensores.js";
import type { Direcao, Mundo, Personagem } from "./tipos.js";

const MUNDO: Mundo = {
  largura: 3,
  altura: 2,
  casas: [
    { tipo: "vazio" },
    { tipo: "parede" },
    { tipo: "inimigo" },
    { tipo: "item", conteudo: "espada" },
    { tipo: "armadilha" },
    { tipo: "destino" },
  ],
};

describe("sensores do mundo", () => {
  it("lê parede à frente na parede e na borda da grade", () => {
    assert.equal(lerSensor("parede_frente", em(0, 0, "leste"), MUNDO), true);
    assert.equal(lerSensor("parede_frente", em(0, 0, "norte"), MUNDO), true);
    assert.equal(lerSensor("parede_frente", em(0, 0, "sul"), MUNDO), false);
  });

  it("lê inimigo à frente só quando a casa encarada tem inimigo", () => {
    assert.equal(lerSensor("inimigo_frente", em(2, 1, "norte"), MUNDO), true);
    assert.equal(lerSensor("inimigo_frente", em(2, 1, "oeste"), MUNDO), false);
  });

  it("lê item aqui na casa em que o personagem está", () => {
    assert.equal(lerSensor("item_aqui", em(0, 1, "leste"), MUNDO), true);
    assert.equal(lerSensor("item_aqui", em(0, 0, "sul"), MUNDO), false);
  });

  it("lê destino alcançado na casa do destino", () => {
    assert.equal(lerSensor("destino", em(2, 1, "oeste"), MUNDO), true);
    assert.equal(lerSensor("destino", em(1, 1, "leste"), MUNDO), false);
  });

  it("lê armadilha à frente na casa encarada", () => {
    assert.equal(lerSensor("armadilha_frente", em(0, 1, "leste"), MUNDO), true);
    assert.equal(lerSensor("armadilha_frente", em(0, 1, "norte"), MUNDO), false);
  });

  it("muda de valor quando relido depois de um movimento", () => {
    const antes = em(0, 0, "sul");
    const depois = { ...antes, posicao: { x: 0, y: 1 }, olhar: "leste" as const };

    assert.equal(lerSensor("armadilha_frente", antes, MUNDO), false);
    assert.equal(lerSensor("armadilha_frente", depois, MUNDO), true);
  });

  it("não altera o mundo nem o personagem", () => {
    const personagem = em(0, 1, "leste");
    const mundoAntes = JSON.stringify(MUNDO);
    const personagemAntes = JSON.stringify(personagem);

    for (const nome of SENSORES) {
      lerSensor(nome, personagem, MUNDO);
    }

    assert.equal(JSON.stringify(MUNDO), mundoAntes);
    assert.equal(JSON.stringify(personagem), personagemAntes);
  });

  it("só deixa consultar armadilha à frente com o talento Olhar atento", () => {
    assert.throws(() => exigirSensorConsultavel("armadilha_frente", null), BlocoNaoLiberado);
    assert.throws(() => exigirSensorConsultavel("armadilha_frente", "pulso_firme"), BlocoNaoLiberado);
    assert.doesNotThrow(() => exigirSensorConsultavel("armadilha_frente", "olhar_atento"));
  });

  it("deixa consultar os outros sensores sem talento", () => {
    for (const nome of SENSORES.filter((sensor) => sensor !== "armadilha_frente")) {
      assert.doesNotThrow(() => exigirSensorConsultavel(nome, null));
    }
  });
});

function em(x: number, y: number, olhar: Direcao): Personagem {
  return { posicao: { x, y }, olhar, vida: 1, ataque: 1, alforje: [] };
}
