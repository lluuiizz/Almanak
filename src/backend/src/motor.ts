import { ProgramaInvalido, type Expressao, type NoPrograma } from "./arvore.js";
import { casaEm, vizinha } from "./grade.js";
import { clonarPersonagem } from "./personagem.js";
import { exigirSensorConsultavel, lerSensor } from "./sensores.js";
import type {
  Bloco,
  Caminho,
  Direcao,
  Evento,
  Personagem,
  RamoEscolhido,
  Resultado,
  Tentativa,
  Veredito,
} from "./tipos.js";

type NoSe = Extract<NoPrograma, { tipo: "se" }>;

interface Efeito {
  personagem: Personagem;
  veredito?: Veredito;
}

interface Execucao {
  readonly tentativa: Tentativa;
  readonly eventos: Evento[];
  personagem: Personagem;
  passos: number;
  fim: Veredito | null;
}

interface Escolha {
  ramo: RamoEscolhido;
  corpo: NoPrograma[];
  caminho: Caminho;
}

const ORDEM: Direcao[] = ["norte", "leste", "sul", "oeste"];

const MOVIMENTO_PARA_OLHAR = {
  cima: "norte",
  direita: "leste",
  baixo: "sul",
  esquerda: "oeste",
} as const;

export function executar(tentativa: Tentativa): Resultado {
  exigirExecutavel(tentativa.programa, tentativa.talento ?? null);

  const execucao: Execucao = {
    tentativa,
    eventos: [],
    personagem: clonarPersonagem(tentativa.inicio),
    passos: 0,
    fim: null,
  };
  executarLista(execucao, tentativa.programa, []);

  const veredito = execucao.fim ?? "sem_vitoria";
  const falhou = veredito !== "sem_vitoria" && veredito !== "vitoria";
  return {
    eventos: execucao.eventos,
    veredito,
    personagem: clonarPersonagem(falhou ? tentativa.inicio : execucao.personagem),
    programa: tentativa.programa,
  };
}

function exigirExecutavel(nos: NoPrograma[], talento: string | null): void {
  for (const no of nos) {
    switch (no.tipo) {
      case "mover":
      case "virar":
      case "avancar":
      case "atacar":
      case "pegar":
        break;
      case "se":
        exigirPerguntaAvaliavel(no.pergunta, talento);
        exigirExecutavel(no.entao, talento);
        for (const ramo of no.senaoSe ?? []) {
          exigirPerguntaAvaliavel(ramo.pergunta, talento);
          exigirExecutavel(ramo.entao, talento);
        }
        exigirExecutavel(no.senao ?? [], talento);
        break;
      default:
        throw new ProgramaInvalido(`o motor ainda não executa ${no.tipo}`);
    }
  }
}

function exigirPerguntaAvaliavel(pergunta: Expressao, talento: string | null): void {
  if (pergunta.tipo !== "sensor") {
    throw new ProgramaInvalido(`o motor ainda não avalia ${pergunta.tipo}`);
  }
  exigirSensorConsultavel(pergunta.nome, talento);
}

function executarLista(execucao: Execucao, nos: NoPrograma[], caminho: Caminho): void {
  for (const [indice, no] of nos.entries()) {
    executarNo(execucao, no, [...caminho, indice]);
    if (execucao.fim) {
      return;
    }
  }
}

function executarNo(execucao: Execucao, no: NoPrograma, caminho: Caminho): void {
  switch (no.tipo) {
    case "mover":
    case "virar":
    case "avancar":
    case "atacar":
    case "pegar":
      executarAcao(execucao, no, caminho);
      return;
    case "se":
      executarSe(execucao, no, caminho);
      return;
    default:
      throw new ProgramaInvalido(`o motor ainda não executa ${no.tipo}`);
  }
}

function executarAcao(execucao: Execucao, bloco: Bloco, caminho: Caminho): void {
  const interrupcao = interrupcaoAntesDoPasso(execucao);
  if (interrupcao) {
    registrarAcao(execucao, caminho, bloco, interrupcao);
    return;
  }

  execucao.passos += 1;
  const efeito = aplicar(bloco, execucao.personagem, execucao.tentativa);
  execucao.personagem = efeito.personagem;
  registrarAcao(execucao, caminho, bloco, efeito.veredito ?? "sem_vitoria");
}

function executarSe(execucao: Execucao, no: NoSe, caminho: Caminho): void {
  const escolha = escolherRamo(execucao, no);
  registrarRamo(execucao, caminho, escolha.ramo);
  executarLista(execucao, escolha.corpo, [...caminho, ...escolha.caminho]);
}

function escolherRamo(execucao: Execucao, no: NoSe): Escolha {
  if (avaliar(execucao, no.pergunta)) {
    return { ramo: { tipo: "entao" }, corpo: no.entao, caminho: ["entao"] };
  }

  for (const [indice, ramo] of (no.senaoSe ?? []).entries()) {
    if (avaliar(execucao, ramo.pergunta)) {
      return { ramo: { tipo: "senaoSe", indice }, corpo: ramo.entao, caminho: ["senaoSe", indice, "entao"] };
    }
  }

  if (no.senao) {
    return { ramo: { tipo: "senao" }, corpo: no.senao, caminho: ["senao"] };
  }

  return { ramo: { tipo: "nenhum" }, corpo: [], caminho: [] };
}

function avaliar(execucao: Execucao, pergunta: Expressao): boolean {
  if (pergunta.tipo !== "sensor") {
    throw new ProgramaInvalido(`o motor ainda não avalia ${pergunta.tipo}`);
  }
  return lerSensor(pergunta.nome, execucao.personagem, execucao.tentativa);
}

function interrupcaoAntesDoPasso(execucao: Execucao): Veredito | null {
  if (execucao.personagem.vida <= 0) {
    return "vida_zerada";
  }
  if (execucao.passos >= execucao.tentativa.limiteDePassos) {
    return "limite_de_passos";
  }
  return null;
}

function registrarAcao(execucao: Execucao, caminho: Caminho, bloco: Bloco, veredito: Veredito): void {
  execucao.eventos.push({ tipo: "acao", caminho, bloco, personagem: clonarPersonagem(execucao.personagem), veredito });
  if (veredito !== "sem_vitoria") {
    execucao.fim = veredito;
  }
}

function registrarRamo(execucao: Execucao, caminho: Caminho, ramo: RamoEscolhido): void {
  execucao.eventos.push({
    tipo: "ramo",
    caminho,
    ramo,
    personagem: clonarPersonagem(execucao.personagem),
    veredito: "sem_vitoria",
  });
}

function aplicar(bloco: Bloco, personagem: Personagem, tentativa: Tentativa): Efeito {
  switch (bloco.tipo) {
    case "mover":
      return andar(personagem, MOVIMENTO_PARA_OLHAR[bloco.direcao], tentativa);
    case "virar":
      return { personagem: { ...clonarPersonagem(personagem), olhar: girar(personagem.olhar, bloco.sentido) } };
    case "avancar":
      return andar(personagem, personagem.olhar, tentativa);
    case "atacar":
    case "pegar":
      return { personagem: clonarPersonagem(personagem) };
  }
}

function andar(personagem: Personagem, direcao: Direcao, tentativa: Tentativa): Efeito {
  const alvo = vizinha(personagem.posicao, direcao);
  const virado = { ...clonarPersonagem(personagem), olhar: direcao };
  const casa = casaEm(tentativa, alvo);

  if (casa === null || casa.tipo === "parede") {
    return { personagem: virado, veredito: "parede" };
  }
  if (casa.tipo === "inimigo") {
    return { personagem: virado, veredito: "inimigo" };
  }

  const avancou = { ...virado, posicao: alvo };
  if (casa.tipo === "destino") {
    return { personagem: avancou, veredito: "vitoria" };
  }
  return { personagem: avancou };
}

function girar(olhar: Direcao, sentido: "esquerda" | "direita"): Direcao {
  const giro = sentido === "direita" ? 1 : -1;
  return ORDEM[(ORDEM.indexOf(olhar) + giro + ORDEM.length) % ORDEM.length];
}
