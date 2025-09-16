document.addEventListener("DOMContentLoaded", () => {
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    // --- Seletores de Elementos do DOM ---
    const panel = document.getElementById("uptime-panel");
    if (!panel) return; // Se o painel principal não existe, interrompe o script.

    const chartContainer = panel.querySelector("#uptime-chart-container");
    const tooltip = panel.querySelector("#uptime-tooltip");
    const legendContainer = panel.querySelector("#status-legend");
    const legendHelpButton = panel.querySelector("#legend-help-button");
    const chartStartDateElem = panel.querySelector("#chart-start-date");
    const chartEndDateElem = panel.querySelector("#chart-end-date");
    const overallUptimeStatusElem = panel.querySelector("#overall-uptime-status");
    const incidentsContainer = document.getElementById("incidents-history-container");

    // --- Configurações ---
    const totalBars = 90; // Exibirá 90 barras (dias) por padrão
    const statusTypes = {
        OPERATIONAL: { label: "Operacional", colorClass: "status-operational", description: "Todos os sistemas funcionando normalmente." },
        DEGRADED: { label: "Performance Degradada", colorClass: "status-degraded", description: "O site pode apresentar lentidão ou pequenos erros." },
        OUTAGE: { label: "Indisponibilidade", colorClass: "status-outage", description: "O site ou parte dele está fora do ar." },
        NO_DATA: { label: "Sem Dados", colorClass: "status-no-data", description: "Não há dados de monitoramento para este período." },
    };

    // --- Funções de Formatação ---
    const formatDate = (date) => date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    const formatFullDate = (date) => date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formatTime = (timestamp) => new Date(timestamp * 1000).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

    // --- Funções de Renderização e Lógica ---

    /**
     * Exibe um tooltip com conteúdo customizado.
     */
    function showTooltip(targetElement, content, type = 'default') {
        const tooltipContent = tooltip.querySelector("#tooltip-content");
        tooltipContent.innerHTML = content;
        tooltip.classList.add("visible");

        const targetRect = targetElement.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let top = targetRect.top - panelRect.top - tooltipRect.height - 12; // 12px de espaço
        let left = targetRect.left - panelRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        // Previne que o tooltip saia da tela
        if (left < 0) left = 5;
        if (left + tooltipRect.width > panelRect.width) left = panelRect.width - tooltipRect.width - 5;
        if (top < 0) top = targetRect.bottom - panelRect.top + 12;

        tooltip.style.transform = `translate(${left}px, ${top}px)`;
    }

    /**
     * Esconde o tooltip.
     */
    function hideTooltip() {
        tooltip.classList.remove("visible");
    }

    /**
     * Constrói e renderiza as barras do gráfico de uptime.
     */
    function buildChart(data) {
        chartContainer.innerHTML = ''; // Limpa o contêiner
        data.forEach((dayData, index) => {
            const bar = document.createElement("div");
            bar.className = `uptime-bar ${statusTypes[dayData.status].colorClass}`;
            
            // Adiciona efeito de pulso à última barra (status atual)
            if (index === data.length - 1 && dayData.status !== 'NO_DATA') {
                bar.classList.add('ping-pulse-bar');
            }

            const tooltipContent = `
                <div class="font-bold text-white">${formatFullDate(dayData.date)}</div>
                <div class="flex items-center mt-1">
                    <div class="w-2 h-2 rounded-full ${statusTypes[dayData.status].colorClass} mr-2"></div>
                    <div>${statusTypes[dayData.status].label}</div>
                </div>
                <div class="text-xs text-[var(--text-secondary)] mt-1">${dayData.details}</div>
            `;

            bar.addEventListener("mouseenter", (e) => showTooltip(e.currentTarget, tooltipContent));
            bar.addEventListener("mouseleave", hideTooltip);
            
            chartContainer.appendChild(bar);
        });
    }
    
    /**
     * Popula a legenda de status (agora com as cores corretas).
     */
    function populateLegend() {
        const helpTooltipContent = `
            <div class="space-y-2 text-left">
                ${Object.values(statusTypes).map(s => `
                    <div class="flex items-start">
                        <div class="w-3 h-3 rounded-sm ${s.colorClass} mr-2 mt-0.5 flex-shrink-0"></div>
                        <div>
                            <span class="font-bold text-white">${s.label}</span>
                            <span class="text-[var(--text-secondary)] block">${s.description}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        legendHelpButton.addEventListener('mouseenter', (e) => showTooltip(e.currentTarget, helpTooltipContent, 'help'));
        legendHelpButton.addEventListener('mouseleave', hideTooltip);
    }


    /**
     * Processa os logs de incidentes para criar uma linha do tempo.
     */
    function buildIncidentTimeline(logs) {
        // ... (lógica do uptime-monitor.js pode ser integrada aqui se necessário, ou mantida separada)
    }

    /**
     * Função principal que busca os dados e inicializa o painel.
     */
    async function initializePanel() {
        try {
            const response = await fetch(`${baseUrl}uptime-data.json?cache_bust=${Date.now()}`);
            if (!response.ok) throw new Error("Falha ao carregar uptime-data.json");
            
            const data = await response.json();
            const monitor = data?.monitors?.[0];
            if (!monitor) throw new Error("Monitor não encontrado nos dados da API.");

            // Calcula e exibe o uptime geral
            const uptimeRatio = monitor.custom_uptime_ratios.split('-')[1] || "100.00"; // Usa 30 dias
            overallUptimeStatusElem.innerHTML = `<span class="text-sm text-[var(--text-secondary)]">Uptime de 30 dias</span> <span class="font-semibold text-lg text-[var(--success)]">${uptimeRatio}%</span>`;
            
            // Processa dados para o gráfico
            const responseTimes = monitor.response_times;
            let chartData;
            if (responseTimes && responseTimes.length > 0) {
                 chartData = responseTimes.map(item => {
                    const responseTime = parseInt(item.value, 10);
                    let statusKey = "OPERATIONAL", details = `Tempo médio de resposta: ${responseTime}ms.`;
                    if (responseTime === 0) { statusKey = "OUTAGE"; details = "O monitor esteve indisponível (0ms) nesta hora."; }
                    else if (responseTime > 1500) { statusKey = "DEGRADED"; details = `Performance degradada. Resposta: ${responseTime}ms.`; }
                    return { date: new Date(item.datetime * 1000), status: statusKey, details: details };
                }).reverse();
            } else {
                 chartData = []; // Inicia vazio se não houver dados
            }

            // Preenche os dias que faltam
            const daysMissing = totalBars - chartData.length;
            if (daysMissing > 0) {
                const firstDate = chartData.length > 0 ? chartData[0].date : new Date();
                const padding = Array.from({ length: daysMissing }).map((_, i) => {
                    const date = new Date(firstDate);
                    date.setDate(firstDate.getDate() - (daysMissing - i));
                    return { date: date, status: "NO_DATA", details: "Não há dados de monitoramento para este dia." };
                });
                chartData = [...padding, ...chartData];
            }
            
            // Renderiza o painel
            buildChart(chartData);
            populateLegend();
            
            // Atualiza as datas
            chartStartDateElem.textContent = formatDate(chartData[0].date);
            chartEndDateElem.textContent = "Hoje";

        } catch (error) {
            console.error("Erro ao inicializar o painel de uptime:", error);
            panel.innerHTML = `<p class="text-center text-red-500">Não foi possível carregar os dados de uptime.</p>`;
        }
    }

    initializePanel();
});
