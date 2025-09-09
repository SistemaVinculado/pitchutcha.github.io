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
            displayResults(allPosts); // Exibe todos os artigos inicialmente
        } catch (error) {
            console.error(error);
            resultsCount.textContent = 'Erro ao carregar artigos.';
        }
    }

    // 2. Função para mostrar os resultados na tela
    function displayResults(results) {
        resultsContainer.innerHTML = ''; // Limpa resultados antigos

        if (results.length === 0) {
            resultsCount.textContent = 'Nenhum resultado encontrado.';
            return;
        }

        resultsCount.textContent = `Mostrando ${results.length} resultados.`;

        results.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'bg-white p-6 rounded-md shadow-sm border border-gray-200 hover:shadow-md transition-shadow';
            postElement.innerHTML = `
                <a class="block" href="${post.url}">
                    <h3 class="text-lg font-semibold text-gray-900 hover:text-[var(--primary-color)]">${post.title}</h3>
                    <p class="text-sm text-gray-500 mt-1">Categoria: <span class="font-medium text-gray-700">${post.category}</span></p>
                    <p class="text-gray-600 mt-2 text-sm">${post.excerpt}</p>
                </a>
            `;
            resultsContainer.appendChild(postElement);
        });
    }

    // 3. Função principal de busca e filtro
    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        
        // Obter categorias selecionadas
        const selectedCategories = [];
        categoryFilters.forEach(checkbox => {
            if (checkbox.checked) {
                selectedCategories.push(checkbox.value);
            }
        });

        const filteredPosts = allPosts.filter(post => {
            // Verificar o texto da busca
            const matchesQuery = post.title.toLowerCase().includes(query) || post.excerpt.toLowerCase().includes(query);

            // Verificar as categorias
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(post.category);

            return matchesQuery && matchesCategory;
        });

        displayResults(filteredPosts);
    }
    
    // 4. Ligar os eventos
    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
        categoryFilters.forEach(checkbox => {
            checkbox.addEventListener('change', performSearch);
        });
        
        loadSearchData(); // Carrega os dados quando a página abre
    }
});
