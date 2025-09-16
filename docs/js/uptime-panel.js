document.addEventListener("DOMContentLoaded", () => {
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    // --- Seletores de Elementos do DOM ---
    const panel = document.getElementById("uptime-panel");
    // Se o painel principal não existe, a página não é a de status. Interrompe o script.
    if (!panel) return; 

    const chartContainer = panel.querySelector("#uptime-chart-container");
    const tooltip = panel.querySelector("#uptime-tooltip");
    const legendContainer = panel.querySelector("#status-legend");
    const legendHelpButton = panel.querySelector("#legend-help-button");
    const chartStartDateElem = panel.querySelector("#chart-start-date");
    const chartEndDateElem = panel.querySelector("#chart-end-date");
    const overallUptimeStatusElem = panel.querySelector("#overall-uptime-status");
    const incidentsContainer = document.getElementById("incidents-history-container");
    const overallStatusIndicator = document.getElementById("overall-status-indicator");
    const overallStatusText = document.getElementById("overall-status-text");

    // --- Configurações ---
    const totalBars = 90;
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

    /**
     * Exibe um tooltip com conteúdo customizado.
     */
    function showTooltip(targetElement, content) {
        if (!tooltip) return;
        const tooltipContent = tooltip.querySelector("#tooltip-content");
        tooltipContent.innerHTML = content;
        tooltip.classList.add("visible");

        const targetRect = targetElement.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let top = targetRect.top - panelRect.top - tooltipRect.height - 12;
        let left = targetRect.left - panelRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        if (left < 0) left = 5;
        if (left + tooltipRect.width > panelRect.width) left = panelRect.width - tooltipRect.width - 5;
        if (top < 0) top = targetRect.bottom - panelRect.top + 12;

        tooltip.style.transform = `translate(${left}px, ${top}px)`;
    }

    /**
     * Esconde o tooltip.
     */
    function hideTooltip() {
        if (tooltip) tooltip.classList.remove("visible");
    }

    /**
     * Constrói e renderiza as barras do gráfico de uptime.
     */
    function buildChart(data) {
        if (!chartContainer) return;
        chartContainer.innerHTML = '';
        data.forEach((dayData, index) => {
            const bar = document.createElement("div");
            bar.className = `uptime-bar ${statusTypes[dayData.status].colorClass}`;
            
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
     * Popula a legenda de status e adiciona interatividade ao botão "?".
     */
    function populateLegend() {
        if (!legendContainer || !legendHelpButton) return;
        legendContainer.innerHTML = `
            <span>Menos</span>
            <div class="legend-gradient"></div>
            <span>Mais</span>
        `;
        const helpTooltipContent = `
            <div class="space-y-2 text-left text-xs w-60">
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
        legendHelpButton.addEventListener('mouseenter', (e) => showTooltip(e.currentTarget, helpTooltipContent));
        legendHelpButton.addEventListener('mouseleave', hideTooltip);
    }

    /**
     * Constrói a linha do tempo de incidentes a partir dos logs.
     */
    function buildIncidentTimeline(logs) {
        if (!incidentsContainer) return;
        
        const getLogDetails = (log) => {
            const reason = log.reason ? `(Motivo: ${log.reason.detail || 'N/A'})` : '';
            switch (log.type) {
                case 1: return { text: `Indisponibilidade Detectada ${reason}`, description: "O monitor não conseguiu acessar o site.", color: "text-red-500", icon: "error" };
                case 2: return { text: `Serviço Restaurado ${reason}`, description: "O site voltou a responder normalmente.", color: "text-green-400", icon: "check_circle" };
                case 98: return { text: "Monitoramento Iniciado", description: "O serviço de monitoramento começou a operar.", color: "text-sky-400", icon: "play_circle" };
                case 99: return { text: "Monitoramento Pausado", description: "A verificação de status foi pausada manualmente.", color: "text-yellow-400", icon: "pause_circle" };
                default: return { text: `Evento (código: ${log.type})`, description: "Um evento não categorizado ocorreu.", color: "text-gray-400", icon: "info" };
            }
        };

        let incidentsHTML = '<div class="space-y-6">';
        if (logs && logs.length > 0) {
            const logsByDay = logs.reduce((acc, log) => {
                const day = formatFullDate(new Date(log.datetime * 1000));
                if (!acc[day]) acc[day] = [];
                acc[day].push(log);
                return acc;
            }, {});

            for (const day in logsByDay) {
                const dayLogs = logsByDay[day];
                const hasOutage = dayLogs.some(log => log.type === 1);
                const dayStatus = hasOutage ? { text: "Indisponibilidade Parcial", color: "text-red-500" } : { text: "Todos os sistemas operacionais", color: "text-green-400" };

                incidentsHTML += `<div><div class="flex justify-between items-center pb-2 border-b border-[var(--borders)]"><h4 class="font-semibold text-[var(--text-primary)]">${day}</h4><span class="text-sm font-medium ${dayStatus.color}">${dayStatus.text}</span></div><ul class="mt-4 space-y-4">`;
                dayLogs.forEach(log => {
                    const details = getLogDetails(log);
                    incidentsHTML += `<li class="flex items-start gap-3 pl-4 border-l border-[var(--borders)]"><span class="material-symbols-outlined ${details.color} mt-1">${details.icon}</span><div class="flex-1"><p class="font-medium ${details.color}">${details.text}</p><p class="text-xs text-[var(--text-secondary)]">${details.description}</p><p class="text-xs text-gray-500 mt-1">${formatTime(log.datetime)} (Duração: ${log.duration}s)</p></div></li>`;
                });
                incidentsHTML += `</ul></div>`;
            }
        } else {
            incidentsHTML += '<p class="text-[var(--text-secondary)]">Nenhum incidente registrado recentemente.</p>';
        }
        incidentsHTML += "</div>";
        incidentsContainer.innerHTML = incidentsHTML;
    }

    /**
     * Função principal que busca os dados e inicializa tudo.
     */
    async function initializePanel() {
        try {
            const response = await fetch(`${baseUrl}uptime-data.json?cache_bust=${Date.now()}`);
            if (!response.ok) throw new Error("Falha ao carregar uptime-data.json");
            
            const data = await response.json();
            const monitor = data?.monitors?.[0];
            if (!monitor) throw new Error("Monitor não encontrado nos dados da API.");

            // CORREÇÃO: Verifica se os elementos existem antes de manipulá-los
            if (overallStatusIndicator && overallStatusText) {
                const isUp = monitor.status === 2;
                overallStatusIndicator.querySelector(".ping-pulse").className = `ping-pulse ${isUp ? 'ping-green' : 'ping-red'}`;
                overallStatusIndicator.querySelector(".relative").className = `relative inline-flex rounded-full h-3 w-3 ${isUp ? 'bg-green-500' : 'bg-red-500'}`;
                overallStatusText.textContent = isUp ? "Todos os sistemas operacionais" : "Indisponibilidade detectada";
            }

            const uptimeRatio = monitor.custom_uptime_ratios.split('-')[1] || "100.00";
            if (overallUptimeStatusElem) {
                overallUptimeStatusElem.innerHTML = `<span class="text-sm text-[var(--text-secondary)]">Uptime de 30 dias</span> <span class="font-semibold text-lg text-[var(--success)]">${uptimeRatio}%</span>`;
            }
            
            const responseTimes = monitor.response_times;
            let chartData = [];
            if (responseTimes && responseTimes.length > 0) {
                 chartData = responseTimes.map(item => {
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
            buildIncidentTimeline(monitor.logs);
            
            if (chartStartDateElem && chartEndDateElem) {
                chartStartDateElem.textContent = formatDate(chartData[0].date);
                chartEndDateElem.textContent = "Hoje";
            }

        } catch (error) {
            console.error("Erro ao inicializar o painel de uptime:", error);
            if (panel) panel.innerHTML = `<p class="text-center text-red-500">Não foi possível carregar os dados de uptime.</p>`;
            if (incidentsContainer) incidentsContainer.innerHTML = `<p class="text-center text-red-500">Não foi possível carregar o histórico de incidentes.</p>`;
        }
    }

    initializePanel();
});
