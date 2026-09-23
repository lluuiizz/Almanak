# Almanak

Jogo interativo para a disciplina de Engenharia de Software II. O Almanak ensina os fundamentos da lógica de programação por meio de fases em que o jogador programa as ações de um personagem.

## Ideia geral

O objetivo central é ensinar, de forma quase metafórica, os principais fundamentos da lógica de programação. O jogador não escreve um sistema complexo: ele monta sequências de ações, observa o resultado no mapa e, conforme avança, passa a usar os mesmos conceitos que encontraria em uma linguagem de programação comum.

Conceitos abordados:

- algoritmos;
- variáveis e constantes;
- tipos de dados;
- operadores;
- estruturas de controle;
- funções.

O foco é concretizar esses fundamentos na prática do jogo, e não transformar o Almanak em um ambiente de programação completo.

## Descrição geral do sistema

O Almanak é um jogo de fases. Em cada fase o jogador tem um objetivo no mapa — na fase inicial, chegar ao quadrado marcado como destino — e o alcança montando uma sequência de ações antes de executá-la.

### Fase inicial

A primeira fase apresenta a ideia básica da jogabilidade. O mapa é uma linha com três posições: o jogador, um marco intermediário (X) e o destino.

O jogador dispõe de blocos de movimento ilimitados:

- mover-se à esquerda;
- mover-se à direita;
- mover-se para cima;
- mover-se para baixo.

Ele arrasta os blocos para o **Programador de ações** e aperta o botão **Play** para que a sequência seja executada. As ações só acontecem depois do Play.

No tutorial, um único bloco “mover-se à direita” faz o personagem dar um passo e parar no X. Para concluir a fase, o jogador coloca dois blocos “mover-se à direita” e inicia a sequência, percorrendo o caminho até o destino.

### Interface da fase inicial

A tela reúne três áreas:

| Área | Função |
| --- | --- |
| Programador de ações | Recebe, em ordem, os blocos que formam a sequência a ser executada. |
| Blocos de ação | Lista os comandos disponíveis para arrastar até o programador. |
| Mapa | Mostra a posição atual do jogador, o marco X e o destino. |
| Botão Play | Inicia a execução da sequência montada. |

### Progressão

A cada fase dominada, a dificuldade aumenta: mais blocos a percorrer, paredes no mapa, inimigos a eliminar e outros obstáculos. Os recursos disponíveis também crescem aos poucos.

No começo os blocos são apenas comandos básicos de movimento. Nas fases seguintes o jogador passa a:

- criar estruturas que repetem uma ação (estruturas de controle);
- criar rotinas que executam uma sequência de instruções (funções);
- manipular variáveis do personagem, como vida e poder de ataque;
- gerenciar equipamentos encontrados no jogo como uma coleção de itens (array);
- conhecer constantes por meio de talentos adquiridos ao longo das fases, que modificam atributos do personagem de forma permanente.

## Design conceitual das fases seguintes

As fases abaixo estendem a progressão já descrita. Cada uma entrega um tipo novo de bloco e um mapa em que a ferramenta anterior deixa de bastar. O **Programador de ações** continua sendo o mesmo painel: a diferença é que alguns blocos passam a *envolver* outros, como uma caixa com encaixe interno. Sensores ocupam o espaço de uma pergunta; condicionais e laços ocupam o espaço de uma decisão.

Durante a execução, cada bloco consome um passo. Andar contra uma parede, avançar contra um inimigo ou estourar o limite de passos encerra a tentativa e devolve o personagem ao início da fase, com a sequência intacta para o jogador corrigir. Atacar um quadrado vazio apenas gasta o passo.

### Blocos que passam a existir

| Tipo | Exemplos | Papel na lógica |
| --- | --- | --- |
| Ação | avançar, virar à esquerda, virar à direita, atacar, pegar, usar | Uma instrução. Muda o mundo ou o personagem. |
| Sensor | existe parede à frente?, existe inimigo à frente?, existe item aqui?, cheguei ao destino? | Uma expressão booleana. Lê o mundo e devolve verdadeiro ou falso. |
| Condicional | se … então … senão … | Escolhe um ramo a partir de um sensor ou de uma comparação. |
| Laço contado | repetir N vezes | Repete um trecho um número conhecido de vezes. |
| Laço condicional | enquanto … | Repete um trecho enquanto um sensor continuar verdadeiro. |
| Rotina | definir rotina / chamar rotina | Nomeia uma sequência e a reutiliza. |
| Valor | vida, ataque, alforje, talento | Variável, elemento de array ou constante permanente. |

Os quatro movimentos cardeais da fase inicial permanecem. A partir da fase do muro, o personagem também passa a ter um olhar: a direção do último movimento. “À frente” é sempre esse olhar. Virar à esquerda e virar à direita giram o olhar sem sair do quadrado. Assim o sensor “existe parede à frente?” tem um significado estável, e o jogador consegue desviar sem recalcular esquerda e direita do mapa a cada curva.

### Fase 2 — A curva

Mapa em L. Ainda só sequência, agora longa o bastante para a ordem importar.

```
P → · → · → ·
              ↓
              ·
              ↓
              D
```

Uma solução é quatro vezes “mover-se à direita” e duas vezes “mover-se para baixo”. Descer cedo encosta o personagem na borda e a tentativa acaba. A fase treina algoritmo como ordem de passos, antes de qualquer decisão.

### Fase 3 — O muro

Um muro fecha a reta. O destino está no desvio de baixo.

```
P → · → █
        ↓
        · → · → D
```

O jogador ganha o bloco condicional e o sensor de parede. O bloco `se` é uma caixa: o sensor encaixa na pergunta, e as ações encaixam dentro do ramo.

```
mover-se à direita
mover-se à direita
se (existe parede à frente?)
    mover-se para baixo
    mover-se à direita
    mover-se à direita
    mover-se à direita
```

Andar a terceira vez para a direita, sem consultar o sensor, choca com o muro. A condicional é o desvio: a pergunta é feita no momento da execução, olhando o quadrado que o personagem está encarando.

### Fase 4 — O portão

O mesmo corredor, com uma diferença: o quadrado do muro às vezes é parede e às vezes é passagem. As duas versões aparecem em tentativas diferentes, e o jogador monta uma única sequência para as duas.

```
P → · → [portão] → D
        ↓
        · → · → · → D
```

```
mover-se à direita
mover-se à direita
se (existe parede à frente?)
    mover-se para baixo
    mover-se à direita
    mover-se à direita
    mover-se à direita
senão
    mover-se à direita
```

Quando o portão está fechado, o ramo `então` contorna. Quando está aberto, o ramo `senão` segue em frente. Os dois destinos valem. Uma sequência fixa, sem `senão`, resolve só uma das versões.

### Fase 5 — O corredor cego

Neblina cobre o mapa. O jogador vê apenas os quadrados vizinhos, e o comprimento do corredor muda a cada tentativa: quatro, sete ou nove passos, sempre terminando numa parede, com o destino logo após uma curva à direita.

```
P → · → · → … → █
                  ↓
                  D
```

Contar os passos na mão falha, porque o número não é estável. O bloco novo é o `enquanto`, outra caixa, que segura ações dentro de si e as repete enquanto o sensor responder verdadeiro.

```
enquanto (não existe parede à frente?)
    avançar
virar à direita
avançar
```

A cada volta do laço o sensor é lido de novo. Parede ausente: o personagem avança e o laço recomeça. Parede presente: o laço termina, o personagem vira e entra no destino. O `não` é um operador sobre o booleano do sensor, o primeiro operador do jogo.

Se a condição nunca ficar falsa, o personagem andaria para sempre. A tentativa se encerra ao passar de um limite de passos, com o aviso de que a repetição não encontrou fim. O jogador vê, no próprio mapa, a diferença entre um laço que termina e um laço que não termina.

### Fase 6 — A patrulha

Um guarda ocupa algum quadrado do corredor. A posição sorteia entre as tentativas. Atacar um quadrado vazio gasta o passo e não remove ninguém; avançar contra o guarda encerra a tentativa.

```
P → · → G → · → D
```

Aqui o `enquanto` envolve um `se`. O laço pergunta se o destino já foi alcançado. Dentro dele, outro sensor escolhe a ação daquele passo.

```
enquanto (não cheguei ao destino?)
    se (existe inimigo à frente?)
        atacar
    senão se (existe parede à frente?)
        virar à esquerda
    senão
        avançar
```

O guarda derrotado libera o quadrado. Na volta seguinte o sensor de inimigo responde falso, o sensor de parede também, e o ramo restante avança. É a mesma ideia do portão, repetida até a condição de saída.

### Fase 7 — A escada

O mapa é um motivo que se repete três vezes: dois passos à frente e um para cima. O total é conhecido e está desenhado no chão.

```
P → · ↑
      · → · ↑
            · → · ↑ D
```

```
repetir 3 vezes
    avançar
    avançar
    mover-se para cima
```

`repetir` é o laço de contagem. O jogador já viu o `enquanto` resolver um tamanho desconhecido. Nesta fase o tamanho está dado, e a ferramenta correspondente é o número de voltas. Usar `enquanto (não cheguei ao destino?)` também conclui o mapa; a fase seguinte mostra um caso em que contar é o que cabe, porque o corpo da repetição precisa de um nome.

### Fase 8 — Três alcovas

Três nichos iguais interrompem um corredor. Contornar um nicho exige a mesma sequência de seis blocos, três vezes.

```
P → █ → █ → █ → D
    ↓   ↓   ↓
    ·   ·   ·
```

O jogador ganha rotinas. Uma rotina é uma segunda folha do programador, com nome, que cabe dentro de um bloco “chamar”.

```
rotina contornar
    virar à esquerda
    avançar
    virar à direita
    avançar
    avançar
    virar à direita
    avançar
    virar à esquerda

repetir 3 vezes
    contornar
```

Chamar `contornar` executa o corpo inteiro e volta ao ponto de onde foi chamada. Mudar o desenho do nicho pede edição num lugar só. A rotina é a função: um nome para uma sequência, com entrada implícita (o olhar e a posição atuais) e efeito no mapa.

### Fase 9 — A porta lacrada

O personagem entra com `vida = 5` e `ataque = 1`. Espinhos no desvio tiram 2 de vida. Um baú no outro lado soma 2 ao ataque. A porta do destino só cede a um ataque de 3 ou mais.

```
        [baú]
          ↑
P → · → · · → [porta] → D
    ↓
   espinhos
```

```
mover-se à direita
mover-se à direita
mover-se à direita
se (ataque >= resistência da porta)
    atacar
senão
    mover-se para cima
    pegar
mover-se à direita
atacar
avançar
```

`ataque` e `vida` são variáveis: nascem com um valor, mudam com `pegar` e com o dano, e podem ser comparadas. `>=` é um operador entre dois números e devolve um booleano, no mesmo encaixe em que um sensor encaixa. A porta lê `ataque` na hora do golpe. Pegar a espada antes muda o resultado da comparação.

A vida aparece no painel ao lado do programador. Chegar a 0 encerra a tentativa. O desvio dos espinhos fica disponível para uma segunda solução, mais curta e mais cara, quando o jogador já tiver um talento que aumente a vida inicial.

### Fase 10 — O alforje

O baú da fase anterior vira uma bolsa de quatro espaços. A chave da porta ocupa um espaço sorteado. Os outros três trazem itens que também cabem na mão: tocha, poção, pedra.

```
alforje: [ tocha | pedra | chave | poção ]
```

```
enquanto (não cheguei ao destino?)
    se (algum item do alforje é chave)
        usar chave na porta
        avançar
    senão
        avançar
        pegar
```

O alforje é um array: uma fileira ordenada de itens, com tamanho fixo nesta fase. `algum item do alforje é chave` percorre a fileira. Uma variante mais adiante abre o bloco `para cada item do alforje`, e dentro dele o item da vez pode ser comparado, usado ou guardado de novo. Equipar passa o item escolhido para a variável `mão`, que a ação `atacar` consulta para somar dano.

### Fase 11 — O talento

Ao concluir a porta lacrada, o jogador escolhe um talento permanente. Dois exemplos:

- **Pulso firme.** `DANO_TALENTO = 1`. Todo ataque soma essa constante. Nenhum bloco de fase consegue atribuir outro valor a ela.
- **Olhar atento.** Libera para sempre o sensor `existe armadilha à frente?`.

O talento fica num medalhão, fora da folha de sequência. O programador aceita lê-lo (`ataque + DANO_TALENTO`) e recusa um bloco que tente reescrevê-lo. Durante a fase, `vida` e `ataque` continuam variáveis. O talento permanece constante entre fases, como descrito na progressão: um atributo adquirido que modifica o personagem de forma permanente.

Uma fase curta usa os dois juntos. O chão tem uma armadilha invisível sem o talento, e um guardião com resistência 2.

```
enquanto (não cheguei ao destino?)
    se (existe armadilha à frente?)
        virar à esquerda
        avançar
        virar à direita
    senão se (existe inimigo à frente?)
        atacar
    senão
        avançar
```

Com **Pulso firme**, `ataque` inicial 1 mais `DANO_TALENTO` 1 derruba o guardião num golpe se a fase também oferecer uma poção, ou em dois golpes sem ela. Com **Olhar atento**, o sensor novo evita a armadilha. As duas builds concluem o mapa por caminhos diferentes, e a constante escolhida permanece nas fases posteriores.

### Fase 12 — A encruzilhada

Quatro saídas, um destino, um guarda e uma parede móvel. Nenhum sensor sozinho diz o caminho.

```
        · → D
        ↑
· ← P → [parede móvel]
        ↓
        G
```

O jogador combina booleanos com `e` e `ou`, no mesmo encaixe da pergunta.

```
enquanto (não cheguei ao destino?)
    se (existe parede à frente? e existe passagem à esquerda?)
        virar à esquerda
        avançar
    senão se (existe inimigo à frente? ou vida <= 2)
        recuar
    senão
        avançar
```

`e` só é verdadeiro quando os dois sensores concordam. `ou` basta um. A comparação `vida <= 2` entra na mesma expressão. A fase pede que o jogador leia uma condição composta e preveja o ramo que vai executar em cada quadrado.

### Como os blocos se encaixam

O programador deixa de ser uma lista plana. Blocos-caixa desenham o aninhamento na própria folha:

```
┌ enquanto (não cheguei ao destino?) ──────────────┐
│  ┌ se (existe inimigo à frente?) ─────────────┐  │
│  │    atacar                                   │  │
│  └ senão se (existe parede à frente?) ────────┘  │
│  │    virar à esquerda                          │  │
│  └ senão ──────────────────────────────────────┘  │
│       avançar                                     │
└───────────────────────────────────────────────────┘
```

Sensores e comparações ocupam só o cabeçalho da caixa. Ações e chamadas de rotina ocupam o interior. Uma rotina abre outra folha, com o mesmo tipo de encaixe. O botão **Play** percorre essa árvore de cima para baixo, volta ao topo de um laço quando a condição ainda vale, e salta o ramo que a condição descartou.

### Mapa da progressão conceitual

| Fase | Nome | Conceito novo | Por que entra aqui |
| --- | --- | --- | --- |
| 1 | Tutorial | Sequência | Um e dois passos até o destino. |
| 2 | A curva | Ordem | A sequência fica longa e a ordem passa a importar. |
| 3 | O muro | `se` e sensor | A reta está fechada; é preciso perguntar antes de andar. |
| 4 | O portão | `senão` | A mesma fase tem duas configurações. |
| 5 | O corredor cego | `enquanto` | O tamanho muda; o laço relê “existe parede à frente?”. |
| 6 | A patrulha | `se` dentro de `enquanto` | O guarda aparece num ponto sorteado. |
| 7 | A escada | `repetir N vezes` | O motivo se repete um número visível de vezes. |
| 8 | Três alcovas | Rotina | A mesma sequência ganha um nome e é chamada. |
| 9 | A porta lacrada | Variável, comparação | Vida e ataque mudam, e a porta lê o valor. |
| 10 | O alforje | Array | A chave ocupa uma posição sorteada na bolsa. |
| 11 | O talento | Constante | Um atributo permanente entra na conta e não se reatribui. |
| 12 | A encruzilhada | `e`, `ou` | A decisão depende de mais de um booleano ao mesmo tempo. |

## Integrantes da equipe

<!-- Preencha nome e, se quiser, papel ou matrícula de cada integrante. -->

| Nome | Papel |
| --- | --- |
|  |  |
|  |  |
|  |  |
|  |  |

## Quadro Kanban

<!-- Substitua o endereço abaixo pelo link do quadro da equipe. -->

[Abrir o quadro Kanban](https://)
