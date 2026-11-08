import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FASE_1,
  abrirTentativa,
  concluirFase,
  escolherTalento,
  executarFase1,
  progressoInicial,
} from "./fase1.js";

describe("fase e progresso", () => {
  it("descreve mapa, blocos, atributos iniciais e vitória no destino", () => {
    assert.equal(FASE_1.condicaoDeVitoria, "chegar_no_destino");
    assert.equal(FASE_1.inicio.vida, 1);
    assert.equal(FASE_1.inicio.ataque, 1);
    assert.equal(FASE_1.blocosLiberados.length, 4);
    assert.equal(FASE_1.casas[2].tipo, "destino");
  });

  it("guarda na tentativa a semente, o estado inicial e o programa", () => {
    const programa = [{ tipo: "mover" as const, direcao: "direita" as const }];
    const tentativa = abrirTentativa(FASE_1, programa, 7);

    assert.equal(tentativa.semente, 7);
    assert.equal(tentativa.faseId, "fase-1");
    assert.equal(tentativa.programa, programa);
    assert.deepEqual(tentativa.inicio.posicao, { x: 0, y: 0 });
    assert.notEqual(tentativa.inicio, FASE_1.inicio);
  });

  it("registra a fase concluída e mantém o talento no Play seguinte", () => {
    const comTalento = escolherTalento(progressoInicial(), "dano");
    const depoisDaVitoria = concluirFase(comTalento, "fase-1");
    const resultado = executarFase1([
      { tipo: "mover", direcao: "direita" },
      { tipo: "mover", direcao: "direita" },
    ]);
    const deNovo = abrirTentativa(FASE_1, [], 2);

    assert.equal(resultado.veredito, "vitoria");
    assert.deepEqual(depoisDaVitoria.fasesConcluidas, ["fase-1"]);
    assert.equal(depoisDaVitoria.talento, "dano");
    assert.equal(deNovo.inicio.vida, 1);
    assert.equal(deNovo.inicio.ataque, 1);
    assert.equal(comTalento.fasesConcluidas.length, 0);
  });

  it("nasce vida e ataque de novo mesmo depois de uma tentativa sem vida", () => {
    const primeira = abrirTentativa(FASE_1, [], 1);
    primeira.inicio.vida = 0;
    const segunda = abrirTentativa(FASE_1, [], 1);

    assert.equal(primeira.inicio.vida, 0);
    assert.equal(segunda.inicio.vida, FASE_1.inicio.vida);
    assert.equal(segunda.inicio.ataque, FASE_1.inicio.ataque);
  });
});
