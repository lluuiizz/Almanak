-- ============================================================================
-- ALMANAK - Seeds Iniciais (Talentos, Jogador Local e Catálogo da Fase 1)
-- Executado automaticamente via /docker-entrypoint-initdb.d/
-- ============================================================================

INSERT INTO talentos (id, nome, descricao, constante_chave, constante_valor, sensor_liberado)
VALUES
    ('pulso_firme', 'Pulso firme', 'DANO_TALENTO = 1. Todo ataque soma essa constante.', 'DANO_TALENTO', 1, NULL),
    ('olhar_atento', 'Olhar atento', 'Libera para sempre o sensor existe armadilha à frente?.', NULL, NULL, 'armadilha_frente')
ON CONFLICT (id) DO NOTHING;

-- Jogador padrão para persistência local (Issue #19)
INSERT INTO jogadores (id, nome, talento_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'Jogador Local', NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed da Fase 1 (idêntica à constante FASE_1 em src/backend/src/fase1.ts)
INSERT INTO fases (
    id, ordem, nome, conceito, descricao,
    largura, altura, limite_de_passos, tem_neblina, condicao_de_vitoria,
    inicio_personagem, casas_base, blocos_liberados
) VALUES (
    'fase-1',
    1,
    'Tutorial',
    'Sequência',
    'Um e dois passos até o destino.',
    3,
    1,
    8,
    FALSE,
    'chegar_no_destino',
    '{"posicao": {"x": 0, "y": 0}, "olhar": "leste", "vida": 1, "ataque": 1, "alforje": []}'::jsonb,
    '[{"tipo": "vazio"}, {"tipo": "vazio", "marco": true}, {"tipo": "destino"}]'::jsonb,
    '[{"tipo": "mover", "direcao": "esquerda"}, {"tipo": "mover", "direcao": "direita"}, {"tipo": "mover", "direcao": "cima"}, {"tipo": "mover", "direcao": "baixo"}]'::jsonb
) ON CONFLICT (id) DO NOTHING;

