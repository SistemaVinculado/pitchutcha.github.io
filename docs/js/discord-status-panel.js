document.addEventListener("DOMContentLoaded", () => {
    const panelContainer = document.getElementById("discord-status-panel-container");
    const overallStatusIndicator = document.getElementById("overall-status-indicator");
    const overallStatusText = document.getElementById("overall-status-text");

    if (!panelContainer || !overallStatusIndicator || !overallStatusText) {
        console.error("Elementos essenciais do painel de status não foram encontrados.");
        return;
    }

    const statuses = {
        operational: { text: "Operacional", colorClass: "status-green", icon: "fa-check" },
        degraded: { text: "Performance Degradada", colorClass: "status-yellow", icon: "fa-minus-square" },
        partial_outage: { text: "Falha Parcial", colorClass: "status-orange", icon: "fa-exclamation-triangle" },
        major_outage: { text: "Falha Crítica", colorClass: "status-red", icon: "fa-times" },
    };

    const components = [
        { id: 'api', name: 'API Principal', description: 'Responsável pelo envio e recebimento de dados e operações gerais.', showUptime: true, children: [] },
        { id: 'database', name: 'Banco de Dados', description: 'Armazenamento e consulta de dados.', showUptime: true, children: [] },
        { id: 'realtime-updates', name: 'Atualizações em Tempo Real', description: 'Serviço de WebSocket para atualizações ao vivo.', showUptime: true, children: [] },
        { id: 'file-storage', name: 'Armazenamento de Arquivos', description: 'Upload e download de arquivos e mídias.', showUptime: true, children: [] },
        { id: 'auth', name: 'Serviços de Autenticação', isGroup: true, children: [
            { id: 'auth-login', name: 'Login e Cadastro', description: 'Sistemas de entrada e registro de usuários.' },
            { id: 'auth-sessions', name: 'Gerenciamento de Sessões', description: 'Controle de sessões de usuários ativos.' },
        ]},
        { id: 'client-apps', name: 'Aplicações Cliente', isGroup: true, children: [
            { id: 'client-web', name: 'Aplicação Web', description: 'Interface principal no navegador.' },
            { id: 'client-docs', name: 'Página de Documentação', description: 'Serviço que entrega a documentação.' },
        ]}
    ];

    function getRandomStatus(isCritical = false) {
        const rand = Math.random();
        if (isCritical && rand > 0.98) return 'major_outage';
        if (rand > 0.94) return 'partial_outage';
        if (rand > 0.88) return 'degraded';
        return 'operational';
    }

    function generateUptimeSVG() {
        let svg = `<svg class="availability-time-line-graphic" preserveAspectRatio="none" viewBox="0 0 448 34">`;
        const colors = {
            operational: '#3BA55C',
            degraded: '#CB8615',
            partial_outage: '#F26522',
            major_outage: '#ED4245'
        };
        for (let i = 0; i < 90; i++) {
            const rand = Math.random();
            let color = colors.operational;
            if (rand > 0.98) color = colors.major_outage;
            else if (rand > 0.95) color = colors.partial_outage;
            else if (rand > 0.92) color = colors.degraded;
            svg += `<rect height="34" width="3" x="${i * 5}" y="0" fill="${color}"></rect>`;
        }
        svg += `</svg>`;
        return svg;
    }

    function render() {
        let overallSystemStatus = 'operational';
        
        const mainPanelHTML = components.map(component => {
            if (component.isGroup) {
                let groupStatusKey = 'operational';
                const childrenHTML = component.children.map(child => {
                    child.status = getRandomStatus();
                    
                    if (child.status === 'major_outage') groupStatusKey = 'major_outage';
                    else if (child.status === 'partial_outage' && groupStatusKey !== 'major_outage') groupStatusKey = 'partial_outage';
                    else if (child.status === 'degraded' && groupStatusKey === 'operational') groupStatusKey = 'degraded';
                    
                    const statusInfo = statuses[child.status];
                    return `
                        <div class="component-inner-container ${statusInfo.colorClass}">
                            <span class="name">${child.name}<span class="tooltip-base">?<span class="tooltip-text">${child.description}</span></span></span>
                            <span class="component-status">${statusInfo.text}</span>
                            <span class="tool icon-indicator fa ${statusInfo.icon} ${statusInfo.colorClass}"></span>
                        </div>
                    `;
                }).join('');
                
                if (groupStatusKey === 'major_outage' || groupStatusKey === 'partial_outage') overallSystemStatus = 'outage';
                else if (groupStatusKey === 'degraded' && overallSystemStatus === 'operational') overallSystemStatus = 'degraded';
                
                const groupStatusInfo = statuses[groupStatusKey];

                return `
                    <div class="component-container border-color is-group">
                        <div class="component-inner-container ${groupStatusInfo.colorClass}" data-js-hook="component-group-opener">
                            <span class="name"><span class="fa group-parent-indicator fa-plus-square-o" role="button"></span> ${component.name}</span>
                            <span class="component-status">${groupStatusInfo.text}</span>
                            <span class="tool icon-indicator fa ${groupStatusInfo.icon} ${groupStatusInfo.colorClass}"></span>
                        </div>
                        <div class="child-components-container">${childrenHTML}</div>
                    </div>
                `;
            } else {
                component.status = getRandomStatus(true);
                if (component.status === 'major_outage' || component.status === 'partial_outage') overallSystemStatus = 'outage';
                else if (component.status === 'degraded' && overallSystemStatus === 'operational') overallSystemStatus = 'degraded';

                const statusInfo = statuses[component.status];
                return `
                    <div class="component-container border-color">
                        <div class="component-inner-container ${statusInfo.colorClass} showcased">
                            <span class="name">${component.name}<span class="tooltip-base">?<span class="tooltip-text">${component.description}</span></span></span>
                            <span class="component-status">${statusInfo.text}</span>
                            <span class="tool icon-indicator fa ${statusInfo.icon} ${statusInfo.colorClass}"></span>
                            <div class="shared-partial uptime-90-days-wrapper">
                                ${generateUptimeSVG()}
                                <div class="legend">
                                    <div class="legend-item light">90 dias atrás</div><div class="spacer"></div>
                                    <div class="legend-item">100% uptime</div><div class="spacer"></div>
                                    <div class="legend-item light">Hoje</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');
        
        const legendHTML = `
            <div class="component-statuses-legend">
                <div class="legend-item"><span class="icon-indicator status-green fa fa-check"></span> Operacional</div>
                <div class="legend-item"><span class="icon-indicator status-yellow fa fa-minus-square"></span> Performance Degradada</div>
                <div class="legend-item"><span class="icon-indicator status-orange fa fa-exclamation-triangle"></span> Falha Parcial</div>
                <div class="legend-item"><span class="icon-indicator status-red fa fa-times"></span> Falha Crítica</div>
            </div>
        `;

        panelContainer.innerHTML = `<div class="components-container">${mainPanelHTML}</div>${legendHTML}`;

        const overallStatusMap = {
            operational: { pulse: "ping-green", dot: "bg-green-500", text: "Todos os sistemas operacionais" },
            degraded: { pulse: "ping-yellow", dot: "bg-yellow-500", text: "Performance degradada" },
            outage: { pulse: "ping-red", dot: "bg-red-500", text: "Falha crítica no sistema" }
        };
        const currentOverallStatus = overallStatusMap[overallSystemStatus];
        overallStatusIndicator.innerHTML = `<span class="ping-pulse ${currentOverallStatus.pulse}"></span><span class="relative inline-flex rounded-full h-3 w-3 ${currentOverallStatus.dot}"></span>`;
        overallStatusText.textContent = currentOverallStatus.text;
        overallStatusText.style.fontFamily = "'proxima-nova', sans-serif";

        const groupOpeners = document.querySelectorAll('[data-js-hook="component-group-opener"]');
        groupOpeners.forEach(opener => {
            opener.addEventListener('click', () => {
                const parentContainer = opener.closest('.component-container');
                parentContainer.classList.toggle('open');
                const indicator = opener.querySelector('.group-parent-indicator');
                indicator.classList.toggle('fa-plus-square-o');
                indicator.classList.toggle('fa-minus-square-o');
            });
        });
    }

    render();
});
