---
layout: artigo
title: "Estruturas de Dados: Pilhas vs. Filas"
category: Estruturas de Dados
icon: compare_arrows
excerpt: "Uma análise detalhada das diferenças, operações e casos de uso de Pilhas (LIFO) e Filas (FIFO), duas das estruturas de dados lineares mais fundamentais."
image: "https://placehold.co/600x400/e9d5ff/7e22ce?text=Pilhas+vs+Filas"
---

<article>
    <h1 class="text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-5xl">Estruturas de Dados: Pilhas vs. Filas</h1>
    <p class="mt-6 text-lg text-[var(--text-secondary)]">
        No mundo das estruturas de dados, a forma como os elementos são adicionados e removidos de uma coleção define seu comportamento e sua utilidade. Pilhas e Filas são duas das estruturas de dados lineares mais simples e poderosas, mas que operam com base em princípios opostos. Entender a diferença entre elas é crucial para resolver uma vasta gama de problemas computacionais.
    </p>
    <section class="pt-10" id="pilhas">
        <h2 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Pilhas (Stacks): O Último a Entrar é o Primeiro a Sair (LIFO)</h2>
        <p class="mt-4 mb-6 text-lg text-[var(--text-secondary)]">
            Uma Pilha funciona com base no princípio <strong>LIFO (Last-In, First-Out)</strong>. A melhor analogia é uma pilha de pratos: o último prato que você coloca no topo é o primeiro que você retira. Você não consegue pegar um prato do meio ou da base sem antes remover todos os que estão acima dele.
            <br><br>
            As operações principais de uma Pilha são:
            <ul class="list-disc pl-5 mt-4 text-lg text-[var(--text-secondary)]">
                <li><strong>Push:</strong> Adicionar um elemento ao topo da pilha.</li>
                <li><strong>Pop:</strong> Remover e retornar o elemento do topo da pilha.</li>
                <li><strong>Peek (ou Top):</strong> Olhar o elemento do topo sem removê-lo.</li>
            </ul>
            <br>
            Em Python, uma lista (<code>list</code>) pode ser usada para simular uma pilha de forma muito eficiente, pois as operações <code>append()</code> (push) e <code>pop()</code> no final da lista são rápidas.
        </p>
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
{% endhighlight %}
        <p class="mt-4 mb-6 text-lg text-[var(--text-secondary)]">
            <strong>Casos de uso comuns:</strong> O mecanismo de "Voltar" (Undo) em editores de texto, o histórico de navegação de um browser e a pilha de chamadas de funções em programação.
        </p>
    </section>
    <section class="pt-10" id="filas">
        <h2 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Filas (Queues): O Primeiro a Entrar é o Primeiro a Sair (FIFO)</h2>
        <p class="mt-4 mb-6 text-lg text-[var(--text-secondary)]">
            Uma Fila, por outro lado, opera sob o princípio <strong>FIFO (First-In, First-Out)</strong>. A analogia perfeita é uma fila de supermercado: a primeira pessoa que chega ao caixa é a primeira a ser atendida e a sair.
            <br><br>
            As operações principais de uma Fila são:
            <ul class="list-disc pl-5 mt-4 text-lg text-[var(--text-secondary)]">
                <li><strong>Enqueue:</strong> Adicionar um elemento ao final da fila.</li>
                <li><strong>Dequeue:</strong> Remover e retornar o elemento do início da fila.</li>
            </ul>
            <br>
            Embora seja possível usar uma lista do Python para simular uma fila, não é eficiente. A forma correta e performática é usar a estrutura <code>deque</code> da biblioteca <code>collections</code>.
        </p>
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
{% endhighlight %}
        <p class="mt-4 mb-6 text-lg text-[var(--text-secondary)]">
            <strong>Casos de uso comuns:</strong> Gerenciamento de tarefas em um sistema operacional, filas de impressão, e processamento de requisições em um servidor web.
        </p>
    </section>
    <section class="pt-10" id="comparacao">
        <h2 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Resumo da Comparação: Pilha vs. Fila</h2>
        <p class="mt-4 mb-6 text-lg text-[var(--text-secondary)]">
            A escolha entre uma pilha e uma fila depende exclusivamente da ordem em que você precisa processar os dados. Se a ordem de chegada é importante, use uma Fila. Se o item mais recente é o mais relevante, uma Pilha é a escolha certa.
        </p>
    </section>
</article>
