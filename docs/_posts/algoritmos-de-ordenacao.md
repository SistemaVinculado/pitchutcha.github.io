---
layout: artigo
title: "Algoritmos de Ordenação: Bubble, Insertion e Quick Sort"
category: Algoritmos
icon: sort
excerpt: "Explore três algoritmos clássicos de ordenação — Bubble Sort, Insertion Sort e Quick Sort — entendendo suas diferenças de eficiência e quando utilizá-los."
image: "https://placehold.co/600x400/FEE2E2/DC2626?text=Algoritmos+de+Ordenacao"
---

<article>
    <h1 class="text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-5xl">Algoritmos de Ordenação</h1>
    <p class="mt-6 text-lg text-[var(--text-secondary)]">
        A ordenação é uma das tarefas mais fundamentais na ciência da computação. Ter dados organizados torna possível realizar buscas mais eficientes, reduzir complexidade de outros algoritmos e melhorar a usabilidade de sistemas. 
        Neste artigo, vamos explorar três algoritmos clássicos: Bubble Sort, Insertion Sort e Quick Sort.
    </p>

    <section class="pt-10" id="bubble-sort">
        <h2 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Bubble Sort</h2>
        <p class="mt-4 mb-6 text-lg text-[var(--text-secondary)]">
            O Bubble Sort compara elementos adjacentes e os troca caso estejam fora de ordem. 
            Esse processo se repete até que a lista esteja ordenada. 
            É fácil de implementar, mas ineficiente em grandes listas.
            <br><br>
            <strong>Complexidade:</strong> O(n²) no pior e médio caso.
        </p>
{% highlight python %}
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]

valores = [64, 34, 25, 12, 22, 11, 90]
bubble_sort(valores)
print(valores)  # [11, 12, 22, 25, 34, 64, 90]
{% endhighlight %}
    </section>

    <section class="pt-10" id="insertion-sort">
        <h2 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Insertion Sort</h2>
        <p class="mt-4 mb-6 text-lg text-[var(--text-secondary)]">
            O Insertion Sort constrói a lista ordenada um elemento por vez. 
            Ele pega cada item e o insere na posição correta em relação aos elementos anteriores.
            Funciona bem em listas pequenas ou quase ordenadas.
            <br><br>
            <strong>Complexidade:</strong> O(n²) no pior caso, mas O(n) em listas quase ordenadas.
        </p>
{% highlight python %}
def insertion_sort(arr):
    for i in range(1, len(arr)):
        chave = arr[i]
        j = i - 1
        while j >= 0 and chave < arr[j]:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = chave

valores = [12, 11, 13, 5, 6]
insertion_sort(valores)
print(valores)  # [5, 6, 11, 12, 13]
{% endhighlight %}
    </section>

    <section class="pt-10" id="quick-sort">
        <h2 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Quick Sort</h2>
        <p class="mt-4 mb-6 text-lg text-[var(--text-secondary)]">
            O Quick Sort é um algoritmo do tipo "dividir para conquistar". 
            Ele escolhe um elemento chamado pivô e particiona o array em dois subarrays: 
            um com elementos menores que o pivô e outro com elementos maiores. 
            Depois, aplica a mesma lógica recursivamente.
            <br><br>
            <strong>Complexidade:</strong> O(n log n) em média, mas O(n²) no pior caso (quando a escolha do pivô é ruim).
        </p>
{% highlight python %}
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    else:
        pivo = arr[len(arr) // 2]
        menores = [x for x in arr if x < pivo]
        iguais = [x for x in arr if x == pivo]
        maiores = [x for x in arr if x > pivo]
        return quick_sort(menores) + iguais + quick_sort(maiores)

valores = [10, 7, 8, 9, 1, 5]
print(quick_sort(valores))  # [1, 5, 7, 8, 9, 10]
{% endhighlight %}
    </section>

    <section class="pt-10" id="comparacao">
        <h2 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Comparação entre os Algoritmos</h2>
        <p class="mt-4 text-lg text-[var(--text-secondary)]">
            A escolha do algoritmo de ordenação depende do contexto:
            <ul>
                <li class="mt-2"><strong>Bubble Sort:</strong> Simples, mas ineficiente para listas grandes.</li>
                <li class="mt-2"><strong>Insertion Sort:</strong> Bom para listas pequenas ou quase ordenadas.</li>
                <li class="mt-2"><strong>Quick Sort:</strong> Geralmente a melhor escolha para listas grandes, sendo muito usado em bibliotecas padrão.</li>
            </ul>
        </p>
    </section>
</article>
