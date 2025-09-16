document.addEventListener("DOMContentLoaded", () => {
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    // --- Seletores de Elementos do DOM ---
    const incidentsContainer = document.getElementById("incidents-history-container");
    const overallStatusIndicator = document.getElementById("overall-status-indicator");
    const overallStatusText = document.getElementById("overall-status-text");

    // Se os elementos não existirem na página, interrompe o script
    if (!incidentsContainer || !overallStatusIndicator || !overallStatusText) {
        return;
    }

    // --- Funções de Formatação ---
    const formatFullDate = (date) => date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formatTime = (timestamp) => new Date(timestamp * 1000).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

    /**
     * Constrói a linha do tempo de incidentes a partir dos logs.
     */
    function buildIncidentTimeline(logs) {
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
     * Função principal que busca os dados e inicializa.
     */
    async function initialize() {
        try {
            const response = await fetch(`${baseUrl}uptime-data.json?cache_bust=${Date.now()}`);
            if (!response.ok) throw new Error("Falha ao carregar uptime-data.json");
            
            const data = await response.json();
            const monitor = data?.monitors?.[0];

            // Verificação de segurança
            if (data.stat === 'fail' || !monitor) {
                 const errorMessage = data.error?.message || "Dados do monitor não encontrados.";
                 throw new Error(errorMessage);
            }

            // Atualiza o indicador de saúde geral
            const isUp = monitor.status === 2;
            overallStatusIndicator.innerHTML = `
                <span class="ping-pulse ${isUp ? 'ping-green' : 'ping-red'}"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 ${isUp ? 'bg-green-500' : 'bg-red-500'}"></span>
            `;
            overallStatusText.textContent = isUp ? "Todos os sistemas operacionais" : "Indisponibilidade detectada";

            // Renderiza a linha do tempo de incidentes
            buildIncidentTimeline(monitor.logs);

        } catch (error) {
            console.error("Erro ao inicializar o monitor de uptime:", error);
            incidentsContainer.innerHTML = `<p class="text-center text-red-500 p-4"><b>Não foi possível carregar o histórico de incidentes:</b><br>${error.message}</p>`;
            overallStatusText.textContent = "Erro na verificação";
            overallStatusIndicator.innerHTML = `<span class="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>`;
        }
    }

    initialize();
});
