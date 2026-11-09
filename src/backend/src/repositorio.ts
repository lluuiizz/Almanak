import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { NoPrograma } from "./arvore.js";
import type { Bloco, Casa, Personagem, Resultado } from "./tipos.js";

export const JOGADOR_LOCAL = "00000000-0000-0000-0000-000000000001";

export interface FaseRegistro {
  id: string;
  ordem: number;
  nome: string;
  conceito: string;
  descricao: string | null;
  largura: number;
  altura: number;
  limiteDePassos: number;
  condicaoDeVitoria: string;
  inicio: Personagem;
  casas: Casa[];
  blocosLiberados: Bloco[];
}

export interface TentativaRegistro {
  id: string;
  jogadorId: string;
  faseId: string;
  semente: number;
  largura: number;
  altura: number;
  limiteDePassos: number;
  inicio: Personagem;
  casas: Casa[];
  programaAtual: NoPrograma[];
  blocosLiberados: Bloco[];
}

export interface ProgressoRegistro {
  fasesConcluidas: string[];
  talento: string | null;
}

export interface Repositorio {
  listarFases(): Promise<FaseRegistro[]>;
  buscarFase(id: string): Promise<FaseRegistro | null>;
  abrirTentativa(fase: FaseRegistro, jogadorId: string, semente: number): Promise<TentativaRegistro>;
  buscarTentativa(id: string): Promise<TentativaRegistro | null>;
  registrarExecucao(tentativa: TentativaRegistro, resultado: Resultado): Promise<string>;
  concluirFase(jogadorId: string, faseId: string, passos: number): Promise<void>;
  buscarProgresso(jogadorId: string): Promise<ProgressoRegistro | null>;
}

interface FaseRow {
  id: string;
  ordem: number;
  nome: string;
  conceito: string;
  descricao: string | null;
  largura: number;
  altura: number;
  limite_de_passos: number;
  condicao_de_vitoria: string;
  inicio_personagem: Personagem;
  casas_base: Casa[];
  blocos_liberados: Bloco[];
}

interface TentativaRow {
  id: string;
  jogador_id: string;
  fase_id: string;
  semente: number;
  largura: number;
  altura: number;
  limite_de_passos: number;
  inicio_personagem: Personagem;
  casas: Casa[];
  programa_atual: NoPrograma[];
  blocos_liberados: Bloco[];
}

export function criarRepositorioPg(pool: Pool): Repositorio {
  return {
    async listarFases() {
      const resultado = await pool.query<FaseRow>(
        `SELECT id, ordem, nome, conceito, descricao, largura, altura,
                limite_de_passos, condicao_de_vitoria,
                inicio_personagem, casas_base, blocos_liberados
         FROM fases
         ORDER BY ordem`,
      );
      return resultado.rows.map(mapearFase);
    },

    async buscarFase(id) {
      const resultado = await pool.query<FaseRow>(
        `SELECT id, ordem, nome, conceito, descricao, largura, altura,
                limite_de_passos, condicao_de_vitoria,
                inicio_personagem, casas_base, blocos_liberados
         FROM fases
         WHERE id = $1`,
        [id],
      );
      const row = resultado.rows[0];
      return row ? mapearFase(row) : null;
    },

    async abrirTentativa(fase, jogadorId, semente) {
      const resultado = await pool.query<{ id: string }>(
        `INSERT INTO tentativas (
           jogador_id, fase_id, semente, largura, altura, limite_de_passos,
           inicio_personagem, casas, programa_atual
         ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, '[]'::jsonb)
         RETURNING id`,
        [
          jogadorId,
          fase.id,
          semente,
          fase.largura,
          fase.altura,
          fase.limiteDePassos,
          JSON.stringify(fase.inicio),
          JSON.stringify(fase.casas),
        ],
      );
      const id = resultado.rows[0].id;
      const tentativa = await this.buscarTentativa(id);
      if (!tentativa) {
        throw new Error("tentativa não encontrada depois da abertura");
      }
      return tentativa;
    },

    async buscarTentativa(id) {
      const resultado = await pool.query<TentativaRow>(
        `SELECT t.id, t.jogador_id, t.fase_id, t.semente, t.largura, t.altura,
                t.limite_de_passos, t.inicio_personagem, t.casas, t.programa_atual,
                f.blocos_liberados
         FROM tentativas t
         JOIN fases f ON f.id = t.fase_id
         WHERE t.id = $1`,
        [id],
      );
      const row = resultado.rows[0];
      return row ? mapearTentativa(row) : null;
    },

    async registrarExecucao(tentativa, resultadoExecucao) {
      const cliente = await pool.connect();
      try {
        await cliente.query("BEGIN");
        const inserida = await cliente.query<{ id: string }>(
          `INSERT INTO execucoes (
             tentativa_id, programa, veredito, passos_executados, eventos, personagem_final
           ) VALUES ($1, $2::jsonb, $3, $4, $5::jsonb, $6::jsonb)
           RETURNING id`,
          [
            tentativa.id,
            JSON.stringify(resultadoExecucao.programa),
            resultadoExecucao.veredito,
            resultadoExecucao.eventos.length,
            JSON.stringify(resultadoExecucao.eventos),
            JSON.stringify(resultadoExecucao.personagem),
          ],
        );
        await cliente.query(
          `UPDATE tentativas
           SET programa_atual = $2::jsonb, atualizada_em = NOW()
           WHERE id = $1`,
          [tentativa.id, JSON.stringify(resultadoExecucao.programa)],
        );
        await cliente.query("COMMIT");
        return inserida.rows[0].id;
      } catch (erro) {
        await cliente.query("ROLLBACK");
        throw erro;
      } finally {
        cliente.release();
      }
    },

    async concluirFase(jogadorId, faseId, passos) {
      await pool.query(
        `INSERT INTO progresso_fases (jogador_id, fase_id, menor_passos)
         VALUES ($1, $2, $3)
         ON CONFLICT (jogador_id, fase_id) DO UPDATE
         SET menor_passos = LEAST(
           COALESCE(progresso_fases.menor_passos, EXCLUDED.menor_passos),
           EXCLUDED.menor_passos
         )`,
        [jogadorId, faseId, passos],
      );
    },

    async buscarProgresso(jogadorId) {
      const jogador = await pool.query<{ talento_id: string | null }>(
        `SELECT talento_id FROM jogadores WHERE id = $1`,
        [jogadorId],
      );
      if (jogador.rows.length === 0) {
        return null;
      }
      const fases = await pool.query<{ fase_id: string }>(
        `SELECT fase_id
         FROM progresso_fases
         WHERE jogador_id = $1
         ORDER BY concluida_em`,
        [jogadorId],
      );
      return {
        fasesConcluidas: fases.rows.map((row) => row.fase_id),
        talento: jogador.rows[0].talento_id,
      };
    },
  };
}

export function criarRepositorioMemoria(opcoes?: { talento?: string | null }): RepositorioMemoria {
  const fases: FaseRegistro[] = [
    {
      id: "fase-1",
      ordem: 1,
      nome: "Tutorial",
      conceito: "Sequência",
      descricao: "Um e dois passos até o destino.",
      largura: 3,
      altura: 1,
      limiteDePassos: 8,
      condicaoDeVitoria: "chegar_no_destino",
      inicio: {
        posicao: { x: 0, y: 0 },
        olhar: "leste",
        vida: 1,
        ataque: 1,
        alforje: [],
      },
      casas: [{ tipo: "vazio" }, { tipo: "vazio", marco: true }, { tipo: "destino" }],
      blocosLiberados: [
        { tipo: "mover", direcao: "esquerda" },
        { tipo: "mover", direcao: "direita" },
        { tipo: "mover", direcao: "cima" },
        { tipo: "mover", direcao: "baixo" },
      ],
    },
  ];
  const tentativas: TentativaRegistro[] = [];
  const execucoes: { id: string; tentativaId: string; resultado: Resultado }[] = [];
  const concluidas: { jogadorId: string; faseId: string; passos: number }[] = [];
  let talento = opcoes?.talento ?? null;

  const repo: RepositorioMemoria = {
    tentativas,
    execucoes,
    definirTalento(valor) {
      talento = valor;
    },
    async listarFases() {
      return fases.map(clonarFase);
    },
    async buscarFase(id) {
      const fase = fases.find((item) => item.id === id);
      return fase ? clonarFase(fase) : null;
    },
    async abrirTentativa(fase, jogadorId, semente) {
      const tentativa: TentativaRegistro = {
        id: randomUUID(),
        jogadorId,
        faseId: fase.id,
        semente,
        largura: fase.largura,
        altura: fase.altura,
        limiteDePassos: fase.limiteDePassos,
        inicio: clonarPersonagem(fase.inicio),
        casas: fase.casas.map((casa) => ({ ...casa })),
        programaAtual: [],
        blocosLiberados: fase.blocosLiberados.map((bloco) => ({ ...bloco })),
      };
      tentativas.push(tentativa);
      return clonarTentativa(tentativa);
    },
    async buscarTentativa(id) {
      const tentativa = tentativas.find((item) => item.id === id);
      return tentativa ? clonarTentativa(tentativa) : null;
    },
    async registrarExecucao(tentativa, resultado) {
      const id = randomUUID();
      execucoes.push({ id, tentativaId: tentativa.id, resultado });
      const guardada = tentativas.find((item) => item.id === tentativa.id);
      if (guardada) {
        guardada.programaAtual = resultado.programa.map((bloco) => ({ ...bloco }));
      }
      return id;
    },
    async concluirFase(jogadorId, faseId, passos) {
      const existente = concluidas.find((item) => item.jogadorId === jogadorId && item.faseId === faseId);
      if (!existente) {
        concluidas.push({ jogadorId, faseId, passos });
        return;
      }
      existente.passos = Math.min(existente.passos, passos);
    },
    async buscarProgresso(jogadorId) {
      if (jogadorId !== JOGADOR_LOCAL) {
        return null;
      }
      return {
        fasesConcluidas: concluidas.filter((item) => item.jogadorId === jogadorId).map((item) => item.faseId),
        talento,
      };
    },
  };

  return repo;
}

export interface RepositorioMemoria extends Repositorio {
  tentativas: TentativaRegistro[];
  execucoes: { id: string; tentativaId: string; resultado: Resultado }[];
  definirTalento(valor: string | null): void;
}

function mapearFase(row: FaseRow): FaseRegistro {
  return {
    id: row.id,
    ordem: row.ordem,
    nome: row.nome,
    conceito: row.conceito,
    descricao: row.descricao,
    largura: row.largura,
    altura: row.altura,
    limiteDePassos: row.limite_de_passos,
    condicaoDeVitoria: row.condicao_de_vitoria,
    inicio: clonarPersonagem(row.inicio_personagem),
    casas: row.casas_base.map((casa) => ({ ...casa })),
    blocosLiberados: row.blocos_liberados.map((bloco) => ({ ...bloco })),
  };
}

function mapearTentativa(row: TentativaRow): TentativaRegistro {
  return {
    id: row.id,
    jogadorId: row.jogador_id,
    faseId: row.fase_id,
    semente: row.semente,
    largura: row.largura,
    altura: row.altura,
    limiteDePassos: row.limite_de_passos,
    inicio: clonarPersonagem(row.inicio_personagem),
    casas: row.casas.map((casa) => ({ ...casa })),
    programaAtual: Array.isArray(row.programa_atual) ? row.programa_atual : [],
    blocosLiberados: row.blocos_liberados.map((bloco) => ({ ...bloco })),
  };
}

function clonarFase(fase: FaseRegistro): FaseRegistro {
  return {
    ...fase,
    inicio: clonarPersonagem(fase.inicio),
    casas: fase.casas.map((casa) => ({ ...casa })),
    blocosLiberados: fase.blocosLiberados.map((bloco) => ({ ...bloco })),
  };
}

function clonarTentativa(tentativa: TentativaRegistro): TentativaRegistro {
  return {
    ...tentativa,
    inicio: clonarPersonagem(tentativa.inicio),
    casas: tentativa.casas.map((casa) => ({ ...casa })),
    programaAtual: tentativa.programaAtual.map((bloco) => ({ ...bloco }) as NoPrograma),
    blocosLiberados: tentativa.blocosLiberados.map((bloco) => ({ ...bloco })),
  };
}

function clonarPersonagem(personagem: Personagem): Personagem {
  return {
    ...personagem,
    posicao: { ...personagem.posicao },
    alforje: [...personagem.alforje],
  };
}
