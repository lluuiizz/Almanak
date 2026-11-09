import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { BlocoNaoLiberado, ProgramaInvalido, exigirAcoesLiberadas, validarPrograma } from "./arvore.js";
import { executar } from "./motor.js";
import {
  JOGADOR_LOCAL,
  type FaseRegistro,
  type Repositorio,
  type TentativaRegistro,
} from "./repositorio.js";
import type { Resultado, Tentativa } from "./tipos.js";

const LIMITE_CORPO = 1_000_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ErroHttp extends Error {
  constructor(
    readonly status: number,
    mensagem: string,
    readonly codigo: string,
    readonly entrada?: unknown,
  ) {
    super(mensagem);
    this.name = "ErroHttp";
  }
}

interface ContextoRequisicao {
  metodo: string;
  caminho: string;
  entrada: unknown;
}

export function criarServidor(repo: Repositorio): Server {
  return createServer((req, res) => {
    void atender(repo, req, res);
  });
}

async function atender(repo: Repositorio, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const ctx: ContextoRequisicao = {
    metodo: req.method ?? "GET",
    caminho: req.url ?? "/",
    entrada: null,
  };

  try {
    if (ctx.metodo === "POST" || ctx.metodo === "PUT" || ctx.metodo === "PATCH") {
      ctx.entrada = await lerJson(req);
    }
    if (ctx.metodo === "OPTIONS") {
      responder(ctx, res, 204, null);
      return;
    }
    await rotear(repo, ctx, res);
  } catch (erro) {
    if (erro instanceof ProgramaInvalido) {
      responder(ctx, res, 422, { erro: erro.codigo, mensagem: erro.message });
      return;
    }
    if (erro instanceof BlocoNaoLiberado) {
      responder(ctx, res, 422, { erro: erro.codigo, mensagem: erro.message });
      return;
    }
    if (erro instanceof ErroHttp) {
      if (erro.entrada !== undefined) {
        ctx.entrada = erro.entrada;
      }
      responder(ctx, res, erro.status, { erro: erro.codigo, mensagem: erro.message });
      return;
    }
    console.error(erro);
    responder(ctx, res, 500, { erro: "erro_interno", mensagem: "falha ao processar a requisição" });
  }
}

async function rotear(repo: Repositorio, ctx: ContextoRequisicao, res: ServerResponse): Promise<void> {
  const url = new URL(ctx.caminho, "http://localhost");
  const partes = url.pathname.split("/").filter(Boolean);
  const metodo = ctx.metodo;

  if (metodo === "GET" && partes.length === 1 && partes[0] === "saude") {
    responder(ctx, res, 200, { status: "ok" });
    return;
  }

  if (metodo === "GET" && partes.length === 1 && partes[0] === "fases") {
    const fases = await repo.listarFases();
    responder(ctx, res, 200, { fases: fases.map(corpoFase) });
    return;
  }

  if (metodo === "GET" && partes.length === 2 && partes[0] === "fases") {
    const fase = await repo.buscarFase(decodeURIComponent(partes[1]));
    if (!fase) {
      throw new ErroHttp(404, "fase não encontrada", "nao_encontrado");
    }
    responder(ctx, res, 200, corpoFase(fase));
    return;
  }

  if (metodo === "POST" && partes.length === 3 && partes[0] === "fases" && partes[2] === "tentativas") {
    const fase = await repo.buscarFase(decodeURIComponent(partes[1]));
    if (!fase) {
      throw new ErroHttp(404, "fase não encontrada", "nao_encontrado");
    }
    const tentativa = await repo.abrirTentativa(fase, JOGADOR_LOCAL, 1);
    responder(ctx, res, 201, corpoTentativa(tentativa));
    return;
  }

  if (metodo === "GET" && partes.length === 2 && partes[0] === "tentativas") {
    const tentativa = await buscarTentativa(repo, partes[1]);
    responder(ctx, res, 200, corpoTentativa(tentativa));
    return;
  }

  if (metodo === "POST" && partes.length === 3 && partes[0] === "tentativas" && partes[2] === "execucoes") {
    const tentativa = await buscarTentativa(repo, partes[1]);
    const programaInformado = objeto(ctx.entrada).programa;
    const execucao = await executarPrograma(repo, tentativa, programaInformado);
    responder(ctx, res, 201, execucao);
    return;
  }

  if (metodo === "GET" && partes.length === 3 && partes[0] === "jogadores" && partes[2] === "progresso") {
    if (!UUID.test(partes[1])) {
      throw new ErroHttp(404, "jogador não encontrado", "nao_encontrado");
    }
    const progresso = await repo.buscarProgresso(partes[1]);
    if (!progresso) {
      throw new ErroHttp(404, "jogador não encontrado", "nao_encontrado");
    }
    responder(ctx, res, 200, progresso);
    return;
  }

  throw new ErroHttp(404, "rota não encontrada", "nao_encontrado");
}

async function executarPrograma(
  repo: Repositorio,
  tentativa: TentativaRegistro,
  programaInformado: unknown,
): Promise<Resultado & { id: string }> {
  const programa = validarPrograma(programaInformado);
  const acoes = exigirAcoesLiberadas(programa, tentativa.blocosLiberados);
  const resultado = executar(paraMotor(tentativa, acoes));
  const id = await repo.registrarExecucao(tentativa, resultado);
  if (resultado.veredito === "vitoria") {
    await repo.concluirFase(tentativa.jogadorId, tentativa.faseId, resultado.eventos.length);
  }
  return { id, ...resultado };
}

function paraMotor(tentativa: TentativaRegistro, programa: Tentativa["programa"]): Tentativa {
  return {
    semente: tentativa.semente,
    faseId: tentativa.faseId,
    largura: tentativa.largura,
    altura: tentativa.altura,
    casas: tentativa.casas.map((casa) => ({ ...casa })),
    inicio: {
      ...tentativa.inicio,
      posicao: { ...tentativa.inicio.posicao },
      alforje: [...tentativa.inicio.alforje],
    },
    limiteDePassos: tentativa.limiteDePassos,
    programa,
  };
}

async function buscarTentativa(repo: Repositorio, id: string): Promise<TentativaRegistro> {
  if (!UUID.test(id)) {
    throw new ErroHttp(404, "tentativa não encontrada", "nao_encontrado");
  }
  const tentativa = await repo.buscarTentativa(id);
  if (!tentativa) {
    throw new ErroHttp(404, "tentativa não encontrada", "nao_encontrado");
  }
  return tentativa;
}

function corpoFase(fase: FaseRegistro) {
  return {
    id: fase.id,
    ordem: fase.ordem,
    nome: fase.nome,
    conceito: fase.conceito,
    descricao: fase.descricao,
    largura: fase.largura,
    altura: fase.altura,
    limiteDePassos: fase.limiteDePassos,
    condicaoDeVitoria: fase.condicaoDeVitoria,
    inicio: fase.inicio,
    casas: fase.casas,
    blocosLiberados: fase.blocosLiberados,
  };
}

function corpoTentativa(tentativa: TentativaRegistro) {
  return {
    id: tentativa.id,
    faseId: tentativa.faseId,
    jogadorId: tentativa.jogadorId,
    semente: tentativa.semente,
    blocosLiberados: tentativa.blocosLiberados,
    programaAtual: tentativa.programaAtual,
    estadoInicial: {
      largura: tentativa.largura,
      altura: tentativa.altura,
      casas: tentativa.casas,
      personagem: tentativa.inicio,
      limiteDePassos: tentativa.limiteDePassos,
    },
  };
}

function objeto(entrada: unknown): Record<string, unknown> {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
    throw new ErroHttp(400, "corpo json inválido", "json_invalido");
  }
  return entrada as Record<string, unknown>;
}

async function lerJson(req: IncomingMessage): Promise<unknown> {
  const pedacos: Buffer[] = [];
  let total = 0;
  for await (const pedaco of req) {
    const buffer = Buffer.isBuffer(pedaco) ? pedaco : Buffer.from(pedaco);
    total += buffer.length;
    if (total > LIMITE_CORPO) {
      throw new ErroHttp(413, "corpo grande demais", "corpo_grande");
    }
    pedacos.push(buffer);
  }
  const texto = Buffer.concat(pedacos).toString("utf8").trim();
  if (texto.length === 0) {
    return {};
  }
  try {
    return JSON.parse(texto) as unknown;
  } catch {
    throw new ErroHttp(400, "json inválido", "json_invalido", texto);
  }
}

function responder(ctx: ContextoRequisicao, res: ServerResponse, status: number, corpo: unknown): void {
  const cabecalhos: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (corpo === null) {
    res.writeHead(status, cabecalhos);
    res.end();
  } else {
    const json = JSON.stringify(corpo);
    res.writeHead(status, {
      ...cabecalhos,
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": String(Buffer.byteLength(json)),
    });
    res.end(json);
  }
  registrar(ctx, status, corpo);
}

function registrar(ctx: ContextoRequisicao, status: number, corpo: unknown): void {
  const entrada = ctx.metodo === "POST" || ctx.metodo === "PUT" || ctx.metodo === "PATCH" ? ctx.entrada : null;
  process.stdout.write(
    `--> ${ctx.metodo} ${ctx.caminho}\nentrada: ${JSON.stringify(entrada)}\n<-- ${status}\nresposta: ${JSON.stringify(corpo)}\n`,
  );
}
