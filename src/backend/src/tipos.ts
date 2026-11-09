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

export type Veredito =
  | "sem_vitoria"
  | "vitoria"
  | "parede"
  | "inimigo"
  | "vida_zerada"
  | "limite_de_passos";

export interface Evento {
  bloco: Bloco;
  personagem: Personagem;
  veredito: Veredito;
}

export interface Fase {
  id: string;
  largura: number;
  altura: number;
  casas: Casa[];
  blocosLiberados: Bloco[];
  inicio: Personagem;
  limiteDePassos: number;
  condicaoDeVitoria: "chegar_no_destino";
}

export interface Tentativa {
  semente: number;
  faseId: string;
  largura: number;
  altura: number;
  casas: Casa[];
  inicio: Personagem;
  limiteDePassos: number;
  programa: Bloco[];
}

export interface Progresso {
  fasesConcluidas: string[];
  talento: string | null;
}

export interface Resultado {
  eventos: Evento[];
  veredito: Veredito;
  personagem: Personagem;
  programa: Bloco[];
}
