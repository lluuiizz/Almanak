# Modelagem de Banco de Dados — Almanak

Esta modelagem foi construída a partir do `README.md`, do planejamento em `docs/sprints.md` (Issues `#52`, `#53` e `#54`) e dos tipos implementados no backend em `src/backend/src/tipos.ts` e `src/backend/src/fase1.ts`.

## 1. Premissas de Arquitetura

1. **SGBD:** PostgreSQL 15 (`postgres:15-alpine` definido no `docker-compose.yml`).
2. **Isolamento de rede:** O banco (`db`) fica na rede interna `backend_net` junto com o `backend`. O container `frontend` fica apenas na rede `frontend_net`, sem acesso direto ao banco de dados.
3. **Servidor como fonte da verdade:** O servidor sorteia a tentativa (`semente`), armazena o mapa instanciado, recebe a árvore de blocos (`programa`), executa e devolve a lista de `eventos` e o `veredito`.
4. **Uso estratégico de `JSONB`:** A grade do mapa (`casas`), a paleta de blocos (`blocos_liberados`) e a árvore do programa (`programa` — que a partir da Fase 3 possui aninhamento com `se/senão`, `enquanto`, `repetir` e `rotinas`) são armazenadas em `JSONB`, mantendo compatibilidade direta com as interfaces `Fase`, `Tentativa` e `Resultado` do TypeScript.

---

## 2. Diagrama Entidade-Relacionamento (DER)

```mermaid
erDiagram
    TALENTOS ||--o{ JOGADORES : "escolhido por (constante)"
    JOGADORES ||--o{ PROGRESSO_FASES : "conclui"
    FASES ||--o{ PROGRESSO_FASES : "concluída em"
    JOGADORES ||--o{ TENTATIVAS : "abre"
    FASES ||--o{ TENTATIVAS : "instancia"
    TENTATIVAS ||--o{ EXECUCOES : "executa (Play)"

    TALENTOS {
        varchar id PK "Ex: pulso_firme, olhar_atento"
        varchar nome "Nome exibido no medalhão"
        text descricao "Regra do talento"
        varchar constante_chave "Ex: DANO_TALENTO"
        integer constante_valor "Ex: 1 (somente leitura)"
        varchar sensor_liberado "Ex: armadilha_frente"
    }

    JOGADORES {
        uuid id PK "Default: jogador local padrão"
        varchar nome "Nome ou apelido"
        varchar talento_id FK "Nullable até concluir Fase 9"
        timestamptz criado_em
        timestamptz atualizado_em
    }

    FASES {
        varchar id PK "Ex: fase-1 .. fase-12"
        smallint ordem UK "1 a 12 (progressão)"
        varchar nome "Ex: Tutorial, A curva, O muro"
        varchar conceito "Ex: Sequência, se e sensor"
        smallint largura "Largura da grade"
        smallint altura "Altura da grade"
        smallint limite_de_passos "Corte contra loop infinito"
        boolean tem_neblina "True na Fase 5 (Corredor cego)"
        varchar condicao_de_vitoria "Default: chegar_no_destino"
        jsonb inicio_personagem "Posição, olhar, vida, ataque, alforje"
        jsonb casas_base "Array de Casa (ou template para sorteio)"
        jsonb blocos_liberados "Paleta permitida na fase"
    }

    PROGRESSO_FASES {
        uuid jogador_id PK, FK
        varchar fase_id PK, FK
        timestamptz concluida_em
        smallint menor_passos "Melhor marca de passos"
    }

    TENTATIVAS {
        uuid id PK
        uuid jogador_id FK
        varchar fase_id FK
        integer semente "Seed do sorteio (portão, guarda, alforje)"
        smallint largura
        smallint altura
        smallint limite_de_passos
        jsonb inicio_personagem "Estado inicial clonado na tentativa"
        jsonb casas "Mapa resolvido após aplicar a semente"
        jsonb programa_atual "Última árvore de blocos montada"
        timestamptz criada_em
        timestamptz atualizada_em
    }

    EXECUCOES {
        uuid id PK
        uuid tentativa_id FK
        jsonb programa "Árvore de blocos enviada no Play"
        veredito_execucao veredito "vitoria | parede | inimigo | vida_zerada | limite_de_passos | sem_vitoria"
        smallint passos_executados "Quantidade de eventos gerados"
        jsonb eventos "Lista ordenada de Evento para animação"
        jsonb personagem_final "Estado do personagem ao final"
        timestamptz executada_em
    }
```

---

## 3. Estrutura de Arquivos do Banco

- `src/database/init/01-schema.sql`: Criação de extensões, tipos enumerados (`direcao_olhar`, `veredito_execucao`), tabelas e índices.
- `src/database/init/02-seeds.sql`: Carga inicial dos talentos, jogador padrão e Fase 1 (*Tutorial*).

Ambos os arquivos são montados automaticamente em `/docker-entrypoint-initdb.d` quando o container `almanak-db` é inicializado pelo `docker compose up`.

