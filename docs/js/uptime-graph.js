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
     * Gera dados simulados para o gráfico de uptime, usado como fallback.
     * @returns {Array} Um array de objetos, cada um representando um dia.
     */
    function generateUptimeData() {
        console.warn("Usando dados de uptime simulados como fallback.");
        const data = [];
        const today = new Date();
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - (totalDays - 1 - i));
            
            let statusKey;
            const random = Math.random();
            if (random < 0.95) {
                statusKey = "OPERATIONAL";
            } else if (random < 0.98) {
                statusKey = "DEGRADED";
            } else {
                statusKey = "OUTAGE";
            }

            data.push({
                date: date,
                status: statusKey,
                details: `[SIMULADO] O sistema esteve ${statusTypes[statusKey].label.toLowerCase()} neste dia.`
            });
        }
        return data;
    }

    /**
     * Processa os dados reais da API do UptimeRobot.
     * @param {Array} responseTimes - O array de tempos de resposta da API.
     * @returns {Array} Um array de dados diários formatados para o gráfico.
     */
    function processRealData(responseTimes) {
        let processedData = responseTimes.map(item => {
            const responseTime = parseInt(item.value, 10);
            let statusKey = statusTypes.OPERATIONAL.key;
            let details = `Tempo médio de resposta: ${responseTime}ms.`;

            if (responseTime === 0) {
                statusKey = "OUTAGE";
                details = "O monitor estava indisponível neste dia.";
            } else if (responseTime > 1500) { // Limite de 1.5s para performance degradada
                statusKey = "DEGRADED";
                details = `A performance foi degradada. Tempo de resposta: ${responseTime}ms.`;
            } else {
                statusKey = "OPERATIONAL";
            }

            return {
                date: new Date(item.datetime * 1000),
                status: statusKey,
                details: details
            };
        }).reverse(); // A API retorna do mais novo para o mais antigo, então invertemos.

        // Preenche com "Sem Dados" se o histórico for menor que 90 dias
        const daysMissing = totalDays - processedData.length;
        if (daysMissing > 0) {
            const firstDate = processedData.length > 0 ? processedData[0].date : new Date();
            const padding = Array.from({ length: daysMissing }).map((_, i) => {
                const date = new Date(firstDate);
                date.setDate(firstDate.getDate() - (daysMissing - i));
                return {
                    date: date,
                    status: "NO_DATA",
                    details: "Não há dados de monitoramento para este dia."
                };
            });
            processedData = [...padding, ...processedData];
        }

        return processedData;
    }


    /**
     * Popula a legenda de status com as cores e textos.
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
     * Formata uma data para exibição no formato "dd de mmm".
     * @param {Date} date - O objeto de data a ser formatado.
     * @returns {string} A data formatada.
     */
    function formatDate(date) {
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    }

    /**
     * Mostra o tooltip com informações do dia selecionado.
     * @param {MouseEvent} event - O evento do mouse.
     * @param {object} dayData - Os dados do dia.
     */
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

    /**
     * Esconde o tooltip.
     */
    function hideTooltip() {
        tooltip.classList.add("hidden");
        tooltip.classList.remove("opacity-100");
    }

    /**
     * Constrói e renderiza as barras do gráfico de uptime.
     * @param {Array} data - Os dados de uptime.
     */
    function buildChart(data) {
        chartContainer.innerHTML = ''; 

        data.forEach(dayData => {
            const bar = document.createElement("div");
            const statusInfo = statusTypes[dayData.status];
            
            bar.className = `uptime-bar h-full ${statusInfo.colorClass}`;
            
            bar.addEventListener("mousemove", (event) => showTooltip(event, dayData));
            bar.addEventListener("mouseleave", hideTooltip);
            
            chartContainer.appendChild(bar);
        });
        
        if (data.length > 0) {
            chartStartDate.textContent = formatDate(data[0].date);
            chartEndDate.textContent = formatDate(data[data.length - 1].date);
        }
    }

    // --- INICIALIZAÇÃO ---
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
                // Fallback para dados simulados se a chave não existir
                buildChart(generateUptimeData());
            }
        } catch (error) {
            console.error("Erro ao carregar dados de uptime:", error);
            // Fallback para dados simulados em caso de erro no fetch
            buildChart(generateUptimeData());
        }
    }

    initializeChart();
});
