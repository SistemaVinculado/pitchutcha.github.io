document.addEventListener("DOMContentLoaded", () => {
    // --- ELEMENTOS DO DOM ---
    const chartContainer = document.getElementById("uptime-chart-container");
    const tooltip = document.getElementById("uptime-tooltip");
    const legendContainer = document.getElementById("status-legend");
    const chartStartDate = document.getElementById("chart-start-date");
    const chartEndDate = document.getElementById("chart-end-date");
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    // Se o contêiner do gráfico não for encontrado, interrompe o script
    if (!chartContainer) {
        return;
    }

    // --- CONFIGURAÇÕES ---
    const totalDays = 90;
    const statusTypes = {
        OPERATIONAL: { label: "Operacional", colorClass: "status-operational" },
        DEGRADED: { label: "Performance Degradada", colorClass: "status-degraded" },
        OUTAGE: { label: "Indisponibilidade", colorClass: "status-outage" },
        NO_DATA: { label: "Sem Dados", colorClass: "status-no-data" },
    };

    /**
     * Processa os dados reais da API do UptimeRobot.
     */
    function processRealData(responseTimes) {
        let processedData = responseTimes.map(item => {
            const responseTime = parseInt(item.value, 10);
            let statusKey, details;

            if (responseTime === 0) {
                statusKey = "OUTAGE";
                details = "O monitor esteve indisponível (0ms) neste dia.";
            } else if (responseTime > 1500) {
                statusKey = "DEGRADED";
                details = `Performance degradada. Resposta: ${responseTime}ms.`;
            } else {
                statusKey = "OPERATIONAL";
                details = `Tempo médio de resposta: ${responseTime}ms.`;
            }
            return { date: new Date(item.datetime * 1000), status: statusKey, details: details };
        }).reverse();

        const daysMissing = totalDays - processedData.length;
        if (daysMissing > 0) {
            const firstDate = processedData.length > 0 ? processedData[0].date : new Date();
            const padding = Array.from({ length: daysMissing }).map((_, i) => {
                const date = new Date(firstDate);
                date.setDate(firstDate.getDate() - (daysMissing - i));
                return { date, status: "NO_DATA", details: "Não há dados de monitoramento para este dia." };
            });
            processedData = [...padding, ...processedData];
        }
        return processedData.slice(-totalDays);
    }
    
    /**
     * Formata uma data para exibição no formato "dd de mmm".
     */
    function formatDate(date) {
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    }

    /**
     * Mostra o tooltip com informações do dia selecionado.
     */
    function showTooltip(event, dayData) {
        if (!tooltip) return;
        const statusInfo = statusTypes[dayData.status];
        
        document.getElementById("tooltip-date").textContent = dayData.date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById("tooltip-status-indicator").className = `w-2 h-2 rounded-full mr-2 ${statusInfo.colorClass}`;
        document.getElementById("tooltip-status-text").textContent = statusInfo.label;
        document.getElementById("tooltip-details").textContent = dayData.details;

        tooltip.classList.remove("hidden", "opacity-0");
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
        if (tooltip) tooltip.classList.add("hidden", "opacity-0");
    }

    /**
     * Constrói e renderiza as barras do gráfico de uptime.
     */
    function buildChart(data) {
        chartContainer.innerHTML = '';
        data.forEach(dayData => {
            const bar = document.createElement("div");
            bar.className = `uptime-bar h-full ${statusTypes[dayData.status].colorClass}`;
            bar.addEventListener("mousemove", (event) => showTooltip(event, dayData));
            bar.addEventListener("mouseleave", hideTooltip);
            chartContainer.appendChild(bar);
        });
        
        if (data.length > 0) {
            if (chartStartDate) chartStartDate.textContent = formatDate(data[0].date);
            if (chartEndDate) chartEndDate.textContent = formatDate(data[data.length - 1].date);
        }
    }

    /**
     * Função principal que busca os dados e inicializa o gráfico.
     */
    async function initializeGraph() {
        try {
            const response = await fetch(`${baseUrl}uptime-data.json?cache_bust=${Date.now()}`);
            if (!response.ok) throw new Error("Falha ao carregar uptime-data.json");
            
            const data = await response.json();
            const monitor = data?.monitors?.[0];
            const responseTimes = monitor?.response_times;

            if (responseTimes) {
                const realData = processRealData(responseTimes);
                buildChart(realData);
            } else {
                 throw new Error("Dados de 'response_times' não encontrados.");
            }
        } catch (error) {
            console.error("Erro ao inicializar o gráfico de uptime:", error);
            if (chartContainer) chartContainer.innerHTML = `<p class="text-red-500 text-xs w-full text-center">${error.message}</p>`;
        }
    }

    initializeGraph();
});
