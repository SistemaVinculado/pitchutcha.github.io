document.addEventListener("DOMContentLoaded", () => {
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    // --- Seletores de Elementos do DOM ---
    const panel = document.getElementById("uptime-panel");
    if (!panel) return;

    const chartContainer = panel.querySelector("#uptime-chart-container");
    const tooltip = panel.querySelector("#uptime-tooltip");
    const legendContainer = panel.querySelector("#status-legend");
    const legendHelpButton = panel.querySelector("#legend-help-button");
    const chartStartDateElem = panel.querySelector("#chart-start-date");
    const chartEndDateElem = panel.querySelector("#chart-end-date");
    const overallUptimeStatusElem = panel.querySelector("#overall-uptime-status");

    // --- Configurações ---
    const totalBars = 90;
    const statusTypes = {
        OPERATIONAL: { label: "Operacional", colorClass: "status-operational", description: "Todos os sistemas funcionando normalmente." },
        DEGRADED: { label: "Performance Degradada", colorClass: "status-degraded", description: "O site pode apresentar lentidão ou pequenos erros." },
        OUTAGE: { label: "Indisponibilidade", colorClass: "status-outage", description: "O site ou parte dele está fora do ar." },
        NO_DATA: { label: "Sem Dados", colorClass: "status-no-data", description: "Não há dados de monitoramento para este período." },
    };

    // --- Funções de Formatação e UI ---
    const formatDate = (date) => date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    const formatFullDate = (date) => date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    function showTooltip(targetElement, content) {
        if (!tooltip) return;
        tooltip.querySelector("#tooltip-content").innerHTML = content;
        tooltip.classList.add("visible");
        const targetRect = targetElement.getBoundingClientRect(), panelRect = panel.getBoundingClientRect(), tooltipRect = tooltip.getBoundingClientRect();
        let top = targetRect.top - panelRect.top - tooltipRect.height - 12;
        let left = targetRect.left - panelRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        if (left < 0) left = 5;
        if (left + tooltipRect.width > panelRect.width) left = panelRect.width - tooltipRect.width - 5;
        if (top < 0) top = targetRect.bottom - panelRect.top + 12;
        tooltip.style.transform = `translate(${left}px, ${top}px)`;
    }

    function hideTooltip() { if (tooltip) tooltip.classList.remove("visible"); }

    function buildChart(data) {
        if (!chartContainer) return;
        chartContainer.innerHTML = '';
        data.forEach((dayData, index) => {
            const bar = document.createElement("div");
            bar.className = `uptime-bar ${statusTypes[dayData.status].colorClass}`;
            if (index === data.length - 1 && dayData.status !== 'NO_DATA') bar.classList.add('ping-pulse-bar');
            const tooltipContent = `<div class="font-bold text-white">${formatFullDate(dayData.date)}</div><div class="flex items-center mt-1"><div class="w-2 h-2 rounded-full ${statusTypes[dayData.status].colorClass} mr-2"></div><div>${statusTypes[dayData.status].label}</div></div><div class="text-xs text-[var(--text-secondary)] mt-1">${dayData.details}</div>`;
            bar.addEventListener("mouseenter", (e) => showTooltip(e.currentTarget, tooltipContent));
            bar.addEventListener("mouseleave", hideTooltip);
            chartContainer.appendChild(bar);
        });
    }
    
    function populateLegend() {
        if (!legendContainer || !legendHelpButton) return;
        legendContainer.innerHTML = `<span>Menos</span><div class="legend-gradient"></div><span>Mais</span>`;
        const helpTooltipContent = `<div class="space-y-2 text-left text-xs w-60">${Object.values(statusTypes).map(s => `<div class="flex items-start"><div class="w-3 h-3 rounded-sm ${s.colorClass} mr-2 mt-0.5 flex-shrink-0"></div><div><span class="font-bold text-white">${s.label}</span><span class="text-[var(--text-secondary)] block">${s.description}</span></div></div>`).join('')}</div>`;
        legendHelpButton.addEventListener('mouseenter', (e) => showTooltip(e.currentTarget, helpTooltipContent));
        legendHelpButton.addEventListener('mouseleave', hideTooltip);
    }

    /**
     * Função principal que busca os dados e inicializa o gráfico.
     */
    async function initializeGraph() {
        try {
            const response = await fetch(`${baseUrl}uptime-data.json?cache_bust=${Date.now()}`);
            if (!response.ok) throw new Error("Falha na rede ao buscar uptime-data.json");
            
            const data = await response.json();
            const monitor = data?.monitors?.[0];
            
            // Verificação CRÍTICA: Se não houver dados do monitor ou uptime, falha de forma segura.
            if (!monitor || !monitor.custom_uptime_ratios) {
                throw new Error("Dados do monitor incompletos no arquivo JSON. Execute o workflow novamente.");
            }

            // --- Se os dados existem, continue ---
            if (overallUptimeStatusElem) {
                const uptimeRatio = monitor.custom_uptime_ratios.split('-')[1] || "100.00";
                overallUptimeStatusElem.innerHTML = `<span class="text-sm text-[var(--text-secondary)]">Uptime de 30 dias</span> <span class="font-semibold text-lg text-[var(--success)]">${uptimeRatio}%</span>`;
            }
            
            let chartData = [];
            if (monitor.response_times && monitor.response_times.length > 0) {
                 chartData = monitor.response_times.map(item => {
                    const rt = parseInt(item.value, 10);
                    let status = "OPERATIONAL", details = `Tempo médio de resposta: ${rt}ms.`;
                    if (rt === 0) { status = "OUTAGE"; details = "O monitor esteve indisponível (0ms)."; }
                    else if (rt > 1500) { status = "DEGRADED"; details = `Performance degradada. Resposta: ${rt}ms.`; }
                    return { date: new Date(item.datetime * 1000), status, details };
                }).reverse();
            }
            
            const daysMissing = totalBars - chartData.length;
            if (daysMissing > 0) {
                const firstDate = chartData.length > 0 ? chartData[0].date : new Date();
                const padding = Array.from({ length: daysMissing }).map((_, i) => {
                    const date = new Date(firstDate);
                    date.setDate(firstDate.getDate() - (daysMissing - i));
                    return { date, status: "NO_DATA", details: "Não há dados para este dia." };
                });
                chartData = [...padding, ...chartData];
            }
            
            buildChart(chartData.slice(-totalBars));
            populateLegend();
            
            if (chartStartDateElem && chartEndDateElem) {
                chartStartDateElem.textContent = formatDate(chartData[0].date);
                chartEndDateElem.textContent = "Hoje";
            }

        } catch (error) {
            console.error("Erro ao inicializar o gráfico de uptime:", error);
            if (panel) {
                const titleElem = panel.querySelector("#uptime-panel-title");
                if(titleElem) titleElem.textContent = "Erro ao carregar dados";
                panel.querySelector("#uptime-chart-container").innerHTML = `<p class="text-center text-xs text-red-500 w-full">${error.message}</p>`;
            }
        }
    }

    initializeGraph();
});
