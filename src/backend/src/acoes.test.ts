import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import { criarServidor } from "./aplicacao.js";
import { criarRepositorioMemoria, type FaseRegistro, type RepositorioMemoria } from "./repositorio.js";
import type { Bloco, Casa, Direcao } from "./tipos.js";

const virarDireita: Bloco = { tipo: "virar", sentido: "direita" };
const virarEsquerda: Bloco = { tipo: "virar", sentido: "esquerda" };
const avancar: Bloco = { tipo: "avancar" };
const atacar: Bloco = { tipo: "atacar" };
const pegar: Bloco = { tipo: "pegar" };

const CASAS: Casa[] = [
  { tipo: "vazio" },
  { tipo: "vazio" },
  { tipo: "destino" },
  { tipo: "parede" },
  { tipo: "inimigo" },
  { tipo: "vazio" },
];

const FASE_DAS_ACOES = faseDeTeste("fase-acoes", { vida: 1, limiteDePassos: 6 });
const FASE_SEM_VIDA = faseDeTeste("fase-sem-vida", { vida: 0, limiteDePassos: 6 });

describe("ações virar, avançar, atacar e pegar pela API", { concurrency: false }, () => {
  let servidor: Server;
  let porta: number;
  let repo: RepositorioMemoria;

  before(async () => {
    repo = repositorioCom([FASE_DAS_ACOES, FASE_SEM_VIDA]);
    servidor = criarServidor(repo);
    await new Promise<void>((resolve) => {
      servidor.listen(0, "127.0.0.1", resolve);
    });
    porta = (servidor.address() as AddressInfo).port;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      servidor.close((erro) => (erro ? reject(erro) : resolve()));
    });
  });

  async function executarNaFase(faseId: string, programa: Bloco[]) {
    const abertura = await pedir(porta, "POST", `/fases/${faseId}/tentativas`, {});
    const resposta = await pedir(porta, "POST", `/tentativas/${abertura.json.id}/execucoes`, { programa });
    return { id: abertura.json.id as string, ...resposta };
  }

  it("gera um evento por ação com o personagem depois do passo", async () => {
    const programa = [virarDireita, avancar, atacar, pegar];
    const resposta = await executarNaFase("fase-acoes", programa);

    assert.equal(resposta.status, 201);
    assert.equal(resposta.json.eventos.length, programa.length);
    assert.deepEqual(
      resposta.json.eventos.map((evento: { bloco: Bloco }) => evento.bloco),
      programa,
    );
    assert.deepEqual(
      resposta.json.eventos.map((evento: { personagem: { posicao: unknown } }) => evento.personagem.posicao),
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 0 },
      ],
    );
  });

  it("vira à direita na ordem norte, leste, sul, oeste e volta ao norte sem sair da casa", async () => {
    const resposta = await executarNaFase("fase-acoes", [virarDireita, virarDireita, virarDireita, virarDireita]);

    assert.deepEqual(olhares(resposta.json.eventos), ["leste", "sul", "oeste", "norte"]);
    assert.deepEqual(posicoes(resposta.json.eventos), Array(4).fill({ x: 0, y: 0 }));
  });

  it("vira à esquerda na ordem inversa", async () => {
    const resposta = await executarNaFase("fase-acoes", [virarEsquerda, virarEsquerda, virarEsquerda, virarEsquerda]);

    assert.deepEqual(olhares(resposta.json.eventos), ["oeste", "sul", "leste", "norte"]);
  });

  it("avança uma casa no olhar e vence ao chegar no destino", async () => {
    const resposta = await executarNaFase("fase-acoes", [virarDireita, avancar, avancar]);

    assert.equal(resposta.json.veredito, "vitoria");
    assert.deepEqual(resposta.json.personagem.posicao, { x: 2, y: 0 });
  });

  it("encerra em parede ao avançar para fora da grade ou contra a parede", async () => {
    const foraDaGrade = await executarNaFase("fase-acoes", [avancar]);
    const contraParede = await executarNaFase("fase-acoes", [virarDireita, virarDireita, avancar]);

    assert.equal(foraDaGrade.json.veredito, "parede");
    assert.equal(contraParede.json.veredito, "parede");
  });

  it("encerra em inimigo ao avançar para a casa dele", async () => {
    const resposta = await executarNaFase("fase-acoes", [virarDireita, avancar, virarDireita, avancar]);

    assert.equal(resposta.json.veredito, "inimigo");
  });

  it("gasta o passo ao atacar casa vazia sem apagar casa nem entidade", async () => {
    const resposta = await executarNaFase("fase-acoes", [virarDireita, atacar]);
    const tentativa = repo.tentativas.find((item) => item.id === resposta.id);

    assert.equal(resposta.json.eventos.length, 2);
    assert.equal(resposta.json.veredito, "sem_vitoria");
    assert.deepEqual(tentativa?.casas, CASAS);
  });

  it("gasta o passo ao pegar em casa sem item e mantém o alforje", async () => {
    const resposta = await executarNaFase("fase-acoes", [pegar]);

    assert.equal(resposta.json.eventos.length, 1);
    assert.deepEqual(resposta.json.eventos[0].personagem.alforje, []);
  });

  it("devolve o personagem ao início e preserva o programa em parede, inimigo, vida zerada e limite", async () => {
    const casos: { faseId: string; programa: Bloco[]; veredito: string }[] = [
      { faseId: "fase-acoes", programa: [virarDireita, virarDireita, avancar], veredito: "parede" },
      { faseId: "fase-acoes", programa: [virarDireita, avancar, virarDireita, avancar], veredito: "inimigo" },
      { faseId: "fase-sem-vida", programa: [virarDireita], veredito: "vida_zerada" },
      { faseId: "fase-acoes", programa: Array(7).fill(virarDireita), veredito: "limite_de_passos" },
    ];

    for (const caso of casos) {
      const resposta = await executarNaFase(caso.faseId, caso.programa);
      const tentativa = repo.tentativas.find((item) => item.id === resposta.id);

      assert.equal(resposta.json.veredito, caso.veredito);
      assert.deepEqual(resposta.json.personagem.posicao, { x: 0, y: 0 });
      assert.equal(resposta.json.personagem.olhar, "norte");
      assert.deepEqual(resposta.json.programa, caso.programa);
      assert.deepEqual(tentativa?.programaAtual, caso.programa);
    }
  });

  it("recusa as quatro ações na fase 1 sem gravar execução", async () => {
    const execucoes = repo.execucoes.length;

    for (const bloco of [virarDireita, avancar, atacar, pegar]) {
      const resposta = await executarNaFase("fase-1", [bloco]);

      assert.equal(resposta.status, 422);
      assert.equal(resposta.json.erro, "bloco_nao_liberado");
    }
    assert.equal(repo.execucoes.length, execucoes);
  });
});

function faseDeTeste(id: string, ajuste: { vida: number; limiteDePassos: number }): FaseRegistro {
  return {
    id,
    ordem: 99,
    nome: id,
    conceito: "Ações",
    descricao: null,
    largura: 3,
    altura: 2,
    limiteDePassos: ajuste.limiteDePassos,
    condicaoDeVitoria: "chegar_no_destino",
    inicio: { posicao: { x: 0, y: 0 }, olhar: "norte", vida: ajuste.vida, ataque: 1, alforje: [] },
    casas: CASAS.map((casa) => ({ ...casa })),
    blocosLiberados: [virarEsquerda, virarDireita, avancar, atacar, pegar],
  };
}

function repositorioCom(fases: FaseRegistro[]): RepositorioMemoria {
  const base = criarRepositorioMemoria();
  return {
    ...base,
    async listarFases() {
      return [...(await base.listarFases()), ...fases];
    },
    async buscarFase(id) {
      return fases.find((fase) => fase.id === id) ?? base.buscarFase(id);
    },
  };
}

function olhares(eventos: { personagem: { olhar: Direcao } }[]): Direcao[] {
  return eventos.map((evento) => evento.personagem.olhar);
}

function posicoes(eventos: { personagem: { posicao: unknown } }[]): unknown[] {
  return eventos.map((evento) => evento.personagem.posicao);
}

async function pedir(
  porta: number,
  metodo: string,
  caminho: string,
  corpo?: unknown,
): Promise<{ status: number; json: Record<string, any> }> {
  const resposta = await fetch(`http://127.0.0.1:${porta}${caminho}`, {
    method: metodo,
    headers: corpo === undefined ? undefined : { "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const texto = await resposta.text();
  return {
    status: resposta.status,
    json: texto ? (JSON.parse(texto) as Record<string, any>) : {},
  };
}
