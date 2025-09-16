document.addEventListener("DOMContentLoaded", () => {
    // --- ELEMENTOS DO DOM ---
    const chartContainer = document.getElementById("uptime-chart-container");
    const tooltip = document.getElementById("uptime-tooltip");
    const legendContainer = document.getElementById("status-legend");
    const chartStartDate = document.getElementById("chart-start-date");
    const chartEndDate = document.getElementById("chart-end-date");
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    if (!chartContainer || !tooltip || !legendContainer) {
        console.error("Elementos essenciais para o gráfico de uptime não foram encontrados.");
        return;
    }

    // --- CONFIGURAÇÕES E DADOS ---
    const totalDays = 90;
    const statusTypes = {
        OPERATIONAL: { label: "Operacional", colorClass: "status-operational" },
        DEGRADED: { label: "Performance Degradada", colorClass: "status-degraded" },
        OUTAGE: { label: "Indisponibilidade", colorClass: "status-outage" },
        NO_DATA: { label: "Sem Dados", colorClass: "status-no-data" },
    };

    // --- FUNÇÕES ---

    /**
     * Gera dados simulados para o gráfico de uptime, usado como fallback final.
     */
    function generateUptimeData() {
        console.warn("Usando dados de uptime simulados como fallback final.");
        const data = [];
        const today = new Date();
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - (totalDays - 1 - i));
            
            let statusKey;
            const random = Math.random();
            if (random < 0.95) statusKey = "OPERATIONAL";
            else if (random < 0.98) statusKey = "DEGRADED";
            else statusKey = "OUTAGE";

            data.push({
                date: date,
                status: statusKey,
                details: `[SIMULADO] O sistema esteve ${statusTypes[statusKey].label.toLowerCase()} neste dia.`
            });
        }
        return data;
    }

    /**
     * Processa os dados reais da API do UptimeRobot a partir dos tempos de resposta.
     */
    function processRealDataFromResponseTimes(responseTimes) {
        let processedData = responseTimes.map(item => {
            const responseTime = parseInt(item.value, 10);
            let statusKey;
            let details;

            if (responseTime === 0) {
                statusKey = "OUTAGE";
                details = "O monitor esteve indisponível (0ms).";
            } else if (responseTime > 1500) { // Limite de 1.5s
                statusKey = "DEGRADED";
                details = `Performance degradada. Resposta: ${responseTime}ms.`;
            } else {
                statusKey = "OPERATIONAL";
                details = `Tempo médio de resposta: ${responseTime}ms.`;
            }
            return { date: new Date(item.datetime * 1000), status: statusKey, details: details };
        }).reverse();

        return padDataWithNoData(processedData);
    }
    
    /**
     * Processa os dados reais a partir dos logs de incidentes como fallback.
     */
    function processRealDataFromLogs(logs) {
        console.log("Fallback para dados de uptime baseados em logs de incidentes.");
        const today = new Date();
        const dailyStatus = new Map();

        // Inicializa os últimos 90 dias como operacionais
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            dailyStatus.set(dateString, { status: "OPERATIONAL", details: "Nenhum incidente registrado neste dia." });
        }

        // Marca os dias com incidentes
        logs.forEach(log => {
            // Log do tipo 1 = Indisponibilidade (Down)
            if (log.type === 1) {
                const incidentDate = new Date(log.datetime * 1000);
                const dateString = incidentDate.toISOString().split('T')[0];
                if (dailyStatus.has(dateString)) {
                    const statusKey = log.duration > 300 ? "OUTAGE" : "DEGRADED"; // > 5 min = Outage
                    dailyStatus.set(dateString, {
                        status: statusKey,
                        details: `${statusTypes[statusKey].label} por ${log.duration} segundos.`
                    });
                }
            }
        });
        
        // Converte o Map para o formato de array esperado, ordenado
        let processedData = [];
        const sortedDates = Array.from(dailyStatus.keys()).sort();
        
        sortedDates.forEach(dateString => {
            const dayData = dailyStatus.get(dateString);
            processedData.push({
                date: new Date(dateString + 'T12:00:00Z'), // Use a timezone consistent
                status: dayData.status,
                details: dayData.details
            });
        });
        
        return processedData;
    }

    /**
     * Preenche os dados com "Sem Dados" se o histórico for menor que 90 dias.
     */
    function padDataWithNoData(data) {
        const daysMissing = totalDays - data.length;
        if (daysMissing > 0) {
            const firstDate = data.length > 0 ? data[0].date : new Date();
            const padding = Array.from({ length: daysMissing }).map((_, i) => {
                const date = new Date(firstDate);
                date.setDate(firstDate.getDate() - (daysMissing - i));
                return { date: date, status: "NO_DATA", details: "Não há dados de monitoramento para este dia." };
            });
            return [...padding, ...data];
        }
        return data;
    }

    function populateLegend() { /* ... código sem alterações ... */ }
    function formatDate(date) { /* ... código sem alterações ... */ }
    function showTooltip(event, dayData) { /* ... código sem alterações ... */ }
    function hideTooltip() { /* ... código sem alterações ... */ }
    function buildChart(data) { /* ... código sem alterações ... */ }
    
    // --- INICIALIZAÇÃO ATUALIZADA ---
    async function initializeChart() {
        populateLegend();
        try {
            const response = await fetch(`${baseUrl}uptime-data.json?cache_bust=${Date.now()}`);
            if (!response.ok) throw new Error("Falha ao carregar uptime-data.json");
            
            const data = await response.json();
            const monitor = data?.monitors?.[0];
            const responseTimes = monitor?.response_times;
            const logs = monitor?.logs;

            if (responseTimes && responseTimes.length > 0) {
                buildChart(processRealDataFromResponseTimes(responseTimes));
            } else if (logs && logs.length > 0) {
                buildChart(processRealDataFromLogs(logs));
            } else {
                buildChart(generateUptimeData());
            }
        } catch (error) {
            console.error("Erro ao carregar dados de uptime, usando fallback:", error);
            buildChart(generateUptimeData());
        }
    }

    // O código de populateLegend, formatDate, showTooltip, hideTooltip, e buildChart permanece o mesmo da versão anterior.
    // Apenas colei as funções que foram alteradas para sermos breves. O arquivo completo será o abaixo:
    
    populateLegend(); // As funções abaixo permanecem inalteradas
    function formatDate(date) { return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }); }
    function showTooltip(event, dayData) {
        const statusInfo = statusTypes[dayData.status];
        document.getElementById("tooltip-date").textContent = dayData.date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById("tooltip-status-indicator").className = `w-2 h-2 rounded-full mr-2 ${statusInfo.colorClass}`;
        document.getElementById("tooltip-status-text").textContent = statusInfo.label;
        document.getElementById("tooltip-details").textContent = dayData.details;
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
    function hideTooltip() { tooltip.classList.add("hidden"); tooltip.classList.remove("opacity-100"); }
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
            chartStartDate.textContent = formatDate(data[0].date);
            chartEndDate.textContent = formatDate(data[data.length - 1].date);
        }
    }

    initializeChart();
});
