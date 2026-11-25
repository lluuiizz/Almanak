-- ============================================================================
-- ALMANAK - Schema Inicial do Banco de Dados (PostgreSQL 15)
-- Executado automaticamente via /docker-entrypoint-initdb.d/
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tipos Enumerados (alinhados com src/backend/src/tipos.ts)
DO $$ BEGIN
    CREATE TYPE direcao_olhar AS ENUM ('norte', 'leste', 'sul', 'oeste');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE veredito_execucao AS ENUM (
        'sem_vitoria',
        'vitoria',
        'parede',
        'inimigo',
        'vida_zerada',
        'limite_de_passos'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de Talentos (Constantes permanentes - Fase 11)
CREATE TABLE IF NOT EXISTS talentos (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    constante_chave VARCHAR(50),
    constante_valor INTEGER,
    sensor_liberado VARCHAR(50)
);

-- 3. Tabela de Jogadores (Progresso geral e talento ativo)
CREATE TABLE IF NOT EXISTS jogadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL DEFAULT 'Jogador Local',
    talento_id VARCHAR(50) REFERENCES talentos(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabela de Fases (Catálogo das 12 fases do README)
CREATE TABLE IF NOT EXISTS fases (
    id VARCHAR(30) PRIMARY KEY,
    ordem SMALLINT NOT NULL UNIQUE CHECK (ordem >= 1 AND ordem <= 12),
    nome VARCHAR(100) NOT NULL,
    conceito VARCHAR(100) NOT NULL,
    descricao TEXT,
    enunciado TEXT NOT NULL,
    dica TEXT,
    largura SMALLINT NOT NULL CHECK (largura > 0),
    altura SMALLINT NOT NULL CHECK (altura > 0),
    limite_de_passos SMALLINT NOT NULL DEFAULT 8 CHECK (limite_de_passos > 0),
    tem_neblina BOOLEAN NOT NULL DEFAULT FALSE,
    condicao_de_vitoria VARCHAR(50) NOT NULL DEFAULT 'chegar_no_destino',
    inicio_personagem JSONB NOT NULL,
    casas_base JSONB NOT NULL,
    blocos_liberados JSONB NOT NULL
);

-- Migração idempotente para bancos Postgres já criados anteriormente pelo Compose
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fases') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fases' AND column_name = 'enunciado') THEN
            ALTER TABLE fases ADD COLUMN enunciado TEXT;
            UPDATE fases
            SET enunciado = 'Player, o seu objetivo é chegar até o quadrado escrito Destino. Para isso você dispõe das seguintes ações: mover-se à direita, mover-se à esquerda, mover-se para cima/baixo. Arraste os blocos de ações para o "Programador de ações" e aperte o botão de Play para que inicie a sequência.'
            WHERE id = 'fase-1';
            UPDATE fases SET enunciado = '' WHERE enunciado IS NULL;
            ALTER TABLE fases ALTER COLUMN enunciado SET NOT NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fases' AND column_name = 'dica') THEN
            ALTER TABLE fases ADD COLUMN dica TEXT;
            UPDATE fases
            SET dica = 'Um único bloco "mover-se à direita" faz o personagem dar um passo e parar no marco X. Coloque dois blocos "mover-se à direita" e aperte Play para alcançar o Destino!'
            WHERE id = 'fase-1';
        END IF;
    END IF;
END $$;

-- 5. Tabela de Progresso por Fase (fasesConcluidas: string[])
CREATE TABLE IF NOT EXISTS progresso_fases (
    jogador_id UUID NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
    fase_id VARCHAR(30) NOT NULL REFERENCES fases(id) ON DELETE CASCADE,
    concluida_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    menor_passos SMALLINT CHECK (menor_passos > 0),
    PRIMARY KEY (jogador_id, fase_id)
);

-- 6. Tabela de Tentativas (Interface Tentativa)
CREATE TABLE IF NOT EXISTS tentativas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jogador_id UUID NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
    fase_id VARCHAR(30) NOT NULL REFERENCES fases(id) ON DELETE CASCADE,
    semente INTEGER NOT NULL DEFAULT 1,
    largura SMALLINT NOT NULL CHECK (largura > 0),
    altura SMALLINT NOT NULL CHECK (altura > 0),
    limite_de_passos SMALLINT NOT NULL CHECK (limite_de_passos > 0),
    inicio_personagem JSONB NOT NULL,
    casas JSONB NOT NULL,
    programa_atual JSONB NOT NULL DEFAULT '[]'::jsonb,
    criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tentativas_jogador_fase
    ON tentativas(jogador_id, fase_id);

-- 7. Tabela de Execuções / Histórico de Plays (Interface Resultado)
CREATE TABLE IF NOT EXISTS execucoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tentativa_id UUID NOT NULL REFERENCES tentativas(id) ON DELETE CASCADE,
    programa JSONB NOT NULL,
    veredito veredito_execucao NOT NULL,
    passos_executados SMALLINT NOT NULL DEFAULT 0,
    eventos JSONB NOT NULL,
    personagem_final JSONB NOT NULL,
    executada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execucoes_tentativa
    ON execucoes(tentativa_id);

