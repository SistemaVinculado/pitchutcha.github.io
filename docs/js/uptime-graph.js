document.addEventListener("DOMContentLoaded", () => {
    // --- ELEMENTOS DO DOM ---
    const chartContainer = document.getElementById("uptime-chart-container");
    const tooltip = document.getElementById("uptime-tooltip");
    const legendContainer = document.getElementById("status-legend");
    const chartStartDate = document.getElementById("chart-start-date");
    const chartEndDate = document.getElementById("chart-end-date");

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
     * Gera dados simulados para o gráfico de uptime.
     * @returns {Array} Um array de objetos, cada um representando um dia.
     */
    function generateUptimeData() {
        const data = [];
        const today = new Date();
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - (totalDays - 1 - i));
            
            let statusKey;
            const random = Math.random();
            if (random < 0.95) { // 95% de chance de estar operacional
                statusKey = "OPERATIONAL";
            } else if (random < 0.98) { // 3% de chance de degradação
                statusKey = "DEGRADED";
            } else { // 2% de chance de indisponibilidade
                statusKey = "OUTAGE";
            }

            data.push({
                date: date,
                status: statusKey,
                details: `O sistema esteve ${statusTypes[statusKey].label.toLowerCase()} neste dia.`
            });
        }
        return data;
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

        // Posiciona o tooltip perto do cursor
        const rect = chartContainer.getBoundingClientRect();
        let left = event.clientX - rect.left - (tooltip.offsetWidth / 2);
        let top = event.clientY - rect.top - tooltip.offsetHeight - 10; // 10px acima da barra

        // Impede que o tooltip saia pela esquerda ou direita
        if (left < 0) left = 5;
        if (left + tooltip.offsetWidth > rect.width) left = rect.width - tooltip.offsetWidth - 5;
        
        // Impede que o tooltip saia por cima
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
     * @param {Array} data - Os dados de uptime dos últimos 90 dias.
     */
    function buildChart(data) {
        chartContainer.innerHTML = ''; // Limpa o contêiner

        data.forEach(dayData => {
            const bar = document.createElement("div");
            const statusInfo = statusTypes[dayData.status];
            
            bar.className = `uptime-bar h-full ${statusInfo.colorClass}`;
            
            bar.addEventListener("mousemove", (event) => showTooltip(event, dayData));
            bar.addEventListener("mouseleave", hideTooltip);
            
            chartContainer.appendChild(bar);
        });
        
        // Atualiza as datas de início e fim do gráfico
        if (data.length > 0) {
            chartStartDate.textContent = formatDate(data[0].date);
            chartEndDate.textContent = formatDate(data[data.length - 1].date);
        }
    }

    // --- INICIALIZAÇÃO ---
    const uptimeData = generateUptimeData();
    populateLegend();
    buildChart(uptimeData);
});
