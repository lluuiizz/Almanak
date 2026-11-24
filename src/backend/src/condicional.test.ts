import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BlocoNaoLiberado, ProgramaInvalido, type Expressao, type NoPrograma } from "./arvore.js";
import { executar } from "./motor.js";
import type { Bloco, Casa, Evento, Tentativa } from "./tipos.js";

const direita: Bloco = { tipo: "mover", direcao: "direita" };
const baixo: Bloco = { tipo: "mover", direcao: "baixo" };
const cima: Bloco = { tipo: "mover", direcao: "cima" };
const atacar: Bloco = { tipo: "atacar" };
const pegar: Bloco = { tipo: "pegar" };

const parede: Expressao = { tipo: "sensor", nome: "parede_frente" };
const inimigo: Expressao = { tipo: "sensor", nome: "inimigo_frente" };
const item: Expressao = { tipo: "sensor", nome: "item_aqui" };
const destino: Expressao = { tipo: "sensor", nome: "destino" };
const armadilha: Expressao = { tipo: "sensor", nome: "armadilha_frente" };

const CASAS: Casa[] = [
  { tipo: "vazio" },
  { tipo: "vazio" },
  { tipo: "parede" },
  { tipo: "vazio" },
  { tipo: "destino" },
  { tipo: "vazio" },
  { tipo: "armadilha" },
  { tipo: "inimigo" },
  { tipo: "vazio" },
];

describe("condicional se / senão", () => {
  it("avalia a pergunta no momento da execução, olhando o mundo atual", () => {
    const antesDeAndar = executar(tentativa([{ tipo: "se", pergunta: parede, entao: [baixo] }]));
    const depoisDeAndar = executar(tentativa([direita, { tipo: "se", pergunta: parede, entao: [baixo] }]));

    assert.equal(antesDeAndar.veredito, "sem_vitoria");
    assert.deepEqual(ramos(antesDeAndar.eventos), [{ tipo: "nenhum" }]);
    assert.equal(depoisDeAndar.veredito, "vitoria");
    assert.deepEqual(ramos(depoisDeAndar.eventos), [{ tipo: "entao" }]);
  });

  it("relê o mesmo sensor depois de um movimento", () => {
    const resultado = executar(
      tentativa([
        { tipo: "se", pergunta: parede, entao: [cima] },
        direita,
        { tipo: "se", pergunta: parede, entao: [baixo] },
      ]),
    );

    assert.deepEqual(ramos(resultado.eventos), [{ tipo: "nenhum" }, { tipo: "entao" }]);
    assert.equal(resultado.veredito, "vitoria");
  });

  it("gera eventos só no ramo escolhido, com o caminho de cada bloco", () => {
    const resultado = executar(
      tentativa([direita, { tipo: "se", pergunta: parede, entao: [baixo], senao: [direita] }]),
    );

    assert.deepEqual(caminhos(resultado.eventos), [[0], [1], [1, "entao", 0]]);
    assert.deepEqual(
      resultado.eventos.map((evento) => evento.tipo),
      ["acao", "ramo", "acao"],
    );
  });

  it("encadeia outra pergunta no senão se", () => {
    const resultado = executar(
      tentativa([
        direita,
        {
          tipo: "se",
          pergunta: inimigo,
          entao: [atacar],
          senaoSe: [
            { pergunta: item, entao: [pegar] },
            { pergunta: parede, entao: [baixo] },
          ],
          senao: [direita],
        },
      ]),
    );

    assert.deepEqual(ramos(resultado.eventos), [{ tipo: "senaoSe", indice: 1 }]);
    assert.deepEqual(caminhos(resultado.eventos).at(-1), [1, "senaoSe", 1, "entao", 0]);
    assert.equal(resultado.veredito, "vitoria");
  });

  it("executa o senão quando nenhuma pergunta é verdadeira", () => {
    const resultado = executar(
      tentativa([direita, { tipo: "se", pergunta: inimigo, entao: [atacar], senao: [baixo] }]),
    );

    assert.deepEqual(ramos(resultado.eventos), [{ tipo: "senao" }]);
    assert.deepEqual(caminhos(resultado.eventos).at(-1), [1, "senao", 0]);
    assert.equal(resultado.veredito, "vitoria");
  });

  it("aceita um se dentro de outro se", () => {
    const resultado = executar(
      tentativa([
        direita,
        {
          tipo: "se",
          pergunta: parede,
          entao: [{ tipo: "se", pergunta: destino, entao: [direita], senao: [baixo] }],
        },
      ]),
    );

    assert.deepEqual(ramos(resultado.eventos), [{ tipo: "entao" }, { tipo: "senao" }]);
    assert.deepEqual(caminhos(resultado.eventos).at(-1), [1, "entao", 0, "senao", 0]);
    assert.equal(resultado.veredito, "vitoria");
  });

  it("não gasta passo ao escolher o ramo", () => {
    const resultado = executar({
      ...tentativa([direita, { tipo: "se", pergunta: parede, entao: [baixo] }]),
      limiteDePassos: 2,
    });

    assert.equal(resultado.veredito, "vitoria");
  });

  it("encerra a execução quando a vitória acontece dentro do ramo", () => {
    const resultado = executar(
      tentativa([direita, { tipo: "se", pergunta: parede, entao: [baixo, direita] }, direita]),
    );

    assert.equal(resultado.veredito, "vitoria");
    assert.equal(resultado.eventos.length, 3);
  });

  it("devolve o personagem ao início e preserva a árvore quando o ramo falha", () => {
    const programa: NoPrograma[] = [direita, { tipo: "se", pergunta: parede, entao: [direita], senao: [baixo] }];
    const antes = JSON.stringify(programa);
    const resultado = executar(tentativa(programa));

    assert.equal(resultado.veredito, "parede");
    assert.deepEqual(resultado.personagem.posicao, { x: 0, y: 0 });
    assert.equal(resultado.programa, programa);
    assert.equal(JSON.stringify(programa), antes);
  });

  it("recusa armadilha à frente sem o talento Olhar atento antes de gastar passo", () => {
    const programa: NoPrograma[] = [baixo, { tipo: "se", pergunta: armadilha, entao: [direita] }];

    assert.throws(() => executar(tentativa(programa)), BlocoNaoLiberado);
    assert.equal(executar({ ...tentativa(programa), talento: "olhar_atento" }).veredito, "vitoria");
  });

  it("recusa blocos que o motor ainda não executa antes de gastar passo", () => {
    const naoExecutaveis: NoPrograma[] = [
      { tipo: "enquanto", pergunta: parede, corpo: [direita] },
      { tipo: "repetir", vezes: 2, corpo: [direita] },
      { tipo: "rotina", nome: "volta", corpo: [direita] },
      { tipo: "chamar", nome: "volta" },
      { tipo: "valor", nome: "vida", escrita: true },
      { tipo: "se", pergunta: { tipo: "nao", operando: parede }, entao: [direita] },
    ];

    for (const no of naoExecutaveis) {
      assert.throws(() => executar(tentativa([direita, no])), ProgramaInvalido);
    }
  });

  it("repete o mesmo resultado para a mesma árvore, mapa e semente", () => {
    const alvo = tentativa([direita, { tipo: "se", pergunta: parede, entao: [baixo], senao: [direita] }]);

    assert.deepEqual(executar(alvo), executar(alvo));
  });
});

function tentativa(programa: NoPrograma[]): Tentativa {
  return {
    semente: 1,
    faseId: "fase-de-teste",
    largura: 3,
    altura: 3,
    casas: CASAS.map((casa) => ({ ...casa })),
    inicio: { posicao: { x: 0, y: 0 }, olhar: "leste", vida: 1, ataque: 1, alforje: [] },
    limiteDePassos: 8,
    programa,
  };
}

function ramos(eventos: Evento[]) {
  return eventos.flatMap((evento) => (evento.tipo === "ramo" ? [evento.ramo] : []));
}

function caminhos(eventos: Evento[]) {
  return eventos.map((evento) => evento.caminho);
}
