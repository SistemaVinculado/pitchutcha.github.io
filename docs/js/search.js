document.addEventListener("DOMContentLoaded", () => {
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';
    const searchInput = document.getElementById("search-input");
    const resultsContainer = document.getElementById("results-container");
    const resultsCount = document.getElementById("results-count");
    const autocompleteSuggestions = document.getElementById("autocomplete-suggestions");
    const categoryFilters = document.querySelectorAll('input[data-filter="category"]');

    let fuse;
    let searchData = [];

    const fuseOptions = {
        keys: ["title", "excerpt"],
        includeMatches: true,
        minMatchCharLength: 2,
        threshold: 0.4,
        ignoreLocation: true,
        useExtendedSearch: true,
    };

    async function initializeSearch() {
        try {
            const response = await fetch(`${baseUrl}search.json?cache_bust=` + Date.now());
            if (!response.ok) {
                throw new Error("Falha ao carregar search.json");
            }
            searchData = await response.json();
            fuse = new Fuse(searchData, fuseOptions);

            const urlQuery = new URLSearchParams(window.location.search).get("q");
            if (urlQuery) {
                searchInput.value = urlQuery;
            }
            performSearch();
        } catch (error) {
            console.error(error);
            resultsCount.textContent = "Erro ao carregar artigos.";
        }
    }

    function highlight(text, matches, key) {
        let result = [];
        let lastIndex = 0;
        const keyMatches = matches.filter(match => match.key === key);

        keyMatches.forEach(match => {
            match.indices.forEach(([start, end]) => {
                const actualEnd = end + 1;
                if (start > lastIndex) {
                    result.push(text.substring(lastIndex, start));
                }
                result.push(`<mark>${text.substring(start, actualEnd)}</mark>`);
                lastIndex = actualEnd;
            });
        });

        if (lastIndex < text.length) {
            result.push(text.substring(lastIndex));
        }
        return result.join('');
    }

    function displayResults(results) {
        resultsContainer.innerHTML = "";
        if (results.length === 0) {
            resultsCount.textContent = "Nenhum resultado encontrado.";
            return;
        }

        resultsCount.textContent = `Mostrando ${results.length} resultados.`;
        results.forEach(({ item, matches }) => {
            const resultElement = document.createElement("div");
            resultElement.className = "bg-[var(--background-primary)] p-6 rounded-md shadow-sm border border-[var(--secondary-color)] hover:shadow-md transition-shadow";
            
            // --- MELHORIA DA EXPERIÊNCIA DE BUSCA ---
            // Adiciona a categoria como uma tag visual para dar contexto ao resultado.
            const categoryTag = item.category 
                ? `<div class="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--primary-color)]">${item.category}</div>` 
                : '';

            resultElement.innerHTML = `
                <a class="block" href="${item.url}">
                    ${categoryTag}
                    <h3 class="text-lg font-semibold text-[var(--text-primary)] hover:text-[var(--primary-color)]">${highlight(item.title, matches, "title")}</h3>
                    <p class="text-[var(--text-secondary)] mt-2 text-sm">${highlight(item.excerpt, matches, "excerpt")}</p>
                </a>
            `;
            resultsContainer.appendChild(resultElement);
        });
    }
    
    function displayAutocomplete(results) {
        autocompleteSuggestions.innerHTML = "";
        if (results.length === 0) {
            autocompleteSuggestions.style.display = 'none';
            return;
        }
        
        autocompleteSuggestions.style.display = 'block';
        const suggestionsList = document.createElement("ul");
        suggestionsList.className = "absolute w-full bg-[var(--background-primary)] border border-[var(--secondary-color)] rounded-md mt-1 shadow-lg z-10";
        
        results.slice(0, 5).forEach(({ item, matches }) => {
            const listItem = document.createElement("li");
            const link = document.createElement("a");
            link.href = item.url;
            link.className = "block p-3 hover:bg-[var(--background-secondary)]";
            link.innerHTML = `<span class="font-semibold">${highlight(item.title, matches, "title")}</span><br><span class="text-sm text-[var(--text-secondary)]">${highlight(item.excerpt, matches, "excerpt")}</span>`;
            listItem.appendChild(link);
            suggestionsList.appendChild(listItem);
        });
        
        autocompleteSuggestions.appendChild(suggestionsList);
    }


    function performSearch() {
        if (!fuse) return;

        const query = searchInput.value.trim();
        const activeCategories = Array.from(categoryFilters)
            .filter(input => input.checked)
            .map(input => input.value.trim());

        let filteredResults = [];

        if (query.length < fuseOptions.minMatchCharLength) {
            filteredResults = searchData.map(item => ({ item, matches: [] }));
        } else {
            filteredResults = fuse.search(query);
        }

        if (activeCategories.length > 0) {
            filteredResults = filteredResults.filter(({ item }) =>
                item.category && activeCategories.includes(item.category.trim())
            );
        }

        displayResults(filteredResults);
        
        if (query) {
            displayAutocomplete(filteredResults);
        } else {
            autocompleteSuggestions.innerHTML = "";
            autocompleteSuggestions.style.display = 'none';
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", performSearch);
        categoryFilters.forEach(filter => {
            filter.addEventListener("change", performSearch);
        });
        
        document.addEventListener("click", (event) => {
            if (!searchInput.contains(event.target)) {
                autocompleteSuggestions.style.display = 'none';
            }
        });

        initializeSearch();
    }
});
