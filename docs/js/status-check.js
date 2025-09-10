document.addEventListener('DOMContentLoaded', () => {
    const overallStatusIndicator = document.getElementById('overall-status-indicator');
    const overallStatusText = document.getElementById('overall-status-text');
    const detailedStatusContainer = document.getElementById('detailed-status-container');

    if (!overallStatusIndicator || !detailedStatusContainer) {
        return;
    }

    const componentsToCheck = [
        { name: 'Página Principal', url: 'index.html', type: 'Página' },
        { name: 'Página de Algoritmos', url: 'algorithms.html', type: 'Página' },
        { name: 'Página de Estrutura de Dados', url: 'data-structures.html', type: 'Página' },
        { name: 'Página de Busca', url: 'search.html', type: 'Página' },
        { name: 'Página de Status', url: 'status.html', type: 'Página' },
        { name: 'CSS Principal', url: 'css/style.css', type: 'Recurso' },
        { name: 'JS Principal', url: 'js/script.js', type: 'Recurso' },
        { name: 'JS da Busca', url: 'js/search.js', type: 'Recurso' },
        { name: 'Painel de Dev', url: 'js/dev-panel.js', type: 'Recurso' },
        { name: 'Banco de Dados da Busca', url: 'search.json', type: 'Recurso', checkIntegrity: true }
    ];

    const slowThreshold = 500; // Meio segundo

    function renderStatusItem(name, status, message) {
        const statuses = {
            operational: { color: 'green', text: 'Operational', pulseColor: 'ping-green' },
            degraded: { color: 'yellow', text: 'Degraded', pulseColor: 'ping-yellow' },
            outage: { color: 'red', text: 'Outage', pulseColor: 'ping-red' }
        };
        const currentStatus = statuses[status] || { color: 'gray', text: 'Unknown', pulseColor: '' };

        const itemHTML = `
            <div class="flex items-center justify-between p-4 border-b border-[#30363d] last:border-b-0">
                <div>
                    <p class="text-white font-semibold">${name}</p>
                    <p class="text-sm text-gray-400">${message}</p>
                </div>
                <div class="flex items-center gap-2 text-sm">
                    <span class="relative flex h-3 w-3">
                        <span class="ping-pulse ${currentStatus.pulseColor} text-${currentStatus.color}-400"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 ${currentStatus.pulseColor}"></span>
                    </span>
                    <span class="capitalize text-${currentStatus.color}-400">${currentStatus.text}</span>
                </div>
            </div>
        `;
        detailedStatusContainer.insertAdjacentHTML('beforeend', itemHTML);
    }

    async function runChecks() {
        let finalStatus = 'operational';

        for (const component of componentsToCheck) {
            const startTime = performance.now();
            let status = 'outage';
            let message = '';

            try {
                const response = await fetch(component.url, { cache: 'no-store' });
                const duration = performance.now() - startTime;

                if (response.ok) {
                    // Verificação de integridade (para JSON)
                    if (component.checkIntegrity) {
                        const text = await response.text();
                        if (text.length === 0) {
                             status = 'outage';
                             message = 'Falha: Arquivo está vazio. Dica: Verifique se o conteúdo não foi apagado.';
                             finalStatus = 'outage';
                        } else {
                            JSON.parse(text); // Tenta parsear, vai dar erro se for inválido
                            status = 'operational';
                            message = `Componente íntegro e operacional (${duration.toFixed(0)}ms).`;
                        }
                    } else { // Verificação normal de arquivo
                        if (duration > slowThreshold) {
                            status = 'degraded';
                            message = `Aviso: Componente com lentidão (${duration.toFixed(0)}ms). Dica: Verifique o tamanho do arquivo.`;
                            if (finalStatus === 'operational') finalStatus = 'degraded';
                        } else {
                            status = 'operational';
                            message = `Componente operacional (${duration.toFixed(0)}ms).`;
                        }
                    }
                } else {
                    status = 'outage';
                    message = `Falha: Arquivo não encontrado (Erro ${response.status}). Dica: Verifique o nome e o caminho do arquivo.`;
                    finalStatus = 'outage';
                }
            } catch (error) {
                status = 'outage';
                message = `Falha Crítica: ${error.message}. Dica: Verifique se o arquivo está corrompido ou se há erro de rede.`;
                finalStatus = 'outage';
            }
            renderStatusItem(component.name, status, message);
        }
        
        updateOverallStatus(finalStatus);
    }

    function updateOverallStatus(status) {
        const statuses = {
            operational: { pulseColor: 'ping-green', text: 'All Systems Operational', textColor: 'text-green-400' },
            degraded: { pulseColor: 'ping-yellow', text: 'Degraded Performance', textColor: 'text-yellow-400' },
            outage: { pulseColor: 'ping-red', text: 'Major System Outage', textColor: 'text-red-400' }
        };
        const currentStatus = statuses[status];
        
        const indicatorHTML = `
            <span class="ping-pulse ${currentStatus.pulseColor} text-${currentStatus.pulseColor.replace('ping-', '')}-400"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 ${currentStatus.pulseColor}"></span>
        `;
        
        overallStatusIndicator.innerHTML = indicatorHTML;
        overallStatusText.className = currentStatus.textColor;
        overallStatusText.textContent = currentStatus.text;
    }

    runChecks();
});
