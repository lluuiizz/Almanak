import { BlocoNaoLiberado, type NomeSensor } from "./arvore.js";
import { casaEm, vizinha } from "./grade.js";
import type { Casa, Mundo, Personagem, TipoCasa } from "./tipos.js";

const TALENTO_QUE_LIBERA_ARMADILHA = "olhar_atento";

export function exigirSensorConsultavel(nome: NomeSensor, talento: string | null): void {
  if (nome === "armadilha_frente" && talento !== TALENTO_QUE_LIBERA_ARMADILHA) {
    throw new BlocoNaoLiberado();
  }
}

export function lerSensor(nome: NomeSensor, personagem: Personagem, mundo: Mundo): boolean {
  const frente = casaEm(mundo, vizinha(personagem.posicao, personagem.olhar));
  const aqui = casaEm(mundo, personagem.posicao);

  switch (nome) {
    case "parede_frente":
      return frente === null || frente.tipo === "parede";
    case "inimigo_frente":
      return eDoTipo(frente, "inimigo");
    case "armadilha_frente":
      return eDoTipo(frente, "armadilha");
    case "item_aqui":
      return eDoTipo(aqui, "item");
    case "destino":
      return eDoTipo(aqui, "destino");
  }
}

function eDoTipo(casa: Casa | null, tipo: TipoCasa): boolean {
  return casa?.tipo === tipo;
}
