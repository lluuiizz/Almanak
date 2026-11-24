import type { NomeSensor, NoPrograma } from "./arvore.js";

export type Direcao = "norte" | "leste" | "sul" | "oeste";

export type TipoCasa =
  | "vazio"
  | "parede"
  | "destino"
  | "inimigo"
  | "item"
  | "porta"
  | "espinhos"
  | "armadilha";

export interface Casa {
  tipo: TipoCasa;
  marco?: boolean;
  resistencia?: number;
  dano?: number;
  conteudo?: string;
}

export interface Posicao {
  x: number;
  y: number;
}

export interface Personagem {
  posicao: Posicao;
  olhar: Direcao;
  vida: number;
  ataque: number;
  alforje: string[];
}

export type Bloco =
  | { tipo: "mover"; direcao: "esquerda" | "direita" | "cima" | "baixo" }
  | { tipo: "virar"; sentido: "esquerda" | "direita" }
  | { tipo: "avancar" }
  | { tipo: "atacar" }
  | { tipo: "pegar" };

export type ItemDeCatalogo = Bloco | { tipo: "se" } | { tipo: "sensor"; nome: NomeSensor };

export type Veredito =
  | "sem_vitoria"
  | "vitoria"
  | "parede"
  | "inimigo"
  | "vida_zerada"
  | "limite_de_passos";

export type Caminho = (number | "entao" | "senao" | "senaoSe")[];

export type RamoEscolhido =
  | { tipo: "entao" }
  | { tipo: "senaoSe"; indice: number }
  | { tipo: "senao" }
  | { tipo: "nenhum" };

export type Evento =
  | { tipo: "acao"; caminho: Caminho; bloco: Bloco; personagem: Personagem; veredito: Veredito }
  | { tipo: "ramo"; caminho: Caminho; ramo: RamoEscolhido; personagem: Personagem; veredito: Veredito };

export interface Fase {
  id: string;
  largura: number;
  altura: number;
  casas: Casa[];
  blocosLiberados: ItemDeCatalogo[];
  inicio: Personagem;
  limiteDePassos: number;
  condicaoDeVitoria: "chegar_no_destino";
}

export interface Mundo {
  largura: number;
  altura: number;
  casas: Casa[];
}

export interface Tentativa extends Mundo {
  semente: number;
  faseId: string;
  inicio: Personagem;
  limiteDePassos: number;
  programa: NoPrograma[];
  talento?: string | null;
}

export interface Progresso {
  fasesConcluidas: string[];
  talento: string | null;
}

export interface Resultado {
  eventos: Evento[];
  veredito: Veredito;
  personagem: Personagem;
  programa: NoPrograma[];
}
