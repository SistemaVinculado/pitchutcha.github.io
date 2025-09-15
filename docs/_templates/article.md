---
layout: artigo
title: "Título do Novo Artigo"
date: {{ site.time | date: "%Y-%m-%d" }}
category: "Algoritmos" # ou Estruturas de Dados
icon: "memory" # ou outro ícone de https://fonts.google.com/icons
excerpt: "Um resumo conciso do artigo para SEO e visualizações."
image: "https://placehold.co/600x400/..." # Link para a imagem de cabeçalho
---

<article>
    {% include article-header.html 
        title="Título do Novo Artigo"
        intro="Escreva aqui o parágrafo introdutório do seu artigo." 
    %}

    {% include image.html
        src="/assets/images/nome-da-imagem.jpg"
        alt="Descrição da imagem para acessibilidade."
        caption="Legenda curta para a imagem."
    %}

    {% include section-header.html 
        id="primeira-secao"
        title="Título da Primeira Seção"
        text="Texto de introdução da primeira seção."
    %}

{% highlight python %}
# Seu código aqui
{% endhighlight %}

    {% include section-header.html 
        id="segunda-secao"
        title="Título da Segunda Seção"
        text="Texto de introdução da segunda seção."
    %}

</article>
