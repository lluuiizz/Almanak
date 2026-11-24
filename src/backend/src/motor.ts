import type {
  Bloco,
  Direcao,
  Evento,
  Personagem,
  Resultado,
  Tentativa,
  Veredito,
} from "./tipos.js";
import { casaEm, vizinha } from "./grade.js";
import { clonarPersonagem } from "./personagem.js";

const ORDEM: Direcao[] = ["norte", "leste", "sul", "oeste"];

const MOVIMENTO_PARA_OLHAR = {
  cima: "norte",
  direita: "leste",
  baixo: "sul",
  esquerda: "oeste",
} as const;

export function executar(tentativa: Tentativa): Resultado {
  const inicio = clonarPersonagem(tentativa.inicio);
  let personagem = clonarPersonagem(tentativa.inicio);
  const eventos: Evento[] = [];
  let passos = 0;

  for (const bloco of tentativa.programa) {
    if (personagem.vida <= 0) {
      eventos.push(evento(bloco, personagem, "vida_zerada"));
      return falha(tentativa, eventos, "vida_zerada", inicio);
    }

    if (passos >= tentativa.limiteDePassos) {
      eventos.push(evento(bloco, personagem, "limite_de_passos"));
      return falha(tentativa, eventos, "limite_de_passos", inicio);
    }

    passos += 1;
    const efeito = aplicar(bloco, personagem, tentativa);
    personagem = efeito.personagem;
    const veredito = efeito.veredito ?? "sem_vitoria";
    eventos.push(evento(bloco, personagem, veredito));

    if (veredito === "vitoria") {
      return {
        eventos,
        veredito,
        personagem,
        programa: tentativa.programa,
      };
    }

    if (veredito !== "sem_vitoria") {
      return falha(tentativa, eventos, veredito, inicio);
    }
  }

  return {
    eventos,
    veredito: "sem_vitoria",
    personagem,
    programa: tentativa.programa,
  };
}

function aplicar(
  bloco: Bloco,
  personagem: Personagem,
  tentativa: Tentativa,
): { personagem: Personagem; veredito?: Veredito } {
  if (bloco.tipo === "mover") {
    return andar(personagem, MOVIMENTO_PARA_OLHAR[bloco.direcao], tentativa);
  }

  if (bloco.tipo === "virar") {
    return {
      personagem: { ...clonarPersonagem(personagem), olhar: girar(personagem.olhar, bloco.sentido) },
    };
  }

  if (bloco.tipo === "avancar") {
    return andar(personagem, personagem.olhar, tentativa);
  }

  return { personagem: clonarPersonagem(personagem) };
}

function andar(
  personagem: Personagem,
  direcao: Direcao,
  tentativa: Tentativa,
): { personagem: Personagem; veredito?: Veredito } {
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
  const indice = ORDEM.indexOf(olhar);
  const giro = sentido === "direita" ? 1 : -1;
  return ORDEM[(indice + giro + ORDEM.length) % ORDEM.length];
}

function evento(bloco: Bloco, personagem: Personagem, veredito: Veredito): Evento {
  return { bloco, personagem: clonarPersonagem(personagem), veredito };
}

function falha(
  tentativa: Tentativa,
  eventos: Evento[],
  veredito: Veredito,
  inicio: Personagem,
): Resultado {
  return {
    eventos,
    veredito,
    personagem: clonarPersonagem(inicio),
    programa: tentativa.programa,
  };
}
