---
layout: artigo
title: "Tabelas Hash: Conceito e Implementação"
category: Estruturas de Dados
icon: key
excerpt: "Entenda como funcionam as tabelas hash, estruturas de dados eficientes para busca, inserção e remoção, incluindo o tratamento de colisões."
image: "https://placehold.co/600x400/E0F2FE/0369A1?text=Tabelas+Hash"
---

<article>
    <h1 class="text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-5xl">Tabelas Hash</h1>
    <p class="mt-6 text-lg text-[var(--text-secondary)]">
        As tabelas hash são estruturas de dados que permitem armazenar e acessar pares <strong>chave-valor</strong> de forma muito eficiente. 
        Elas usam uma função de hash para mapear chaves a índices em um array subjacente. 
        Com um bom hash e baixa taxa de colisão, operações como inserção, remoção e busca podem ser realizadas em tempo próximo de O(1).
    </p>

    <section class="pt-10" id="conceito">
        <h2 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Conceito Básico</h2>
        <p class="mt-4 mb-6 text-lg text-[var(--text-secondary)]">
            A função de hash transforma uma chave em um índice numérico. 
            Esse índice aponta para a posição no array onde o valor será armazenado. 
            Quando duas chaves diferentes resultam no mesmo índice, ocorre uma <strong>colisão</strong>.
        </p>
    </section>

    <section class="pt-10" id="implementacao">
        <h2 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Implementação Simples em Python</h2>
        <p class="mt-4 mb-6 text-lg text-[var(--text-secondary)]">
            Vamos implementar uma tabela hash simples usando encadeamento separado (listas ligadas) para lidar com colisões.
        </p>
{% highlight python %}
class TabelaHash:
    def __init__(self, tamanho=10):
        self.tamanho = tamanho
        self.tabela = [[] for _ in range(tamanho)]

    def _hash(self, chave):
        return hash(chave) % self.tamanho

    def inserir(self, chave, valor):
        indice = self._hash(chave)
        for i, (k, v) in enumerate(self.tabela[indice]):
            if k == chave:
                self.tabela[indice][i] = (chave, valor)
                return
        self.tabela[indice].append((chave, valor))

    def buscar(self, chave):
        indice = self._hash(chave)
        for k, v in self.tabela[indice]:
            if k == chave:
                return v
        return None

    def remover(self, chave):
        indice = self._hash(chave)
        for i, (k, v) in enumerate(self.tabela[indice]):
            if k == chave:
                del self.tabela[indice][i]
                return True
        return False


# Exemplo de uso
tabela = TabelaHash()
tabela.inserir("nome", "Ana")
tabela.inserir("idade", 25)
print(tabela.buscar("nome"))   # Ana
print(tabela.buscar("idade"))  # 25
{% endhighlight %}
    </section>

    <section class="pt-10" id="tratamento-colisoes">
        <h2 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Tratamento de Colisões</h2>
        <p class="mt-4 mb-6 text-lg text-[var(--text-secondary)]">
            Colisões são inevitáveis quando muitas chaves diferentes resultam no mesmo índice. 
            Existem estratégias para lidar com isso:
        </p>
        <ul class="list-disc pl-6 text-lg text-[var(--text-secondary)]">
            <li><strong>Encadeamento Separado:</strong> Cada posição da tabela guarda uma lista (ou outra estrutura) de pares chave-valor.</li>
            <li><strong>Endereçamento Aberto:</strong> Caso a posição esteja ocupada, procura-se outra disponível dentro da tabela.</li>
        </ul>
    </section>

    <section class="pt-10" id="complexidade">
        <h2 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Complexidade</h2>
        <p class="mt-4 text-lg text-[var(--text-secondary)]">
            Em condições ideais, as operações em tabelas hash têm tempo de execução:
            <ul>
                <li class="mt-2">Busca: O(1)</li>
                <li class="mt-2">Inserção: O(1)</li>
                <li class="mt-2">Remoção: O(1)</li>
            </ul>
            Porém, no pior caso (muitas colisões), o tempo pode degradar para O(n).
        </p>
    </section>
</article>
