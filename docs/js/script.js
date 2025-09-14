document.addEventListener("DOMContentLoaded", () => {
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    /**
     * NOVO: Lógica da Barra de Progresso (NProgress)
     * Finaliza a barra de progresso quando o novo conteúdo da página é carregado.
     */
    if (typeof NProgress !== 'undefined') {
        NProgress.done();
    }

    /**
     * ATUALIZADO: Seletor de Tema (Claro, Escuro, Alto Contraste)
     * Cicla entre os três temas e salva a preferência do usuário.
     */
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
        const themes = ['light', 'dark', 'high-contrast'];
        
        const applyTheme = (theme) => {
            document.documentElement.classList.remove(...themes);
            if (theme !== 'light') {
                document.documentElement.classList.add(theme);
            }
            localStorage.setItem('theme', theme);
        };

        // Aplica o tema salvo ao carregar a página
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && themes.includes(savedTheme)) {
            applyTheme(savedTheme);
        }

        themeToggle.addEventListener("click", () => {
            let currentTheme = localStorage.getItem('theme') || 'light';
            const currentIndex = themes.indexOf(currentTheme);
            const nextTheme = themes[(currentIndex + 1) % themes.length];
            applyTheme(nextTheme);
        });
    }

    /**
     * NOVO: Lógica do Menu Móvel (para a nova landing page)
     * Adicionada a partir da nova index.html para centralizar os scripts.
     */
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    /**
     * NOVO: Lógica da Barra de Anúncios Global
     * Verifica se o banner foi dispensado e o exibe/oculta conforme necessário.
     */
    const banner = document.getElementById('global-banner');
    const closeBannerBtn = document.getElementById('global-banner-close');

    if (banner && closeBannerBtn) {
        // Usamos uma versão no nome da chave para que possamos re-exibir o banner no futuro se o conteúdo mudar.
        const bannerId = 'bannerDismissed_v1'; 
        if (localStorage.getItem(bannerId) !== 'true') {
            banner.style.display = 'flex';
        }

        closeBannerBtn.addEventListener('click', () => {
            banner.style.display = 'none';
            localStorage.setItem(bannerId, 'true');
        });
    }

    /**
     * Lógica de Busca (formulários no header e na página principal)
     */
    const searchForms = document.querySelectorAll(".header-search-form, .main-search-form");
    searchForms.forEach(form => {
        form.addEventListener("submit", function(event) {
            event.preventDefault();
            const searchInput = this.querySelector('input[type="search"], input[type="text"]');
            if (searchInput) {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `${baseUrl}search.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    });

    /**
     * Lógica de Status da Homepage
     */
    const homepageStatusIndicator = document.getElementById("homepage-status-indicator");
    const homepageStatusText = document.getElementById("homepage-status-text");
    if (homepageStatusIndicator && homepageStatusText) {
        const setStatus = (statusKey) => {
            const indicatorPulse = homepageStatusIndicator.querySelector(".ping-pulse");
            const indicatorDot = homepageStatusIndicator.querySelector(".relative.inline-flex");
            indicatorPulse.className = "ping-pulse";
            indicatorDot.className = "relative inline-flex rounded-full h-3 w-3";

            const statuses = {
                ok: { pulse: "ping-green", dot: "bg-green-500", text: "Todos os sistemas operacionais" },
                down: { pulse: "ping-red", dot: "bg-red-500", text: "Instabilidade nos sistemas" },
                error: { pulse: "ping-yellow", dot: "bg-yellow-500", text: "Não foi possível verificar" }
            };
            const currentStatus = statuses[statusKey] || statuses.error;
            indicatorPulse.classList.add(currentStatus.pulse);
            indicatorDot.classList.add(currentStatus.dot);
            homepageStatusText.textContent = currentStatus.text;
        };

        fetch(`${baseUrl}uptime-data.json?cache_bust=` + Date.now())
            .then(response => response.ok ? response.json() : Promise.reject("Network response was not ok"))
            .then(data => {
                const monitor = data?.monitors?.[0];
                if (monitor?.status === 2) {
                    setStatus("ok");
                } else if (monitor?.status === 8 || monitor?.status === 9) {
                    setStatus("down");
                } else {
                    setStatus("error");
                }
            }).catch(error => {
                console.error("Falha ao buscar status para a homepage:", error);
                setStatus("error");
            });
    }

    /**
     * Destaque do Link Ativo na Navegação
     */
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage) {
        const navLinks = document.querySelectorAll("nav a");
        navLinks.forEach(link => {
            const linkPage = link.getAttribute("href").split("/").pop();
            if (currentPage === linkPage) {
                link.style.color = "var(--primary-color)";
                link.style.fontWeight = "600";
            }
        });
    }
    
    /**
     * Modal de Busca Global (Ctrl+K)
     */
    const searchModalOverlay = document.createElement("div");
    searchModalOverlay.id = "search-modal-overlay";
    searchModalOverlay.className = "search-modal-overlay";
    searchModalOverlay.innerHTML = `
        <div class="search-modal" role="dialog" aria-modal="true" aria-labelledby="search-modal-title">
            <div class="search-modal-input-wrapper">
                <span class="material-symbols-outlined text-gray-400">search</span>
                <input type="text" id="search-modal-input" class="search-modal-input" placeholder="Pesquisar artigos..." autocomplete="off">
            </div>
            <div id="search-modal-results" class="search-modal-results"></div>
            <div class="search-modal-footer">
                <span>Navegar com <kbd>↑</kbd> <kbd>↓</kbd></span>
                <span>Abrir com <kbd>Enter</kbd></span>
                <span>Fechar com <kbd>Esc</kbd></span>
            </div>
        </div>`;
    document.body.appendChild(searchModalOverlay);

    const searchModalInput = document.getElementById("search-modal-input");
    const searchModalResults = document.getElementById("search-modal-results");
    let fuse;
    let searchData = [];
    const fuseOptions = {
        keys: ["title", "excerpt"],
        includeMatches: true,
        minMatchCharLength: 2,
        threshold: 0.3,
        ignoreLocation: true,
    };

    async function initFuse() {
        try {
            const response = await fetch(`${baseUrl}search.json?cache_bust=` + Date.now());
            if (!response.ok) throw new Error("Falha ao carregar search.json para o modal");
            searchData = await response.json();
            fuse = new Fuse(searchData, fuseOptions);
        } catch (error) {
            console.error(error);
        }
    }

    function highlightMatches(text, matches, key) {
        let result = [];
        let lastIndex = 0;
        const keyMatches = matches.filter(match => match.key === key);
        keyMatches.forEach(match => {
            match.indices.forEach(([start, end]) => {
                if (start > lastIndex) {
                    result.push(text.substring(lastIndex, start));
                }
                result.push(`<mark>${text.substring(start, end + 1)}</mark>`);
                lastIndex = end + 1;
            });
        });
        if (lastIndex < text.length) {
            result.push(text.substring(lastIndex));
        }
        return result.join('');
    }

    function performSearch() {
        const query = searchModalInput.value.trim();
        let results;
        if (query.length < fuseOptions.minMatchCharLength) {
            results = [];
        } else {
            results = fuse.search(query);
        }

        searchModalResults.innerHTML = '';
        if (results.length > 0) {
            results.slice(0, 10).forEach(({ item, matches }) => {
                const link = document.createElement('a');
                link.href = item.url;
                link.innerHTML = `
                    <div class="title">${highlightMatches(item.title, matches, 'title')}</div>
                    <div class="excerpt">${highlightMatches(item.excerpt, matches, 'excerpt')}</div>
                `;
                searchModalResults.appendChild(link);
            });
        } else {
            searchModalResults.innerHTML = '<p class="p-4 text-center text-[var(--text-secondary)]">Nenhum resultado encontrado.</p>';
        }
    }

    initFuse();
    searchModalInput.addEventListener("input", performSearch);

    window.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            searchModalOverlay.classList.add("visible");
            searchModalInput.focus();
        }
        if (e.key === "/" && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            searchModalOverlay.classList.add("visible");
            searchModalInput.focus();
        }
        if (e.key === "Escape") {
            searchModalOverlay.classList.remove("visible");
        }
    });

    searchModalOverlay.addEventListener("click", (e) => {
        if (e.target === searchModalOverlay) {
            searchModalOverlay.classList.remove("visible");
        }
    });

});

/**
 * NOVO: Lógica da Barra de Progresso (NProgress)
 * Inicia a barra de progresso em cliques de links internos.
 */
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        const isInternalNav = href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('mailto:') && link.target !== '_blank';
        
        if (isInternalNav && typeof NProgress !== 'undefined') {
            NProgress.start();
        }
    });
});
