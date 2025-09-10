---
layout: artigo
title: "Visão Geral de Estruturas de Dados"
category: Estruturas de Dados
icon: account_tree
excerpt: "Explore estruturas de dados comuns como arrays, listas ligadas, pilhas, filas e árvores, e entenda sua importância na resolução eficiente de problemas."
image: "https://placehold.co/600x400/D1FAE5/047857?text=Estruturas+de+Dados"
---

<article>
    <h1 class="text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-5xl">Visão Geral de Estruturas de Dados</h1>
    <p class="mt-6 text-lg text-[var(--text-secondary)]">
        Estruturas de dados são um conceito fundamental na ciência da computação, fornecendo uma maneira de organizar, gerenciar e armazenar dados de forma eficaz. A escolha da estrutura de dados correta é crucial para o desenvolvimento de algoritmos eficientes e aplicações de alto desempenho. Esta visão geral apresenta algumas das estruturas de dados mais comuns.
    </p>
    <section class="pt-10" id="arrays">
        <h2 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Arrays</h2>
        <p class="mt-4 mb-6 text-lg text-[var(--text-secondary)]">
            Um array (ou vetor) é uma coleção de itens armazenados em locais de memória contíguos. É a estrutura de dados mais simples, onde cada elemento pode ser acessado aleatoriamente usando seu número de índice. Em Python, a estrutura de dados mais comum para simular um array é a lista.
        </p>
{% highlight python %}
# Exemplo de um array (usando uma lista em Python)
numeros = [10, 20, 30, 40, 50]

# Acesso a um elemento pelo índice (operação O(1))
primeiro_elemento = numeros[0]  # Retorna 10

# Adicionar um elemento no final (geralmente O(1))
numeros.append(60)

print(numeros)
# Saída: [10, 20, 30, 40, 50, 60]
{% endhighlight %}
    </section>
    <section class="pt-10" id="linked-lists">
        <h2 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Listas Ligadas</h2>
        <p class="mt-4 mb-6 text-lg text-[var(--text-secondary)]">
            Uma lista ligada (ou encadeada) é uma estrutura de dados linear onde os elementos não são armazenados em locais de memória contíguos. Os elementos (nós) são conectados usando ponteiros. Elas são eficientes para inserções e exclusões no início da lista, mas mais lentas para buscas.
        </p>
{% highlight python %}
# Definição de um Nó para a Lista Ligada
class Node:
    def __init__(self, data):
        self.data = data  # O dado armazenado no nó
        self.next = None  # O ponteiro para o próximo nó

# Criando uma lista ligada simples: 1 -> 2 -> 3
head = Node(1)
segundo_no = Node(2)
terceiro_no = Node(3)

head.next = segundo_no       # O nó 'head' aponta para o segundo nó
segundo_no.next = terceiro_no # O segundo nó aponta para o terceiro
{% endhighlight %}
    </section>
    <section class="pt-10" id="stacks-and-queues">
        <h2 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Pilhas e Filas</h2>
        <p class="mt-4 text-lg text-[var(--text-secondary)]">
            Pilhas (stacks) e filas (queues) são tipos abstratos de dados que podem ser implementados usando arrays ou listas ligadas. Uma pilha segue o princípio LIFO (Last-In, First-Out - o último a entrar é o primeiro a sair), como uma pilha de pratos. Uma fila segue o princípio FIFO (First-In, First-Out - o primeiro a entrar é o primeiro a sair), como uma fila de caixa numa loja.
        </p>
    </section>
</article>
