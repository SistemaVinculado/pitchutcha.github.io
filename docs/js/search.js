document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const resultsCount = document.getElementById('results-count');
    const categoryFilters = document.querySelectorAll('input[data-filter="category"]');
    let allPosts = []; // Para guardar todos os artigos em memória

    // 1. Carregar o "banco de dados" de artigos
    async function loadSearchData() {
        try {
            const response = await fetch('search.json');
            if (!response.ok) {
                throw new Error('Falha ao carregar search.json');
            }
            allPosts = await response.json();
            
            // Verifica se há um termo de busca na URL ao carregar a página
            const urlParams = new URLSearchParams(window.location.search);
            const queryFromUrl = urlParams.get('q');
            if (queryFromUrl) {
                searchInput.value = queryFromUrl;
            }

            performSearch(); // Realiza a busca inicial (com ou sem termo da URL)
        } catch (error) {
            console.error(error);
            resultsCount.textContent = 'Erro ao carregar artigos.';
        }
    }

    // 2. Função para mostrar os resultados na tela
    function displayResults(results, query) {
        resultsContainer.innerHTML = ''; // Limpa resultados antigos

        if (results.length === 0) {
            resultsCount.textContent = 'Nenhum resultado encontrado.';
            return;
        }

        resultsCount.textContent = `Mostrando ${results.length} resultados.`;

        results.forEach(post => {
            let title = post.title;
            let excerpt = post.excerpt;

            // Lógica para destacar o termo da busca
            if (query) {
                const regex = new RegExp(query, 'gi'); // 'gi' para global e case-insensitive
                title = title.replace(regex, (match) => `<mark>${match}</mark>`);
                excerpt = excerpt.replace(regex, (match) => `<mark>${match}</mark>`);
            }

            const postElement = document.createElement('div');
            postElement.className = 'bg-white p-6 rounded-md shadow-sm border border-gray-200 hover:shadow-md transition-shadow';
            postElement.innerHTML = `
                <a class="block" href="${post.url}">
                    <h3 class="text-lg font-semibold text-gray-900 hover:text-[var(--primary-color)]">${title}</h3>
                    <p class="text-sm text-gray-500 mt-1">Categoria: <span class="font-medium text-gray-700">${post.category}</span></p>
                    <p class="text-gray-600 mt-2 text-sm">${excerpt}</p>
                </a>
            `;
            resultsContainer.appendChild(postElement);
        });
    }

    // 3. Função principal de busca e filtro
    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        
        const selectedCategories = Array.from(categoryFilters)
                                       .filter(i => i.checked)
                                       .map(i => i.value);

        const filteredPosts = allPosts.filter(post => {
            const matchesQuery = query ? post.title.toLowerCase().includes(query) || post.excerpt.toLowerCase().includes(query) : true;
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(post.category);
            return matchesQuery && matchesCategory;
        });

        displayResults(filteredPosts, query);
    }
    
    // 4. Ligar os eventos
    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
        categoryFilters.forEach(checkbox => {
            checkbox.addEventListener('change', performSearch);
        });
        
        loadSearchData(); // Carrega os dados e realiza a busca inicial
    }
});
