document.addEventListener("DOMContentLoaded",()=>{
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';
    const uptimeContainer = document.getElementById("uptime-history-container");
    const incidentsContainer = document.getElementById("incidents-history-container");
    const latencyMetric = document.getElementById("metric-api-latency");
    const inferenceMetric = document.getElementById("metric-inference-time");
    const errorMetric = document.getElementById("metric-error-rate");

    if (uptimeContainer && incidentsContainer) {
        const formatDate = (timestamp, options = {}) => {
            if (!timestamp) return "N/A";
            const date = new Date(timestamp * 1000);
            return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", ...options });
        };
        
        const formatTime = (timestamp) => {
             if (!timestamp) return "N/A";
            const date = new Date(timestamp * 1000);
            return date.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: '2-digit', minute: '2-digit' });
        };

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

                // O card de Uptime Histórico (7 e 30 dias) foi removido para dar lugar ao gráfico de 24h
                uptimeContainer.innerHTML = ''; // Limpa o conteúdo antigo
                uptimeContainer.style.display = 'none'; // Oculta o container antigo

                // Constrói a Linha do Tempo de Incidentes
                let incidentsHTML = '<div class="space-y-6">';
                if (monitor.logs && monitor.logs.length > 0) {
                    const logsByDay = monitor.logs.reduce((acc, log) => {
                        const day = formatDate(log.datetime, { year: 'numeric', month: 'long', day: 'numeric' });
                        if (!acc[day]) {
                            acc[day] = [];
                        }
                        acc[day].push(log);
                        return acc;
                    }, {});

                    for (const day in logsByDay) {
                        const dayLogs = logsByDay[day];
                        const hasOutage = dayLogs.some(log => log.type === 1);
                        const dayStatus = hasOutage 
                            ? { text: "Indisponibilidade Parcial", color: "text-red-500" }
                            : { text: "Todos os sistemas operacionais", color: "text-green-400" };

                        incidentsHTML += `
                        <div>
                            <div class="flex justify-between items-center pb-2 border-b border-[var(--borders)]">
                                <h4 class="font-semibold text-[var(--text-primary)]">${day}</h4>
                                <span class="text-sm font-medium ${dayStatus.color}">${dayStatus.text}</span>
                            </div>
                            <ul class="mt-4 space-y-4">`;

                        dayLogs.forEach(log => {
                            const details = getLogDetails(log);
                            incidentsHTML += `
                            <li class="flex items-start gap-3 pl-4 border-l border-[var(--borders)]">
                                <span class="material-symbols-outlined ${details.color} mt-1">${details.icon}</span>
                                <div class="flex-1">
                                    <p class="font-medium ${details.color}">${details.text}</p>
                                    <p class="text-xs text-[var(--text-secondary)]">${details.description}</p>
                                    <p class="text-xs text-gray-500 mt-1">${formatTime(log.datetime)} (Duração: ${log.duration}s)</p>
                                </div>
                            </li>`;
                        });

                        incidentsHTML += `</ul></div>`;
                    }
                } else {
                    incidentsHTML += '<p class="text-[var(--text-secondary)]">Nenhum incidente registrado recentemente.</p>';
                }
                incidentsHTML += "</div>";
                incidentsContainer.innerHTML = incidentsHTML;

            }).catch(error => {
                console.error("Erro ao processar dados de uptime:", error);
                uptimeContainer.innerHTML = '<p class="text-red-500">Erro ao carregar dados de Uptime.</p>';
                incidentsContainer.innerHTML = '<p class="text-red-500">Erro ao carregar histórico de incidentes.</p>';
            });
    }
});
