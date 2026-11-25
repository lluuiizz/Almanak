-- ============================================================================
-- ALMANAK - Migração da Issue #80: enunciado, dica e tem_neblina
-- Adiciona colunas enunciado (obrigatório) e dica (opcional) em fases.
-- Atualiza o seed da fase-1 com enunciado, dica e tem_neblina = false.
-- Preserva todas as tentativas e o progresso gravados no banco já criado.
-- ============================================================================

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

        -- Garante atualização dos valores da fase 1 preservando tentativas e progresso
        UPDATE fases
        SET enunciado = 'Player, o seu objetivo é chegar até o quadrado escrito Destino. Para isso você dispõe das seguintes ações: mover-se à direita, mover-se à esquerda, mover-se para cima/baixo. Arraste os blocos de ações para o "Programador de ações" e aperte o botão de Play para que inicie a sequência.',
            dica = 'Um único bloco "mover-se à direita" faz o personagem dar um passo e parar no marco X. Coloque dois blocos "mover-se à direita" e aperte Play para alcançar o Destino!',
            tem_neblina = FALSE,
            descricao = 'Um e dois passos até o destino.'
        WHERE id = 'fase-1';
    END IF;
END $$;
