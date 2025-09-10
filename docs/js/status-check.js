document.addEventListener('DOMContentLoaded', () => {
    // Elementos da página que vamos atualizar
    const overallStatusIndicator = document.getElementById('overall-status-indicator');
    const overallStatusText = document.getElementById('overall-status-text');
    const detailedStatusContainer = document.getElementById('detailed-status-container');

    // Se os elementos não existirem na página, não faz nada.
    if (!overallStatusIndicator || !detailedStatusContainer) {
        return;
    }

    // Lista de componentes essenciais do site para verificar
    const componentsToCheck = [
        { name: 'Página Principal', url: 'index.html', type: 'Página' },
        { name: 'Página de Algoritmos', url: 'algorithms.html', type: 'Página' },
        { name: 'Página de Estrutura de Dados', url: 'data-structures.html', type: 'Página' },
        { name: 'Página de Busca', url: 'search.html', type: 'Página' },
        { name: 'CSS Principal', url: 'css/style.css', type: 'Recurso' },
        { name: 'JS Principal', url: 'js/script.js', type: 'Recurso' },
        { name: 'Banco de Dados da Busca', url: 'search.json', type: 'Recurso' }
    ];

    // Limite de tempo para considerar uma resposta "lenta" (em milissegundos)
    const slowThreshold = 500; // Meio segundo

    // Função para renderizar um item na lista de status detalhado
    function renderStatusItem(name, type, status, message) {
        const colors = {
            operational: 'bg-green-500',
            degraded: 'bg-yellow-500',
            outage: 'bg-red-500'
        };
        const colorClass = colors[status] || 'bg-gray-500';

        const itemHTML = `
            <div class="flex items-center justify-between p-4 border-b border-[#30363d]">
                <div>
                    <p class="text-white font-semibold">${name}</p>
                    <p class="text-sm text-gray-400">${message}</p>
                </div>
                <div class="flex items-center gap-2 text-sm">
                    <span class="w-3 h-3 ${colorClass} rounded-full"></span>
                    <span class="capitalize">${status}</span>
                </div>
            </div>
        `;
        detailedStatusContainer.insertAdjacentHTML('beforeend', itemHTML);
    }

    // Função principal que executa todos os testes
    async function runChecks() {
        let finalStatus = 'operational'; // Começa como otimista

        for (const component of componentsToCheck) {
            const startTime = performance.now();
            let status = 'outage';
            let message = '';

            try {
                const response = await fetch(component.url, { method: 'HEAD', cache: 'no-store' });
                const duration = performance.now() - startTime;

                if (response.ok) {
                    if (duration > slowThreshold) {
                        status = 'degraded'; // Amarelo
                        message = `Componente funcional, mas com lentidão (${duration.toFixed(0)}ms).`;
                        if (finalStatus === 'operational') {
                            finalStatus = 'degraded';
                        }
                    } else {
                        status = 'operational'; // Verde
                        message = `Componente operacional (${duration.toFixed(0)}ms).`;
                    }
                } else {
                    status = 'outage'; // Vermelho
                    message = `Falha ao carregar (Status: ${response.status}).`;
                    finalStatus = 'outage';
                }
            } catch (error) {
                status = 'outage'; // Vermelho
                message = 'Erro de rede. Não foi possível acessar o componente.';
                finalStatus = 'outage';
            }
            renderStatusItem(component.name, component.type, status, message);
        }
        
        updateOverallStatus(finalStatus);
    }

    // Função para atualizar o status geral no topo da página
    function updateOverallStatus(status) {
        overallStatusIndicator.className = 'relative flex h-3 w-3'; // Limpa classes antigas
        let indicatorHTML = '';
        let textClass = '';
        let textContent = '';

        if (status === 'operational') {
            indicatorHTML = `
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            `;
            textClass = 'text-green-400';
            textContent = 'All Systems Operational';
        } else if (status === 'degraded') {
            indicatorHTML = `
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            `;
            textClass = 'text-yellow-400';
            textContent = 'Degraded Performance';
        } else { // outage
            indicatorHTML = `
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            `;
            textClass = 'text-red-400';
            textContent = 'Major System Outage';
        }
        
        overallStatusIndicator.innerHTML = indicatorHTML;
        overallStatusText.className = textClass;
        overallStatusText.textContent = textContent;
    }

    // Inicia os testes
    runChecks();
});
