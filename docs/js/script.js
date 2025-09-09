// Este arquivo centraliza todo o seu código JavaScript do seu site.

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Funcionalidade para trocar o tema (dark mode) ---
    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            body.classList.toggle("dark");
        });
    }

    // --- Funcionalidade das Barras de Busca (Global) ---
    function handleSearchRedirect(event) {
        event.preventDefault(); // Impede o envio padrão do formulário
        
        // A suposição aqui é que o input de busca é o primeiro input de texto/search dentro do formulário.
        const searchInput = this.querySelector('input[type="search"], input[type="text"]');
        if (!searchInput) return;

        const query = searchInput.value.trim();

        if (query) {
            // AVISO: Estou prevendo o caminho base do seu site no GitHub Pages.
            // Se o seu repositório for renomeado, este caminho pode precisar de ajuste.
            const searchPageUrl = `/pitchutcha.github.io/search.html`;
            window.location.href = `${searchPageUrl}?q=${encodeURIComponent(query)}`;
        }
    }

    // Aplica a funcionalidade a todos os formulários de busca que prepararmos
    const searchForms = document.querySelectorAll('.header-search-form, .main-search-form');
    searchForms.forEach(form => {
        form.addEventListener('submit', handleSearchRedirect);
    });

    // --- Funcionalidade para preencher a busca na página search.html ---
    const searchPageInput = document.getElementById('search-input');
    if (searchPageInput) {
        // Esta parte do código pega o termo de busca da URL e o coloca no campo de busca
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        if (query) {
            searchPageInput.value = query;
            // Dispara um evento para que o search.js filtre os resultados automaticamente
            searchPageInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

});
