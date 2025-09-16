document.addEventListener("DOMContentLoaded",()=>{
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';
    const uptimeContainer = document.getElementById("uptime-history-container");
    const incidentsContainer = document.getElementById("incidents-history-container");
    const latencyMetric = document.getElementById("metric-api-latency");
    const inferenceMetric = document.getElementById("metric-inference-time");
    const errorMetric = document.getElementById("metric-error-rate");

    if (uptimeContainer && incidentsContainer) {
        const formatDate = (timestamp) => {
            if (!timestamp) return "N/A";
            const date = new Date(timestamp * 1000);
            return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        };

        const getLogDetails = (logType) => {
            switch (logType) {
                case 1: return { text: "Indisponibilidade Detectada", color: "text-red-500", icon: "error" };
                case 2: return { text: "Serviço Restaurado", color: "text-green-400", icon: "check_circle" };
                case 98: return { text: "Monitoramento Iniciado", color: "text-sky-400", icon: "play_circle" };
                case 99: return { text: "Monitoramento Pausado", color: "text-yellow-400", icon: "pause_circle" };
                default: return { text: `Evento (código: ${logType})`, color: "text-gray-400", icon: "info" };
            }
        };

        fetch(`${baseUrl}uptime-data.json?cache_bust=` + Date.now())
            .then(response => {
                if (!response.ok) {
                    throw new Error("Não foi possível carregar os dados de uptime.");
                }
                return response.json();
            })
            .then(data => {
                if (data.stat !== 'ok' || !data.monitors || data.monitors.length === 0) {
                    throw new Error("Os dados de uptime retornaram um erro: " + (data.error?.message || "Formato inválido"));
                }
                const monitor = data.monitors[0];

                if (latencyMetric && inferenceMetric && errorMetric && data.metrics) {
                    latencyMetric.textContent = data.metrics.api_latency || "--ms";
                    inferenceMetric.textContent = data.metrics.inference_time || "--ms";
                    errorMetric.textContent = data.metrics.error_rate || "--%";
                }

                const uptimeRatios = monitor.custom_uptime_ratio.split("-");
                const uptimeHTML = `
                <div class="p-6 bg-[var(--background-secondary)] border border-[var(--secondary-color)] rounded-lg">
                    <h3 class="font-semibold text-[var(--text-primary)]">Uptime Histórico</h3>
                    <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="text-center">
                            <p class="text-3xl font-bold text-green-400">${uptimeRatios[0]}%</p>
                            <p class="text-sm text-[var(--text-secondary)]">Últimos 7 dias</p>
                        </div>
                        <div class="text-center">
                            <p class="text-3xl font-bold text-green-400">${uptimeRatios[1]}%</p>
                            <p class="text-sm text-[var(--text-secondary)]">Últimos 30 dias</p>
                        </div>
                    </div>
                </div>
            `;
                uptimeContainer.innerHTML = uptimeHTML;

                let incidentsHTML = `
                 <div class="p-6 bg-[var(--background-secondary)] border border-[var(--secondary-color)] rounded-lg">
                    <h3 class="font-semibold text-[var(--text-primary)] mb-4">Histórico de Incidentes Recentes</h3>
                    <ul class="space-y-4">
            `;
                if (monitor.logs && monitor.logs.length > 0) {
                    monitor.logs.forEach(log => {
                        const details = getLogDetails(log.type);
                        incidentsHTML += `
                        <li class="flex items-start gap-3">
                            <span class="material-symbols-outlined ${details.color}">${details.icon}</span>
                            <div>
                                <p class="font-medium ${details.color}">${details.text}</p>
                                <p class="text-sm text-gray-500">${formatDate(log.datetime)} (Duração: ${log.duration}s)</p>
                            </div>
                        </li>
                    `;
                    });
                } else {
                    incidentsHTML += '<li><p class="text-[var(--text-secondary)]">Nenhum incidente registrado recentemente.</p></li>';
                }
                incidentsHTML += "</ul></div>";
                incidentsContainer.innerHTML = incidentsHTML;

            }).catch(error => {
                console.error("Erro ao processar dados de uptime:", error);
                uptimeContainer.innerHTML = '<p class="text-red-500">Erro ao carregar dados de Uptime.</p>';
                incidentsContainer.innerHTML = '<p class="text-red-500">Erro ao carregar histórico de incidentes.</p>';
            });
    }
});
