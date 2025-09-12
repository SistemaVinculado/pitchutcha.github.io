document.addEventListener("DOMContentLoaded", () => {
    const overallStatusIndicator = document.getElementById("overall-status-indicator");
    const overallStatusText = document.getElementById("overall-status-text");
    const detailedContainer = document.getElementById("detailed-status-container");
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    if (!overallStatusIndicator || !overallStatusText || !detailedContainer) {
        console.error("Elementos essenciais da página de status não foram encontrados.");
        return;
    }

    const components = [
        { name: "Página Principal", url: "index.html" },
        { name: "Página de Algoritmos", url: "algoritmos.html" },
        { name: "CSS Principal", url: "css/style.css" },
        { name: "JS Principal", url: "js/script.js" },
        { name: "Banco de Dados da Busca", url: "search.json", checkIntegrity: true }
    ];

    const updateComponentStatus = (name, status, details) => {
        const statusMap = {
            operational: { text: "Operacional", pulse: "ping-green", dot: "bg-green-500", textClass: "text-green-600" },
            degraded: { text: "Lento", pulse: "ping-yellow", dot: "bg-yellow-500", textClass: "text-yellow-600" },
            outage: { text: "Falha", pulse: "ping-red", dot: "bg-red-500", textClass: "text-red-500" }
        };

        const currentStatus = statusMap[status] || statusMap.outage;
        
        const componentHTML = `
            <div class="flex items-center justify-between p-4 border-b border-[var(--secondary-color)] last:border-b-0">
                <div>
                    <p class="text-[var(--text-primary)] font-semibold">${name}</p>
                    <p class="text-sm text-[var(--text-secondary)]">${details}</p>
                </div>
                <div class="flex items-center gap-2 text-sm">
                    <span class="relative flex h-3 w-3">
                        <span class="ping-pulse ${currentStatus.pulse}"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 ${currentStatus.dot}"></span>
                    </span>
                    <span class="capitalize font-medium ${currentStatus.textClass}">${currentStatus.text}</span>
                </div>
            </div>`;
        detailedContainer.insertAdjacentHTML("beforeend", componentHTML);
    };

    const updateOverallStatus = (status) => {
        const statusMap = {
            operational: { pulse: "ping-green", dot: "bg-green-500", text: "Todos os sistemas operacionais", textClass: "text-green-600" },
            degraded: { pulse: "ping-yellow", dot: "bg-yellow-500", text: "Performance degradada", textClass: "text-yellow-600" },
            outage: { pulse: "ping-red", dot: "bg-red-500", text: "Falha crítica no sistema", textClass: "text-red-500" }
        };

        const currentStatus = statusMap[status] || statusMap.outage;
        
        const indicatorHTML = `
            <span class="ping-pulse ${currentStatus.pulse}"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 ${currentStatus.dot}"></span>`;
        
        overallStatusIndicator.innerHTML = indicatorHTML;
        overallStatusText.textContent = currentStatus.text;
        overallStatusText.className = `font-medium ${currentStatus.textClass}`;
    };

    const runChecks = async () => {
        let finalStatus = "operational";
        detailedContainer.innerHTML = ''; // Limpa o contêiner antes de começar

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
                        JSON.parse(text); // Valida se é um JSON válido
                        if (text.trim() === "[]" || text.trim() === "") {
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
