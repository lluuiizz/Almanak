import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import type { Server } from "node:http";
import { criarServidor } from "./aplicacao.js";
import { JOGADOR_LOCAL, criarRepositorioMemoria, type RepositorioMemoria } from "./repositorio.js";

describe("API da fase 1", { concurrency: false }, () => {
  let servidor: Server;
  let porta: number;
  let repo: RepositorioMemoria;

  before(async () => {
    repo = criarRepositorioMemoria({ talento: "pulso_firme" });
    servidor = criarServidor(repo);
    await new Promise<void>((resolve) => {
      servidor.listen(0, "127.0.0.1", resolve);
    });
    const endereco = servidor.address() as AddressInfo;
    porta = endereco.port;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      servidor.close((erro) => (erro ? reject(erro) : resolve()));
    });
  });

  it("lista a fase 1 e os quatro movimentos", async () => {
    const resposta = await pedir(porta, "GET", "/fases");

    assert.equal(resposta.status, 200);
    assert.equal(resposta.json.fases.length, 1);
    assert.equal(resposta.json.fases[0].id, "fase-1");
    assert.deepEqual(
      resposta.json.fases[0].blocosLiberados.map((bloco: { direcao: string }) => bloco.direcao),
      ["esquerda", "direita", "cima", "baixo"],
    );
  });

  it("abre a tentativa com semente e estado inicial visível", async () => {
    const resposta = await pedir(porta, "POST", "/fases/fase-1/tentativas", {});

    assert.equal(resposta.status, 201);
    assert.equal(resposta.json.semente, 1);
    assert.equal(resposta.json.faseId, "fase-1");
    assert.deepEqual(resposta.json.estadoInicial.personagem.posicao, { x: 0, y: 0 });
    assert.deepEqual(
      resposta.json.estadoInicial.casas.map((casa: { tipo: string; marco?: boolean }) =>
        casa.tipo === "destino" ? "destino" : casa.marco ? "X" : "vazio",
      ),
      ["vazio", "X", "destino"],
    );
  });

  it("executa dois passos até a vitória e um passo para no X", async () => {
    const abertura = await pedir(porta, "POST", "/fases/fase-1/tentativas", {});
    const id = abertura.json.id as string;

    const umPasso = await pedir(porta, "POST", `/tentativas/${id}/execucoes`, {
      programa: [{ tipo: "mover", direcao: "direita" }],
    });
    assert.equal(umPasso.status, 201);
    assert.equal(umPasso.json.veredito, "sem_vitoria");
    assert.deepEqual(umPasso.json.personagem.posicao, { x: 1, y: 0 });
    assert.equal(umPasso.json.eventos.length, 1);

    const doisPassos = await pedir(porta, "POST", `/tentativas/${id}/execucoes`, {
      programa: [
        { tipo: "mover", direcao: "direita" },
        { tipo: "mover", direcao: "direita" },
      ],
    });
    assert.equal(doisPassos.status, 201);
    assert.equal(doisPassos.json.veredito, "vitoria");
    assert.deepEqual(doisPassos.json.personagem.posicao, { x: 2, y: 0 });
    assert.deepEqual(
      doisPassos.json.eventos.map((evento: { veredito: string }) => evento.veredito),
      ["sem_vitoria", "vitoria"],
    );
  });

  it("reexecuta a mesma tentativa no mesmo mapa sorteado", async () => {
    const abertura = await pedir(porta, "POST", "/fases/fase-1/tentativas", {});
    const id = abertura.json.id as string;
    const casasAntes = JSON.stringify(abertura.json.estadoInicial.casas);
    const semente = abertura.json.semente;

    await pedir(porta, "POST", `/tentativas/${id}/execucoes`, {
      programa: [{ tipo: "mover", direcao: "cima" }],
    });
    const deNovo = await pedir(porta, "GET", `/tentativas/${id}`);

    assert.equal(deNovo.json.semente, semente);
    assert.equal(JSON.stringify(deNovo.json.estadoInicial.casas), casasAntes);
    assert.deepEqual(deNovo.json.estadoInicial.personagem.posicao, { x: 0, y: 0 });
    assert.equal(deNovo.json.programaAtual.length, 1);
  });

  it("recusa bloco não liberado sem gravar execução nem mudar o mundo", async () => {
    const abertura = await pedir(porta, "POST", "/fases/fase-1/tentativas", {});
    const id = abertura.json.id as string;
    const antes = repo.tentativas.find((item) => item.id === id);
    const casas = JSON.stringify(antes?.casas);
    const inicio = JSON.stringify(antes?.inicio);
    const execucoes = repo.execucoes.length;

    const resposta = await pedir(porta, "POST", `/tentativas/${id}/execucoes`, {
      programa: [{ tipo: "atacar" }],
    });

    const depois = repo.tentativas.find((item) => item.id === id);
    assert.equal(resposta.status, 422);
    assert.equal(resposta.json.erro, "bloco_nao_liberado");
    assert.equal(JSON.stringify(depois?.casas), casas);
    assert.equal(JSON.stringify(depois?.inicio), inicio);
    assert.equal(depois?.programaAtual.length, 0);
    assert.equal(repo.execucoes.length, execucoes);
  });

  it("recusa encaixe inválido sem gravar execução", async () => {
    const abertura = await pedir(porta, "POST", "/fases/fase-1/tentativas", {});
    const id = abertura.json.id as string;
    const execucoes = repo.execucoes.length;

    const sensorNoCorpo = await pedir(porta, "POST", `/tentativas/${id}/execucoes`, {
      programa: [
        {
          tipo: "mover",
          direcao: "direita",
          corpo: [{ tipo: "sensor", nome: "parede_frente" }],
        },
      ],
    });
    const acaoNaPergunta = await pedir(porta, "POST", `/tentativas/${id}/execucoes`, {
      programa: [
        {
          tipo: "se",
          pergunta: { tipo: "mover", direcao: "direita" },
          entao: [],
        },
      ],
    });
    const constante = await pedir(porta, "POST", `/tentativas/${id}/execucoes`, {
      programa: [{ tipo: "valor", nome: "DANO_TALENTO", escrita: true }],
    });

    assert.equal(sensorNoCorpo.status, 422);
    assert.equal(sensorNoCorpo.json.erro, "programa_invalido");
    assert.equal(acaoNaPergunta.status, 422);
    assert.equal(constante.status, 422);
    assert.match(constante.json.mensagem, /constante/);
    assert.equal(repo.execucoes.length, execucoes);
  });

  it("registra a vitória, mantém o talento e renova vida e ataque", async () => {
    const abertura = await pedir(porta, "POST", "/fases/fase-1/tentativas", {});
    await pedir(porta, "POST", `/tentativas/${abertura.json.id}/execucoes`, {
      programa: [
        { tipo: "mover", direcao: "direita" },
        { tipo: "mover", direcao: "direita" },
      ],
    });

    const progresso = await pedir(porta, "GET", `/jogadores/${JOGADOR_LOCAL}/progresso`);
    const seguinte = await pedir(porta, "POST", "/fases/fase-1/tentativas", {});

    assert.equal(progresso.status, 200);
    assert.deepEqual(progresso.json.fasesConcluidas, ["fase-1"]);
    assert.equal(progresso.json.talento, "pulso_firme");
    assert.equal(seguinte.json.estadoInicial.personagem.vida, 1);
    assert.equal(seguinte.json.estadoInicial.personagem.ataque, 1);
  });
});

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
