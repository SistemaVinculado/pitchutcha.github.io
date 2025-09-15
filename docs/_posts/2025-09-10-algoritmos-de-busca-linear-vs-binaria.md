---
layout: artigo
title: "Algoritmos de Busca: Linear vs. Binária"
category: Algoritmos
icon: search
excerpt: "Uma análise comparativa entre a busca linear e a busca binária, dois algoritmos fundamentais para encontrar elementos em uma coleção de dados. Entenda quando e porquê usar cada um."
image: "https://placehold.co/600x400/f3e8ff/8b5cf6?text=Busca+Linear+vs+Binária"
---

<article>
    {% include article-header.html 
        title="Algoritmos de Busca: Linear vs. Binária"
        intro="Encontrar informações de forma eficiente é uma das tarefas mais comuns na computação. Os algoritmos de busca fornecem os métodos para localizar um elemento específico dentro de uma estrutura de dados. Neste artigo, vamos explorar e comparar duas abordagens fundamentais: a busca linear e a busca binária."
    %}

    {% include image.html
        src="../assets/images/search-algorithms-linear-vs-binary.jpg"
        alt="Diagrama comparando a Busca Linear, que avança sequencialmente por um array, com a Busca Binária, que repetidamente foca no elemento central para descartar metade do campo de busca."
        caption="Comparativo visual entre a Busca Linear, que verifica item por item ($O(n)$), e a Busca Binária, que divide o conjunto de dados a cada passo ($O(\log n)$)."
    %}

    {% include section-header.html 
        id="busca-linear"
        title="Busca Linear (Linear Search)"
        text='A busca linear é o método mais simples. Ela percorre sequencialmente cada elemento de uma lista, um por um, desde o início até o fim, comparando cada elemento com o valor alvo. A busca termina quando o elemento é encontrado ou quando a lista chega ao fim.<br><br><strong>Principal Característica:</strong> Funciona em qualquer lista, ordenada ou não.<br><strong>Complexidade de Tempo:</strong> O(n), pois no pior caso, pode ser necessário verificar todos os "n" elementos da lista.'
    %}

{% highlight python %}
def busca_linear(lista, alvo):
    """
    Percorre a lista e retorna o índice do alvo se encontrado.
    Caso contrário, retorna -1.
    """
    for i in range(len(lista)):
        if lista[i] == alvo:
            return i  # Encontrou o alvo, retorna o índice
    return -1  # Alvo não está na lista
{% endhighlight %}

    {% include section-header.html 
        id="busca-binaria"
        title="Busca Binária (Binary Search)"
        text='A busca binária é um algoritmo muito mais eficiente, mas com um pré-requisito crucial: <strong>a lista deve estar ordenada</strong>. Ela funciona dividindo repetidamente o intervalo de busca pela metade. Se o valor do ponto médio for o alvo, a busca termina. Caso contrário, se o alvo for menor que o ponto médio, a busca continua na metade inferior; se for maior, continua na metade superior.<br><br><strong>Principal Característica:</strong> Exige que a lista esteja previamente ordenada.<br><strong>Complexidade de Tempo:</strong> O(log n), pois a cada passo, o problema é reduzido pela metade, tornando-a extremamente rápida para grandes volumes de dados.'
    %}

{% highlight python %}
def busca_binaria(lista_ordenada, alvo):
    """
    Busca um alvo em uma lista ordenada e retorna o índice.
    Caso contrário, retorna -1.
    """
    inicio = 0
    fim = len(lista_ordenada) - 1

    while inicio <= fim:
        meio = (inicio + fim) // 2  # Encontra o índice do meio

        # Verifica se o alvo está no meio
        if lista_ordenada[meio] == alvo:
            return meio
        # Se o alvo é maior, ignora a metade esquerda
        elif lista_ordenada[meio] < alvo:
            inicio = meio + 1
        # Se o alvo é menor, ignora a metade direita
        else:
            fim = meio - 1
            
    return -1  # Alvo não está na lista
{% endhighlight %}

    <section class="pt-10" id="comparacao">
        <h2 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Quando Usar Cada Uma?</h2>
        <p class="mt-4 text-lg text-[var(--text-secondary)]">
            A escolha entre busca linear e binária depende inteiramente do contexto:
            <ul>
                <li class="mt-2"><strong>Use a Busca Linear</strong> quando a lista de dados for pequena ou quando a lista não estiver ordenada e o custo de ordená-la for maior do que o benefício da busca rápida.</li>
                <li class="mt-2"><strong>Use a Busca Binária</strong> sempre que a lista estiver ordenada (ou puder ser ordenada uma vez e pesquisada várias vezes). Para grandes conjuntos de dados, a diferença de performance é imensa.</li>
            </ul>
        </p>
    </section>
</article>
