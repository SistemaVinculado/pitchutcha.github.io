---
layout: artigo
title: "Introdução ao Design de Algoritmos"
date: 2025-09-07
category: Algoritmos
icon: memory
excerpt: "Aprenda o básico de design e análise de algoritmos, incluindo complexidade, Big O, e paradigmas comuns como dividir para conquistar, programação dinâmica e algoritmos gulosos."
image: "https://placehold.co/400x300/D1E7FC/2563EB?text=Design+de+Algoritmos"
---

<article>
    {% include article-header.html 
        title="Introdução ao Design de Algoritmos"
        intro="Algoritmos são o coração da ciência da computação, fornecendo instruções passo a passo para resolver problemas. Este artigo introduz conceitos fundamentais no design de algoritmos, incluindo a análise de eficiência usando a notação Big O e os paradigmas de design mais comuns." 
    %}

    {% include image.html
        src="/assets/images/introduction-to-algorithm-design.jpg"
        alt="Diagrama sobre Design de Algoritmos, mostrando o fluxo de instruções, o gráfico da Notação Big O, e ícones para paradigmas como Dividir para Conquistar e Programação Dinâmica."
        caption="Visualização dos pilares do Design de Algoritmos: instruções passo a passo, análise de eficiência (Big O) e paradigmas de design."
    %}

    {% include section-header.html 
        id="algorithm-analysis"
        title="Análise de Algoritmos e Notação Big O"
        text="Compreender a eficiência de um algoritmo é crucial. A notação Big O descreve o comportamento do tempo de execução ou do espaço de memória de um algoritmo à medida que o tamanho da entrada cresce. Classes de complexidade comuns incluem O(1) (constante), O(log n) (logarítmico), O(n) (linear), O(n log n) (linearítmico) e O(n²) (quadrático), O(2ⁿ) (exponencial)."
    %}

{% highlight python %}
# Exemplo de um algoritmo de tempo linear O(n)
# O tempo de execução cresce na proporção direta do número de itens.
def encontrar_maximo(lista):
    max_valor = lista[0]
    for item in lista:
        if item > max_valor:
            max_valor = item
    return max_valor
{% endhighlight %}

    {% include section-header.html 
        id="divide-and-conquer"
        title="Dividir para Conquistar"
        text="Este paradigma quebra um problema em subproblemas menores e independentes, resolve-os recursivamente e depois combina as suas soluções. Um exemplo clássico é o algoritmo de ordenação Merge Sort."
    %}

{% highlight python %}
# Exemplo de Merge Sort
def merge_sort(arr):
    if len(arr) > 1:
        mid = len(arr) // 2
        L = arr[:mid]
        R = arr[mid:]

        merge_sort(L)
        merge_sort(R)

        i = j = k = 0
        while i < len(L) and j < len(R):
            if L[i] < R[j]:
                arr[k] = L[i]
                i += 1
            else:
                arr[k] = R[j]
                j += 1
            k += 1

        while i < len(L):
            arr[k] = L[i]
            i += 1
            k += 1

        while j < len(R):
            arr[k] = R[j]
            j += 1
            k += 1
{% endhighlight %}

    {% include section-header.html 
        id="dynamic-programming"
        title="Programação Dinâmica"
        text="A programação dinâmica resolve problemas quebrando-os em subproblemas sobrepostos. Ela armazena (memoiza) os resultados dos subproblemas para evitar recálculos, melhorando drasticamente a eficiência. Um exemplo clássico é o cálculo da sequência de Fibonacci."
    %}

{% highlight python %}
# Fibonacci com memoização (Top-Down)
def fibonacci(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo)
    return memo[n]
{% endhighlight %}

    {% include section-header.html 
        id="greedy-algorithms"
        title="Algoritmos Gulosos"
        text="Algoritmos gulosos (greedy) fazem a escolha que parece ser a melhor no momento, na esperança de encontrar uma solução globalmente ótima. Um exemplo clássico é o problema de seleção de atividades, onde o objetivo é selecionar o número máximo de atividades não sobrepostas."
    %}

{% highlight python %}
# Problema da Seleção de Atividades
def activity_selection(atividades):
    # 'atividades' é uma lista de tuplas (inicio, fim)
    # Ordena as atividades pelo tempo de término
    atividades.sort(key=lambda x: x[1])
    
    selecionadas = []
    if not atividades:
        return selecionadas

    # Seleciona a primeira atividade
    selecionadas.append(atividades[0])
    ultimo_fim = atividades[0][1]

    # Percorre o resto das atividades
    for i in range(1, len(atividades)):
        if atividades[i][0] >= ultimo_fim:
            selecionadas.append(atividades[i])
            ultimo_fim = atividades[i][1]
            
    return selecionadas
{% endhighlight %}
</article>
