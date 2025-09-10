document.addEventListener('DOMContentLoaded', () => {
    const uptimeContainer = document.getElementById('uptime-history-container');
    const incidentsContainer = document.getElementById('incidents-history-container');

    if (!uptimeContainer || !incidentsContainer) {
        return;
    }

    // Função para formatar a data
    function formatTimestamp(unix_timestamp) {
        if (!unix_timestamp) return 'N/A';
        const date = new Date(unix_timestamp * 1000);
        return date.toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'medium'
        });
    }

    // Função para traduzir o tipo de incidente
    function getLogTypeName(type) {
        switch (type) {
            case 1: return { text: 'Pausado', color: 'text-yellow-400', icon: 'pause_circle' };
            case 2: return { text: 'Iniciado', color: 'text-green-400', icon: 'check_circle' };
            case 9: return { text: 'Indisponível', color: 'text-red-500', icon: 'error' };
            case 8: return { text: 'Disponível', color: 'text-green-400', icon: 'check_circle' };
            default: return { text: `Evento (${type})`, color: 'text-gray-400', icon: 'info' };
        }
    }

    async function fetchAndDisplayUptimeData() {
        try {
            // Adiciona um parâmetro para evitar cache
            const response = await fetch('uptime-data.json?cache_bust=' + new Date().getTime());

            if (!response.ok) {
                throw new Error(`Falha na rede ao buscar o arquivo: Status ${response.status}`);
            }

            const textContent = await response.text();
            if (!textContent) {
                throw new Error('O arquivo uptime-data.json está vazio.');
            }

            let data;
            try {
                data = JSON.parse(textContent);
            } catch (e) {
                throw new Error('O arquivo uptime-data.json não é um JSON válido. Conteúdo recebido: ' + textContent.substring(0, 100) + '...');
            }


            if (data.stat !== 'ok' || !data.monitors || data.monitors.length === 0) {
                 const errorMessage = data.error?.message || 'Formato de dados inválido ou monitor não encontrado.';
                 throw new Error('A API do UptimeRobot retornou um erro: ' + errorMessage);
            }

            const monitor = data.monitors[0];

            // 1. Exibir Uptime
            const uptimeRatios = monitor.custom_uptime_ratio ? monitor.custom_uptime_ratio.split('-') : ['N/A', 'N/A'];
            const [uptime7d, uptime30d] = uptimeRatios;
            const uptimeHTML = `
                <div class="p-6 bg-[#161b22] border border-[#30363d] rounded-lg h-full">
                    <h3 class="font-semibold text-white">Uptime Histórico</h3>
                    <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="text-center">
                            <p class="text-3xl font-bold text-green-400">${uptime7d}%</p>
                            <p class="text-sm text-gray-400">Últimos 7 dias</p>
                        </div>
                        <div class="text-center">
                            <p class="text-3xl font-bold text-green-400">${uptime30d}%</p>
                            <p class="text-sm text-gray-400">Últimos 30 dias</p>
                        </div>
                    </div>
                </div>
            `;
            uptimeContainer.innerHTML = uptimeHTML;

            // 2. Exibir Incidentes
            let incidentsHTML = `
                 <div class="p-6 bg-[#161b22] border border-[#30363d] rounded-lg h-full">
                    <h3 class="font-semibold text-white mb-4">Histórico de Incidentes Recentes</h3>
                    <ul class="space-y-4">
            `;
            if (monitor.logs && monitor.logs.length > 0) {
                monitor.logs.forEach(log => {
                    const logInfo = getLogTypeName(log.type);
                    incidentsHTML += `
                        <li class="flex items-start gap-3">
                            <span class="material-symbols-outlined ${logInfo.color} mt-1">${logInfo.icon}</span>
                            <div>
                                <p class="font-medium ${logInfo.color}">${logInfo.text}</p>
                                <p class="text-sm text-gray-500">${formatTimestamp(log.datetime)} (Duração: ${log.duration} segundos)</p>
                            </div>
                        </li>
                    `;
                });
            } else {
                incidentsHTML += `<li><p class="text-gray-400">Nenhum incidente registrado recentemente.</p></li>`;
            }
            incidentsHTML += '</ul></div>';
            incidentsContainer.innerHTML = incidentsHTML;

        } catch (error) {
            console.error('Erro detalhado ao processar dados de uptime:', error.message);
            const errorMessageHTML = `<p class="text-red-400 text-sm p-4 bg-red-900/20 rounded-lg border border-red-500/30"><strong>Erro:</strong> ${error.message}</p>`;
            uptimeContainer.innerHTML = errorMessageHTML;
            incidentsContainer.innerHTML = errorMessageHTML;
        }
    }

    fetchAndDisplayUptimeData();
});
