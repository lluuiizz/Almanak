import type { Bloco } from "./tipos.js";

export const SENSORES = [
  "parede_frente",
  "inimigo_frente",
  "item_aqui",
  "destino",
  "armadilha_frente",
] as const;

export const CONSTANTES = ["DANO_TALENTO"] as const;

export const OPERADORES_COMPARACAO = [">=", "<=", ">", "<", "==", "!="] as const;

export type NomeSensor = (typeof SENSORES)[number];
export type OperadorComparacao = (typeof OPERADORES_COMPARACAO)[number];

export type Valor =
  | { tipo: "valor"; nome: string }
  | { tipo: "numero"; valor: number };

export type Expressao =
  | { tipo: "sensor"; nome: NomeSensor }
  | { tipo: "nao"; operando: Expressao }
  | { tipo: "e"; esquerda: Expressao; direita: Expressao }
  | { tipo: "ou"; esquerda: Expressao; direita: Expressao }
  | {
      tipo: "comparacao";
      operador: OperadorComparacao;
      esquerda: Valor;
      direita: Valor;
    };

export interface RamoCondicional {
  pergunta: Expressao;
  entao: NoPrograma[];
}

export type NoPrograma =
  | Bloco
  | { tipo: "valor"; nome: string; escrita: true }
  | { tipo: "se"; pergunta: Expressao; entao: NoPrograma[]; senaoSe?: RamoCondicional[]; senao?: NoPrograma[] }
  | { tipo: "enquanto"; pergunta: Expressao; corpo: NoPrograma[] }
  | { tipo: "repetir"; vezes: number; corpo: NoPrograma[] }
  | { tipo: "rotina"; nome: string; corpo: NoPrograma[] }
  | { tipo: "chamar"; nome: string };

export class ProgramaInvalido extends Error {
  readonly codigo = "programa_invalido";

  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ProgramaInvalido";
  }
}

export class BlocoNaoLiberado extends Error {
  readonly codigo = "bloco_nao_liberado";

  constructor() {
    super("bloco não liberado na fase");
    this.name = "BlocoNaoLiberado";
  }
}

const TIPOS_ACAO = new Set(["mover", "virar", "avancar", "atacar", "pegar"]);

export function validarPrograma(entrada: unknown): NoPrograma[] {
  if (!Array.isArray(entrada)) {
    throw new ProgramaInvalido("o programa precisa ser uma lista de blocos");
  }

  return entrada.map((item) => validarPasso(item));
}

export function exigirAcoesLiberadas(programa: NoPrograma[], liberados: Bloco[]): Bloco[] {
  return programa.map((no) => {
    if (!ehAcao(no) || !liberados.some((item) => mesmaAcao(item, no))) {
      throw new BlocoNaoLiberado();
    }
    return no;
  });
}

export function mesmaAcao(a: Bloco, b: Bloco): boolean {
  if (a.tipo !== b.tipo) {
    return false;
  }
  if (a.tipo === "mover" && b.tipo === "mover") {
    return a.direcao === b.direcao;
  }
  if (a.tipo === "virar" && b.tipo === "virar") {
    return a.sentido === b.sentido;
  }
  return true;
}

function ehAcao(no: NoPrograma): no is Bloco {
  return TIPOS_ACAO.has(no.tipo);
}

function validarPasso(entrada: unknown): NoPrograma {
  const obj = objeto(entrada, "bloco inválido");
  const tipo = textoTipo(obj);

  if (tipo === "sensor" || tipo === "nao" || tipo === "e" || tipo === "ou" || tipo === "comparacao") {
    throw new ProgramaInvalido("sensor no corpo de uma ação");
  }

  if (TIPOS_ACAO.has(tipo)) {
    return validarAcao(obj, tipo);
  }

  if (tipo === "valor") {
    return validarAtribuicao(obj);
  }

  if (tipo === "se") {
    return {
      tipo: "se",
      pergunta: validarPergunta(obj.pergunta),
      entao: listaDePassos(obj.entao, "entao"),
      senaoSe: validarSenaoSe(obj.senaoSe),
      senao: obj.senao === undefined ? undefined : listaDePassos(obj.senao, "senao"),
    };
  }

  if (tipo === "enquanto") {
    return {
      tipo: "enquanto",
      pergunta: validarPergunta(obj.pergunta),
      corpo: listaDePassos(obj.corpo, "corpo"),
    };
  }

  if (tipo === "repetir") {
    return {
      tipo: "repetir",
      vezes: vezesInteiras(obj.vezes),
      corpo: listaDePassos(obj.corpo, "corpo"),
    };
  }

  if (tipo === "rotina") {
    return {
      tipo: "rotina",
      nome: nomeObrigatorio(obj.nome),
      corpo: listaDePassos(obj.corpo, "corpo"),
    };
  }

  if (tipo === "chamar") {
    recusarFilhos(obj);
    return { tipo: "chamar", nome: nomeObrigatorio(obj.nome) };
  }

  throw new ProgramaInvalido("bloco desconhecido");
}

function validarAcao(obj: Record<string, unknown>, tipo: string): Bloco {
  recusarFilhos(obj);

  if (tipo === "mover") {
    if (!eDirecao(obj.direcao)) {
      throw new ProgramaInvalido("direção de movimento inválida");
    }
    return { tipo: "mover", direcao: obj.direcao };
  }

  if (tipo === "virar") {
    if (obj.sentido !== "esquerda" && obj.sentido !== "direita") {
      throw new ProgramaInvalido("sentido de virar inválido");
    }
    return { tipo: "virar", sentido: obj.sentido };
  }

  if (tipo === "avancar") {
    return { tipo: "avancar" };
  }
  if (tipo === "atacar") {
    return { tipo: "atacar" };
  }
  if (tipo === "pegar") {
    return { tipo: "pegar" };
  }

  throw new ProgramaInvalido("bloco desconhecido");
}

function validarAtribuicao(obj: Record<string, unknown>): NoPrograma {
  recusarFilhos(obj);
  const nome = nomeObrigatorio(obj.nome);
  if (obj.escrita !== true) {
    throw new ProgramaInvalido("valor não é um passo");
  }
  if ((CONSTANTES as readonly string[]).includes(nome)) {
    throw new ProgramaInvalido("escrita numa constante");
  }
  return { tipo: "valor", nome, escrita: true };
}

function validarPergunta(entrada: unknown): Expressao {
  const obj = objeto(entrada, "pergunta inválida");
  const tipo = textoTipo(obj);
  if (
    TIPOS_ACAO.has(tipo) ||
    tipo === "se" ||
    tipo === "enquanto" ||
    tipo === "repetir" ||
    tipo === "rotina" ||
    tipo === "chamar" ||
    tipo === "valor"
  ) {
    throw new ProgramaInvalido("ação no lugar da pergunta");
  }
  return validarExpressao(obj);
}

function validarExpressao(obj: Record<string, unknown>): Expressao {
  const tipo = textoTipo(obj);

  if (tipo === "sensor") {
    if (!eSensor(obj.nome)) {
      throw new ProgramaInvalido("sensor desconhecido");
    }
    return { tipo: "sensor", nome: obj.nome };
  }

  if (tipo === "nao") {
    return { tipo: "nao", operando: validarPergunta(obj.operando) };
  }

  if (tipo === "e") {
    return {
      tipo: "e",
      esquerda: validarPergunta(obj.esquerda),
      direita: validarPergunta(obj.direita),
    };
  }

  if (tipo === "ou") {
    return {
      tipo: "ou",
      esquerda: validarPergunta(obj.esquerda),
      direita: validarPergunta(obj.direita),
    };
  }

  if (tipo === "comparacao") {
    if (!eOperador(obj.operador)) {
      throw new ProgramaInvalido("operador de comparação inválido");
    }
    return {
      tipo: "comparacao",
      operador: obj.operador,
      esquerda: validarValor(obj.esquerda),
      direita: validarValor(obj.direita),
    };
  }

  throw new ProgramaInvalido("pergunta inválida");
}

function validarValor(entrada: unknown): Valor {
  const obj = objeto(entrada, "valor inválido");
  const tipo = textoTipo(obj);
  if (tipo === "numero") {
    if (typeof obj.valor !== "number" || !Number.isFinite(obj.valor)) {
      throw new ProgramaInvalido("número inválido");
    }
    return { tipo: "numero", valor: obj.valor };
  }
  if (tipo === "valor") {
    if (obj.escrita === true) {
      throw new ProgramaInvalido(
        typeof obj.nome === "string" && (CONSTANTES as readonly string[]).includes(obj.nome)
          ? "escrita numa constante"
          : "ação no lugar da pergunta",
      );
    }
    return { tipo: "valor", nome: nomeObrigatorio(obj.nome) };
  }
  throw new ProgramaInvalido("ação no lugar da pergunta");
}

function validarSenaoSe(entrada: unknown): RamoCondicional[] | undefined {
  if (entrada === undefined) {
    return undefined;
  }
  if (!Array.isArray(entrada)) {
    throw new ProgramaInvalido("senão se precisa ser uma lista");
  }
  return entrada.map((item) => {
    const ramo = objeto(item, "ramo inválido");
    return {
      pergunta: validarPergunta(ramo.pergunta),
      entao: listaDePassos(ramo.entao, "entao"),
    };
  });
}

function listaDePassos(entrada: unknown, campo: string): NoPrograma[] {
  if (!Array.isArray(entrada)) {
    throw new ProgramaInvalido(`${campo} precisa ser uma lista de blocos`);
  }
  return entrada.map((item) => validarPasso(item));
}

function recusarFilhos(obj: Record<string, unknown>): void {
  if (
    obj.corpo !== undefined ||
    obj.entao !== undefined ||
    obj.senao !== undefined ||
    obj.senaoSe !== undefined ||
    obj.pergunta !== undefined
  ) {
    throw new ProgramaInvalido("sensor no corpo de uma ação");
  }
}

function objeto(entrada: unknown, mensagem: string): Record<string, unknown> {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
    throw new ProgramaInvalido(mensagem);
  }
  return entrada as Record<string, unknown>;
}

function textoTipo(obj: Record<string, unknown>): string {
  if (typeof obj.tipo !== "string" || obj.tipo.length === 0) {
    throw new ProgramaInvalido("bloco sem tipo");
  }
  return obj.tipo;
}

function nomeObrigatorio(entrada: unknown): string {
  if (typeof entrada !== "string" || entrada.trim().length === 0) {
    throw new ProgramaInvalido("nome inválido");
  }
  return entrada;
}

function vezesInteiras(entrada: unknown): number {
  if (typeof entrada !== "number" || !Number.isInteger(entrada) || entrada < 1) {
    throw new ProgramaInvalido("repetir exige um número inteiro de vezes");
  }
  return entrada;
}

function eDirecao(entrada: unknown): entrada is "esquerda" | "direita" | "cima" | "baixo" {
  return entrada === "esquerda" || entrada === "direita" || entrada === "cima" || entrada === "baixo";
}

function eSensor(entrada: unknown): entrada is NomeSensor {
  return typeof entrada === "string" && (SENSORES as readonly string[]).includes(entrada);
}

function eOperador(entrada: unknown): entrada is OperadorComparacao {
  return typeof entrada === "string" && (OPERADORES_COMPARACAO as readonly string[]).includes(entrada);
}
