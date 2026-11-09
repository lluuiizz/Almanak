# Planejamento das Sprints — Almanak

Jogo em que o aluno monta blocos de programação e vê um personagem executar o programa num mapa. A ideia, as doze fases e o quadro já estão no repositório.

- Repositório: <https://github.com/lluuiizz/Almanak>
- Quadro: <https://github.com/users/lluuiizz/projects/5/views/1>
- Regras da disciplina: [roteiro de planejamento](https://github.com/alinebrito/eng-software-2/blob/main/roteiros/planejamento-projeto.md)

O grupo ainda não tem `docs/requisitos.md`. As histórias abaixo são as que as issues e o README já descrevem.

## 1. Equipe e Papéis

| Integrante | Papel na Sprint 1 |
| --- | --- |
| Daniel Bigonha | Product Owner e front |
| Luiz Guilherme Costa da Silva | Desenvolvedor (API) |
| Lucas de Oliveira Barboza | Desenvolvedor (motor) |
| Rafael Stylita | Testes |
| Arthur Teixeira | Banco |

**Capacidade:** 5 integrantes, sprint de 2 semanas. O grupo não registrou horas por pessoa. O corte da sprint corrente é a fase 1 funcionando de ponta a ponta, não as doze fases do README.

**Apresentação final:** 16/12/2026, no fim da Sprint 4.

## 2. Calendário e Milestones

| Sprint | Início | Fim | Objetivo | Milestone |
| --- | --- | --- | --- | --- |
| 1 | 22/10/2026 | 04/11/2026 | Repositório, integração contínua, banco no Docker e base do frontend prontos para a fase 1 | [Sprint 1](https://github.com/lluuiizz/Almanak/milestone/1) |
| 2 | 05/11/2026 | 18/11/2026 | O jogador monta os movimentos da fase 1, aperta Play e o servidor diz se chegou ao destino | [Sprint 2](https://github.com/lluuiizz/Almanak/milestone/2) |
| 3 | 19/11/2026 | 02/12/2026 | O jogador completa a curva e desvia do muro com um sensor e um se | [Sprint 3](https://github.com/lluuiizz/Almanak/milestone/3) |
| 4 | 03/12/2026 | 16/12/2026 | Testes, correções e apresentação, sem funcionalidade nova | [Sprint 4](https://github.com/lluuiizz/Almanak/milestone/4) |

Todos os milestones: <https://github.com/lluuiizz/Almanak/milestones>

O milestone com prazo em 04/11/2026 foi criado pelo grupo com o título Sprint 2. O título passou a ser Sprint 1 para coincidir com o calendário do roteiro. As issues #53, #58 e #59 continuam nele.

## 3. Backlog por Sprint

### Sprint 1 — [milestone](https://github.com/lluuiizz/Almanak/milestone/1)

Preparação que o grupo já distribuiu para a revisão de 04/11. As issues #47 e #48 repetem a modelagem e o Docker das issues #52 e #53.

| História | Tarefas | Responsável | Issue |
| --- | --- | --- | --- |
| Fundação | Estruturar o repositório e o .gitignore | Rafael Stylita | [#59](https://github.com/lluuiizz/Almanak/issues/59) |
| Fundação | Subir a pipeline de CI | Rafael Stylita | [#58](https://github.com/lluuiizz/Almanak/issues/58) |
| Banco | Subir o Postgres no Docker Compose | Rafael Stylita | [#53](https://github.com/lluuiizz/Almanak/issues/53) |
| Banco | Modelar os dados e validar com o Luiz e o Lucas | Arthur Teixeira | [#52](https://github.com/lluuiizz/Almanak/issues/52) |
| Front | Configurar React, Vite, TypeScript e o Dockerfile | Daniel Bigonha | [#57](https://github.com/lluuiizz/Almanak/issues/57) |
| Fundação | Apontar o README para o quadro | Luiz Guilherme Costa da Silva | [#42](https://github.com/lluuiizz/Almanak/issues/42) |

### Sprint 2 — [milestone](https://github.com/lluuiizz/Almanak/milestone/2)

Sprint corrente. A fase 1 é a linha `P`, `X` e destino. Um movimento à direita para no X. Dois vencem. Sair do mapa encerra a tentativa e o programa continua na tela. O cliente não decide a vitória.

| História | Tarefas | Responsável | Issue |
| --- | --- | --- | --- |
| Fase 1 | Definir stack, pastas e o contrato da API | Luiz Guilherme Costa da Silva | [#2](https://github.com/lluuiizz/Almanak/issues/2) |
| Fase 1 | Representar a árvore de blocos compartilhada | Luiz Guilherme Costa da Silva | [#3](https://github.com/lluuiizz/Almanak/issues/3) |
| Fase 1 | Expor catálogo, abertura da tentativa e execução | Luiz Guilherme Costa da Silva | [#18](https://github.com/lluuiizz/Almanak/issues/18) |
| Fase 1 | Modelar fase e tentativa | Lucas de Oliveira Barboza | [#4](https://github.com/lluuiizz/Almanak/issues/4) |
| Fase 1 | Simular a grade, o olhar e o movimento | Lucas de Oliveira Barboza | [#5](https://github.com/lluuiizz/Almanak/issues/5) |
| Fase 1 | Executar uma sequência plana, um passo por bloco | Lucas de Oliveira Barboza | [#6](https://github.com/lluuiizz/Almanak/issues/6) |
| Fase 1 | Encerrar a tentativa e preservar o programa | Lucas de Oliveira Barboza | [#7](https://github.com/lluuiizz/Almanak/issues/7) |
| Fase 1 | Publicar o mapa do tutorial | Lucas de Oliveira Barboza | [#30](https://github.com/lluuiizz/Almanak/issues/30) |
| Fase 1 | Montar a tela com programador, paleta, mapa e Play | Daniel Bigonha | [#20](https://github.com/lluuiizz/Almanak/issues/20) |
| Fase 1 | Arrastar, reordenar e remover os blocos de movimento | Daniel Bigonha | [#21](https://github.com/lluuiizz/Almanak/issues/21) |
| Fase 1 | Animar o personagem só depois do Play | Daniel Bigonha | [#22](https://github.com/lluuiizz/Almanak/issues/22) |
| Fase 1 | Explicar o fim da tentativa e oferecer outra | Daniel Bigonha | [#27](https://github.com/lluuiizz/Almanak/issues/27) |
| Banco | Escrever os scripts de inicialização do schema | Arthur Teixeira | [#54](https://github.com/lluuiizz/Almanak/issues/54) |
| Fase 1 | Revisar os testes de aceitação do tutorial | Rafael Stylita | [#30](https://github.com/lluuiizz/Almanak/issues/30) |

A issue #49 repete a #54.

### Sprints seguintes

As Sprints 3 e 4 têm só o objetivo na tabela acima. O backlog de cada uma entra no planejamento da própria sprint.

Histórias já escritas no quadro e ainda fora destas duas sprints:

| Sprint | Histórias previstas |
| --- | --- |
| 3 | Fase 2, a curva ([#31](https://github.com/lluuiizz/Almanak/issues/31)); fase 3, o muro ([#32](https://github.com/lluuiizz/Almanak/issues/32)); sensor ([#8](https://github.com/lluuiizz/Almanak/issues/8)); condicional ([#9](https://github.com/lluuiizz/Almanak/issues/9)); mapa desenhado ([#23](https://github.com/lluuiizz/Almanak/issues/23)) |
| 4 | Nenhuma funcionalidade nova: testes, correções e apresentação |

Laço, rotina, variável, alforje, talento e as fases 4 a 12 continuam no quadro. Entram numa sprint quando a fase 1 e o muro estiverem fechados. Não entram na Sprint 4.
