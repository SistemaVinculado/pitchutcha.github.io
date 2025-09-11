---
layout: artigo
title: "Estruturas de Dados: Pilhas vs. Filas"
category: Estruturas de Dados
icon: compare_arrows
excerpt: "Uma análise detalhada das diferenças, operações e casos de uso de Pilhas (LIFO) e Filas (FIFO), duas das estruturas de dados lineares mais fundamentais."
image: "https://placehold.co/600x400/e9d5ff/7e22ce?text=Pilhas+vs+Filas"
---

No mundo das estruturas de dados, a forma como os elementos são adicionados e removidos de uma coleção define seu comportamento e sua utilidade. Pilhas e Filas são duas das estruturas de dados lineares mais simples e poderosas, mas que operam com base em princípios opostos. Entender a diferença entre elas é crucial para resolver uma vasta gama de problemas computacionais.

## Pilhas (Stacks): O Último a Entrar é o Primeiro a Sair (LIFO)

Uma Pilha funciona com base no princípio **LIFO (Last-In, First-Out)**. A melhor analogia é uma pilha de pratos: o último prato que você coloca no topo é o primeiro que você retira. Você não consegue pegar um prato do meio ou da base sem antes remover todos os que estão acima dele.

As operações principais de uma Pilha são:
* **Push:** Adicionar um elemento ao topo da pilha.
* **Pop:** Remover e retornar o elemento do topo da pilha.
* **Peek (ou Top):** Olhar o elemento do topo sem removê-lo.

Em Python, uma lista (`list`) pode ser usada para simular uma pilha de forma muito eficiente, pois as operações `append()` (push) e `pop()` no final da lista são rápidas.

{% highlight python %}
# Usando uma lista como uma Pilha em Python
pilha_de_livros = []

# Operação Push (empilhar)
print("Empilhando livros...")
pilha_de_livros.append("O Senhor dos Anéis")
pilha_de_livros.append("Duna")
pilha_de_livros.append("Fundação")
print(f"Pilha atual: {pilha_de_livros}")

# Operação Pop (desempilhar)
print("\nDesempilhando o último livro adicionado...")
livro_retirado = pilha_de_livros.pop()
print(f"Livro retirado: {livro_retirado}")
print(f"Pilha atual: {pilha_de_livros}")

# Operação Peek (espiar o topo)
topo_da_pilha = pilha_de_livros[-1]
print(f"\nO livro no topo agora é: {topo_da_pilha}")
# Saída:
# Empilhando livros...
# Pilha atual: ['O Senhor dos Anéis', 'Duna', 'Fundação']

# Desempilhando o último livro adicionado...
# Livro retirado: Fundação
# Pilha atual: ['O Senhor dos Anéis', 'Duna']

# O livro no topo agora é: Duna
{% endhighlight %}

**Casos de uso comuns:** O mecanismo de "Voltar" (Undo) em editores de texto, o histórico de navegação de um browser e a pilha de chamadas de funções em programação.

## Filas (Queues): O Primeiro a Entrar é o Primeiro a Sair (FIFO)

Uma Fila, por outro lado, opera sob o princípio **FIFO (First-In, First-Out)**. A analogia perfeita é uma fila de supermercado: a primeira pessoa que chega ao caixa é a primeira a ser atendida e a sair.

As operações principais de uma Fila são:
* **Enqueue:** Adicionar um elemento ao final da fila.
* **Dequeue:** Remover e retornar o elemento do início da fila.

Embora seja possível usar uma lista do Python para simular uma fila, não é eficiente, pois remover elementos do início da lista (`pop(0)`) é uma operação lenta (O(n)). A forma correta e performática é usar a estrutura `deque` (double-ended queue) da biblioteca `collections`.

{% highlight python %}
from collections import deque

# Usando deque para uma Fila eficiente em Python
fila_de_atendimento = deque()

# Operação Enqueue (enfileirar)
print("Clientes chegando na fila...")
fila_de_atendimento.append("Cliente A")
fila_de_atendimento.append("Cliente B")
fila_de_atendimento.append("Cliente C")
print(f"Fila atual: {list(fila_de_atendimento)}")

# Operação Dequeue (desenfileirar)
print("\nAtendendo o primeiro cliente da fila...")
cliente_atendido = fila_de_atendimento.popleft() # Remove da esquerda (início)
print(f"Cliente atendido: {cliente_atendido}")
print(f"Fila atual: {list(fila_de_atendimento)}")

# Próximo a ser atendido
proximo_cliente = fila_de_atendimento[0]
print(f"\nO próximo cliente na fila é: {proximo_cliente}")
# Saída:
# Clientes chegando na fila...
# Fila atual: ['Cliente A', 'Cliente B', 'Cliente C']

# Atendendo o primeiro cliente da fila...
# Cliente atendido: Cliente A
# Fila atual: ['Cliente B', 'Cliente C']

# O próximo cliente na fila é: Cliente B
{% endhighlight %}

**Casos de uso comuns:** Gerenciamento de tarefas em um sistema operacional, filas de impressão, e processamento de requisições em um servidor web.

## Resumo da Comparação: Pilha vs. Fila

| Característica      | Pilha (Stack)                                      | Fila (Queue)                                       |
| ------------------- | -------------------------------------------------- | -------------------------------------------------- |
| **Princípio** | LIFO (Last-In, First-Out)                          | FIFO (First-In, First-Out)                         |
| **Analogia** | Pilha de pratos                                    | Fila de supermercado                               |
| **Operação Principal** | `push` (adicionar no topo), `pop` (remover do topo) | `enqueue` (adicionar no fim), `dequeue` (remover do início) |
| **Implementação** | Eficiente com `list` em Python (`append`/`pop`)    | Eficiente com `collections.deque` (`append`/`popleft`) |
| **Casos de Uso** | Desfazer, histórico de navegador, chamadas de função. | Fila de impressão, gerenciamento de processos (CPU). |

A escolha entre uma pilha e uma fila depende exclusivamente da ordem em que você precisa processar os dados. Se a ordem de chegada é importante, use uma Fila. Se o item mais recente é o mais relevante, uma Pilha é a escolha certa.
