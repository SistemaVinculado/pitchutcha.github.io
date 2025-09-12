document.addEventListener("DOMContentLoaded", () => {
    const overallStatusIndicator = document.getElementById("overall-status-indicator");
    const overallStatusText = document.getElementById("overall-status-text");
    const detailedContainer = document.getElementById("detailed-status-container");
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    if (!overallStatusIndicator || !overallStatusText || !detailedContainer) {
        console.error("Elementos essenciais da página de status não foram encontrados.");
        return;
    }

    // Injeta o CSS para a nova funcionalidade de expandir/recolher
    const accordionStyles = `
        .component-details {
            border-radius: 0.5rem;
            overflow: hidden;
            border: 1px solid var(--secondary-color);
            background-color: var(--background-secondary);
        }
        .component-summary {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
            cursor: pointer;
            list-style: none; /* Remove a seta padrão do <summary> */
        }
        .component-summary::-webkit-details-marker {
            display: none; /* Remove a seta padrão no Chrome/Safari */
        }
        .component-details-content {
            padding: 0 1rem 1rem 1rem;
            border-top: 1px solid var(--secondary-color);
        }
        .component-details .icon-toggle::before {
            content: 'expand_more';
            font-family: 'Material Symbols Outlined';
            font-size: 24px;
            display: inline-block;
            transition: transform 0.2s;
        }
        .component-details[open] .icon-toggle::before {
            transform: rotate(180deg);
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = accordionStyles;
    document.head.appendChild(styleSheet);


    const components = [
        { name: "Página Principal", url: "index.html", type: "Página" },
        { name: "Página de Algoritmos", url: "algoritmos.html", type: "Página" },
        { name: "Página de Estrutura de Dados", url: "estruturas-de-dados.html", type: "Página" },
        { name: "Página de Busca", url: "search.html", type: "Página" },
        { name: "Página de Status", url: "status.html", type: "Página" },
        { name: "CSS Principal", url: "css/style.css", type: "Recurso" },
        { name: "JS Principal", url: "js/script.js", type: "Recurso" },
        { name: "JS da Busca", url: "js/search.js", type: "Recurso" },
        { name: "Painel de Dev", url: "js/dev-panel.js", type: "Recurso" },
        { name: "Banco de Dados da Busca", url: "search.json", type: "Recurso", checkIntegrity: true }
    ];

    const updateComponentStatus = (name, status, details) => {
        const statusMap = {
            operational: { text: "Operacional", pulse: "ping-green", dot: "bg-green-500", textClass: "text-green-600", icon: "check_circle" },
            degraded: { text: "Lento", pulse: "ping-yellow", dot: "bg-yellow-500", textClass: "text-yellow-600", icon: "warning" },
            outage: { text: "Falha", pulse: "ping-red", dot: "bg-red-500", textClass: "text-red-500", icon: "error" }
        };
        const currentStatus = statusMap[status] || statusMap.outage;
        
        const componentHTML = `
            <details class="component-details mb-2">
                <summary class="component-summary">
                    <div class="flex items-center gap-4">
                        <span class="material-symbols-outlined ${currentStatus.textClass}">${currentStatus.icon}</span>
                        <p class="text-[var(--text-primary)] font-semibold">${name}</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="capitalize font-medium ${currentStatus.textClass}">${currentStatus.text}</span>
                        <span class="icon-toggle text-[var(--text-secondary)]"></span>
                    </div>
                </summary>
                <div class="component-details-content">
                    <p class="text-sm text-[var(--text-secondary)]">${details}</p>
                </div>
            </details>
        `;
        detailedContainer.insertAdjacentHTML("beforeend", componentHTML);
    };

    const updateOverallStatus = (status) => {
        const statusMap = {
            operational: { pulse: "ping-green", dot: "bg-green-500", text: "Todos os sistemas operacionais" },
            degraded: { pulse: "ping-yellow", dot: "bg-yellow-500", text: "Performance degradada" },
            outage: { pulse: "ping-red", dot: "bg-red-500", text: "Falha crítica no sistema" }
        };
        const currentStatus = statusMap[status] || statusMap.outage;
        
        const indicatorHTML = `<span class="ping-pulse ${currentStatus.pulse}"></span><span class="relative inline-flex rounded-full h-3 w-3 ${currentStatus.dot}"></span>`;
        
        overallStatusIndicator.innerHTML = indicatorHTML;
        overallStatusText.textContent = currentStatus.text;
    };

    const runChecks = async () => {
        let finalStatus = "operational";
        detailedContainer.innerHTML = ''; 

        for (const component of components) {
            let status = "outage";
            let details = "";
            const startTime = performance.now();

            try {
                const response = await fetch(baseUrl + component.url, { cache: "no-store" });
                const duration = (performance.now() - startTime).toFixed(0);

                if (response.ok) {
                    status = duration > 1000 ? "degraded" : "operational";
                    details = `Componente operacional (${duration}ms).`;

                    if (component.checkIntegrity) {
                        const text = await response.text();
                        JSON.parse(text); 
                        if (text.trim() === "[]" || text.trim() === "" || text.trim() === "{}") {
                           status = "outage";
                           details = "Falha: Arquivo de dados está vazio.";
                        }
                    }
                } else {
                    status = "outage";
                    details = `Falha: Recurso não encontrado (Erro ${response.status}).`;
                }
            } catch (err) {
                status = "outage";
                details = `Falha Crítica: ${err.message}.`;
            }
            
            if (status === 'outage') finalStatus = 'outage';
            if (status === 'degraded' && finalStatus !== 'outage') finalStatus = 'degraded';
            
            updateComponentStatus(component.name, status, details);
        }
        
        updateOverallStatus(finalStatus);
    };

    runChecks();
});
