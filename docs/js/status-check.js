document.addEventListener("DOMContentLoaded", () => {
    const overallStatusIndicator = document.getElementById("overall-status-indicator");
    const overallStatusText = document.getElementById("overall-status-text");
    const detailedContainer = document.getElementById("detailed-status-container");
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    if (!overallStatusIndicator || !overallStatusText || !detailedContainer) {
        console.error("Elementos essenciais da página de status não foram encontrados.");
        return;
    }

    const accordionStyles = `
        .component-details {
            border-radius: 0.5rem;
            overflow: hidden;
            border: 1px solid var(--secondary-color);
            background-color: var(--background-secondary);
            margin-bottom: 0.5rem;
        }
        .component-summary {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
            cursor: pointer;
            list-style: none;
        }
        .component-summary::-webkit-details-marker {
            display: none;
        }
        .component-details-content {
            padding: 1rem;
            padding-top: 0;
            border-top: 1px solid var(--secondary-color);
        }
        .component-details[open] .component-details-content {
            padding-top: 1rem;
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
        .details-list {
            list-style-type: none;
            padding: 0;
            margin: 0;
            font-size: 0.8rem;
        }
        .details-list li {
            display: flex;
            justify-content: space-between;
            padding: 0.35rem 0;
            border-bottom: 1px solid var(--secondary-color);
        }
        .details-list li:last-child {
            border-bottom: none;
        }
        .details-list .label {
            color: var(--text-secondary);
        }
        .details-list .value {
            font-weight: 600;
            color: var(--text-primary);
        }
        .details-list .value.na {
            color: var(--text-secondary);
            font-style: italic;
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = accordionStyles;
    document.head.appendChild(styleSheet);


    const components = [
        { name: "Página Principal", url: "index.html" },
        { name: "Página de Algoritmos", url: "algoritmos.html" },
        { name: "Página de Estrutura de Dados", url: "estruturas-de-dados.html" },
        { name: "Página de Busca", url: "search.html" },
        { name: "Página de Status", url: "status.html" },
        { name: "CSS Principal", url: "css/style.css" },
        { name: "JS Principal", url: "js/script.js" },
        { name: "JS Painel de Dev", url: "js/dev-panel.js" },
        { name: "Banco de Dados da Busca", url: "search.json", checkIntegrity: true }
    ];

    const updateComponentStatus = (name, status, metrics) => {
        const statusMap = {
            operational: { text: "Operacional", textClass: "text-green-600", icon: "check_circle" },
            degraded: { text: "Lento", textClass: "text-yellow-600", icon: "warning" },
            outage: { text: "Falha", textClass: "text-red-500", icon: "error" }
        };
        const currentStatus = statusMap[status] || statusMap.outage;
        
        const componentHTML = `
            <details class="component-details">
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
                    <ul class="details-list">
                        <li><span class="label">Status</span><span class="value ${currentStatus.textClass}">${currentStatus.text}</span></li>
                        <li><span class="label">Detalhes</span><span class="value">${metrics.details}</span></li>
                        <li><span class="label">Tempo de Carregamento</span><span class="value">${metrics.loadTime !== null ? metrics.loadTime + 'ms' : 'N/A'}</span></li>
                        <li><span class="label">Tamanho do Arquivo</span><span class="value">${metrics.fileSize !== null ? (metrics.fileSize / 1024).toFixed(2) + ' KB' : 'N/A'}</span></li>
                        <li><span class="label">Tempo até Interatividade (TTI)</span><span class="value na">Use a aba "Lighthouse"</span></li>
                        <li><span class="label">Performance de Renderização</span><span class="value na">Use a aba "Lighthouse"</span></li>
                        <li><span class="label">Responsividade</span><span class="value na">Use o Modo de Dispositivo (Ctrl+Shift+M)</span></li>
                    </ul>
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
            let metrics = { details: "Falha no teste", loadTime: null, fileSize: null };
            const startTime = performance.now();

            try {
                const response = await fetch(baseUrl + component.url, { cache: "no-store" });
                const duration = (performance.now() - startTime);

                if (response.ok) {
                    const blob = await response.clone().blob();
                    metrics.fileSize = blob.size;
                    metrics.loadTime = duration.toFixed(0);

                    status = duration > 1500 ? "degraded" : "operational";
                    details = `Componente operacional.`;

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
            
            metrics.details = details;
            if (status === 'outage') finalStatus = 'outage';
            if (status === 'degraded' && finalStatus !== 'outage') finalStatus = 'degraded';
            
            updateComponentStatus(component.name, status, metrics);
        }
        
        updateOverallStatus(finalStatus);
    };

    runChecks();
});
