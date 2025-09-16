document.addEventListener("DOMContentLoaded", () => {
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';
    const uptimeContainer = document.getElementById("uptime-history-container");
    const incidentsContainer = document.getElementById("incidents-history-container");
    const overallStatusIndicator = document.getElementById("overall-status-indicator");
    const overallStatusText = document.getElementById("overall-status-text");

    if (!uptimeContainer || !incidentsContainer) return;

    const formatDate = (timestamp) => {
        if (!timestamp) return "N/A";
        return new Date(timestamp * 1000).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    };

    const getLogDetails = (log) => {
        const reason = log.reason ? `(Motivo: ${log.reason.detail || 'N/A'})` : '';
        switch (log.type) {
            case 1: return { text: `Indisponibilidade Detectada ${reason}`, color: "text-red-500", icon: "error" };
            case 2: return { text: `Serviço Restaurado`, color: "text-green-400", icon: "check_circle" };
            case 98: return { text: "Monitoramento Iniciado", color: "text-sky-400", icon: "play_circle" };
            default: return { text: `Evento (código: ${log.type})`, color: "text-gray-400", icon: "info" };
        }
    };

    async function initialize() {
        try {
            const response = await fetch(`${baseUrl}uptime-data.json?cache_bust=${Date.now()}`);
            if (!response.ok) throw new Error("Falha na rede ao buscar dados.");

            const data = await response.json();
            const monitor = data?.monitors?.[0];

            if (data.stat === 'fail' || !monitor || !monitor.custom_uptime_ratios) {
                const errorMessage = data.error?.message || "Dados do monitor não foram encontrados no arquivo JSON.";
                throw new Error(errorMessage);
            }

            // Atualiza Saúde Geral
            if(overallStatusIndicator && overallStatusText) {
                const isUp = monitor.status === 2;
                overallStatusIndicator.innerHTML = `<span class="ping-pulse ${isUp ? 'ping-green' : 'ping-red'}"></span><span class="relative inline-flex rounded-full h-3 w-3 ${isUp ? 'bg-green-500' : 'bg-red-500'}"></span>`;
                overallStatusText.textContent = isUp ? "Todos os sistemas operacionais" : "Indisponibilidade detectada";
            }

            // Popula Card de Uptime Histórico
            const uptimeRatios = monitor.custom_uptime_ratios.split("-");
            const uptimeHTML = `
                <div class="p-6 bg-[var(--background-secondary)] border border-[var(--borders)] rounded-lg">
                    <h3 class="font-semibold text-[var(--text-primary)]">Uptime Histórico</h3>
                    <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="text-center">
                            <p class="text-3xl font-bold text-green-400">${uptimeRatios[0]}%</p>
                            <p class="text-sm text-[var(--text-secondary)]">Últimas 24 horas</p>
                        </div>
                        <div class="text-center">
                            <p class="text-3xl font-bold text-green-400">${uptimeRatios[1]}%</p>
                            <p class="text-sm text-[var(--text-secondary)]">Últimos 7 dias</p>
                        </div>
                    </div>
                </div>`;
            uptimeContainer.innerHTML = uptimeHTML;

            // Popula Histórico de Incidentes
            let incidentsHTML = `<div class="p-6 bg-[var(--background-secondary)] border border-[var(--borders)] rounded-lg"><h3 class="font-semibold text-[var(--text-primary)] mb-4">Histórico de Incidentes Recentes</h3><ul class="space-y-4">`;
            if (monitor.logs && monitor.logs.length > 0) {
                monitor.logs.forEach(log => {
                    const details = getLogDetails(log);
                    incidentsHTML += `<li class="flex items-start gap-3"><span class="material-symbols-outlined ${details.color}">${details.icon}</span><div><p class="font-medium ${details.color}">${details.text}</p><p class="text-sm text-gray-500">${formatDate(log.datetime)} (Duração: ${log.duration}s)</p></div></li>`;
                });
            } else {
                incidentsHTML += '<li><p class="text-[var(--text-secondary)]">Nenhum incidente registrado recentemente.</p></li>';
            }
            incidentsHTML += "</ul></div>";
            incidentsContainer.innerHTML = incidentsHTML;

        } catch (error) {
            console.error("Erro ao processar dados de uptime:", error);
            const errorMessage = `<p class="text-red-500 p-4"><b>Erro:</b> ${error.message}</p>`;
            uptimeContainer.innerHTML = errorMessage;
            incidentsContainer.innerHTML = errorMessage;
        }
    }

    initialize();
});
