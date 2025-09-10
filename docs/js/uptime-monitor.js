document.addEventListener('DOMContentLoaded', () => {
    const uptimeContainer = document.getElementById('uptime-history-container');
    const incidentsContainer = document.getElementById('incidents-history-container');

    if (!uptimeContainer || !incidentsContainer) {
        return;
    }

    // Função para formatar a data
    function formatTimestamp(unix_timestamp) {
        const date = new Date(unix_timestamp * 1000);
        return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    }

    // Função para traduzir o tipo de incidente
    function getLogTypeName(type) {
        switch (type) {
            case 1: return { text: 'Pausa', color: 'text-yellow-400', icon: 'pause_circle' };
            case 2: return { text: 'Iniciado', color: 'text-green-400', icon: 'check_circle' };
            case 9: return { text: 'Parece estar fora', color: 'text-red-500', icon: 'error' };
            case 8: return { text: 'Parece estar online', color: 'text-green-400', icon: 'check_circle' };
            default: return { text: `Evento (${type})`, color: 'text-gray-400', icon: 'info' };
        }
    }

    // Busca os dados do arquivo JSON
    fetch('uptime-data.json?cache_bust=' + new Date().getTime())
        .then(response => {
            if (!response.ok) {
                throw new Error('Não foi possível carregar os dados de uptime.');
            }
            return response.json();
        })
        .then(data => {
            if (data.stat !== 'ok' || !data.monitors || data.monitors.length === 0) {
                 throw new Error('Os dados de uptime retornaram um erro: ' + (data.error?.message || 'Formato inválido'));
            }
            const monitor = data.monitors[0];

            // 1. Exibir Uptime
            const [uptime7d, uptime30d] = monitor.custom_uptime_ratio.split('-');
            const uptimeHTML = `
                <div class="p-6 bg-[#161b22] border border-[#30363d] rounded-lg">
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
                 <div class="p-6 bg-[#161b22] border border-[#30363d] rounded-lg">
                    <h3 class="font-semibold text-white mb-4">Histórico de Incidentes Recentes</h3>
                    <ul class="space-y-4">
            `;
            if (monitor.logs && monitor.logs.length > 0) {
                monitor.logs.forEach(log => {
                    const logInfo = getLogTypeName(log.type);
                    incidentsHTML += `
                        <li class="flex items-start gap-3">
                            <span class="material-symbols-outlined ${logInfo.color}">${logInfo.icon}</span>
                            <div>
                                <p class="font-medium ${logInfo.color}">${logInfo.text}</p>
                                <p class="text-sm text-gray-500">${formatTimestamp(log.datetime)} (Duração: ${log.duration}s)</p>
                            </div>
                        </li>
                    `;
                });
            } else {
                incidentsHTML += `<li><p class="text-gray-400">Nenhum incidente registrado recentemente.</p></li>`;
            }
            incidentsHTML += '</ul></div>';
            incidentsContainer.innerHTML = incidentsHTML;

        })
        .catch(error => {
            console.error('Erro ao processar dados de uptime:', error);
            uptimeContainer.innerHTML = '<p class="text-red-500">Erro ao carregar dados de Uptime.</p>';
            incidentsContainer.innerHTML = '<p class="text-red-500">Erro ao carregar histórico de incidentes.</p>';
        });
});
