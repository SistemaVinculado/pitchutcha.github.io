document.addEventListener("DOMContentLoaded", () => {
    // --- ELEMENTOS DO DOM ---
    const chartContainer = document.getElementById("uptime-chart-container");
    const tooltip = document.getElementById("uptime-tooltip");
    const legendContainer = document.getElementById("status-legend");
    const chartStartDate = document.getElementById("chart-start-date");
    const chartEndDate = document.getElementById("chart-end-date");
    // Seleciona o título e subtítulo para atualização dinâmica
    const uptimeTitle = document.querySelector("#uptime-chart-container")?.parentElement?.querySelector("h2");
    const uptimeSubtitle = document.querySelector("#uptime-chart-container")?.parentElement?.querySelector("p");
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    if (!chartContainer || !tooltip || !legendContainer) return;

    const totalBars = 24; // Foco em 24 horas
    const statusTypes = {
        OPERATIONAL: { label: "Operacional", colorClass: "status-operational" },
        DEGRADED: { label: "Performance Degradada", colorClass: "status-degraded" },
        OUTAGE: { label: "Indisponibilidade", colorClass: "status-outage" },
        NO_DATA: { label: "Sem Dados", colorClass: "status-no-data" },
    };

    /**
     * Processa os dados horários reais da API do UptimeRobot.
     */
    function processRealData(responseTimes) {
        let processedData = responseTimes.map(item => {
            const responseTime = parseInt(item.value, 10);
            let statusKey, details;

            if (responseTime === 0) {
                statusKey = "OUTAGE";
                details = "O monitor esteve indisponível (0ms) nesta hora.";
            } else if (responseTime > 1500) { // Limite de 1.5s
                statusKey = "DEGRADED";
                details = `Performance degradada. Resposta: ${responseTime}ms.`;
            } else {
                statusKey = "OPERATIONAL";
                details = `Tempo médio de resposta: ${responseTime}ms.`;
            }
            return { datetime: new Date(item.datetime * 1000), status: statusKey, details: details };
        }).reverse(); // Inverte para ter o mais antigo primeiro

        return padDataWithNoData(processedData);
    }
    
    /**
     * Preenche os dados com "Sem Dados" se o histórico for menor que o total de barras.
     */
    function padDataWithNoData(data) {
        const barsMissing = totalBars - data.length;
        if (barsMissing > 0) {
            const firstDate = data.length > 0 ? data[0].datetime : new Date();
            const padding = Array.from({ length: barsMissing }).map((_, i) => {
                const date = new Date(firstDate);
                date.setHours(firstDate.getHours() - (barsMissing - i));
                return { datetime: date, status: "NO_DATA", details: "Não há dados de monitoramento para esta hora." };
            });
            return [...padding, ...data];
        }
        return data;
    }

    /**
     * Popula a legenda de status.
     */
    function populateLegend() {
        legendContainer.innerHTML = Object.values(statusTypes).map(status => `
            <div class="legend-item">
                <div class="legend-color ${status.colorClass}"></div>
                <span>${status.label}</span>
            </div>
        `).join('');
    }

    /**
     * Mostra o tooltip interativo.
     */
    function showTooltip(event, hourData) {
        const statusInfo = statusTypes[hourData.status];
        
        document.getElementById("tooltip-date").textContent = hourData.datetime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
        document.getElementById("tooltip-status-indicator").className = `w-2 h-2 rounded-full mr-2 ${statusInfo.colorClass}`;
        document.getElementById("tooltip-status-text").textContent = statusInfo.label;
        document.getElementById("tooltip-details").textContent = hourData.details;

        tooltip.classList.remove("hidden");
        tooltip.classList.add("opacity-100");

        const rect = chartContainer.getBoundingClientRect();
        let left = event.clientX - rect.left - (tooltip.offsetWidth / 2);
        let top = event.clientY - rect.top - tooltip.offsetHeight - 10;

        if (left < 0) left = 5;
        if (left + tooltip.offsetWidth > rect.width) left = rect.width - tooltip.offsetWidth - 5;
        if (top < 0) top = event.clientY - rect.top + 15;

        tooltip.style.transform = `translate(${left}px, ${top}px)`;
    }

    /**
     * Esconde o tooltip.
     */
    function hideTooltip() {
        tooltip.classList.add("hidden");
        tooltip.classList.remove("opacity-100");
    }
    
    /**
     * Constrói e renderiza as barras do gráfico.
     */
    function buildChart(data) {
        // ATUALIZA OS TEXTOS DA PÁGINA
        if (uptimeTitle) uptimeTitle.textContent = "Histórico de Uptime (Últimas 24 Horas)";
        if (uptimeSubtitle) uptimeSubtitle.textContent = "Disponibilidade do serviço a cada hora.";
        
        chartContainer.innerHTML = ''; 

        data.forEach(hourData => {
            const bar = document.createElement("div");
            bar.className = `uptime-bar h-full ${statusTypes[hourData.status].colorClass}`;
            bar.addEventListener("mousemove", (event) => showTooltip(event, hourData));
            bar.addEventListener("mouseleave", hideTooltip);
            chartContainer.appendChild(bar);
        });
        
        if (data.length > 0) {
            chartStartDate.textContent = "24 horas atrás";
            chartEndDate.textContent = "Agora";
        }
    }

    /**
     * Função principal que inicializa o gráfico.
     */
    async function initializeChart() {
        populateLegend();
        try {
            const response = await fetch(`${baseUrl}uptime-data.json?cache_bust=${Date.now()}`);
            if (!response.ok) throw new Error("Falha ao carregar uptime-data.json");
            
            const data = await response.json();
            const responseTimes = data?.monitors?.[0]?.response_times;

            if (responseTimes && responseTimes.length > 0) {
                const realData = processRealData(responseTimes);
                buildChart(realData);
            } else {
                // Se não houver dados, exibe um gráfico de "Sem Dados"
                buildChart(padDataWithNoData([])); 
            }
        } catch (error) {
            console.error("Erro ao carregar dados de uptime:", error);
            // Em caso de erro, também exibe "Sem Dados"
            buildChart(padDataWithNoData([]));
        }
    }
    
    initializeChart();
});
