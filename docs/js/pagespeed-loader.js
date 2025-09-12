document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("pagespeed-report-container");
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';
    let lighthouseData = null; // Armazena os dados do JSON

    if (!container) {
        return;
    }

    // Função para definir a cor da pontuação
    const getScoreColor = (score) => {
        if (score >= 90) return 'text-green-500';
        if (score >= 50) return 'text-orange-400';
        return 'text-red-500';
    };

    // Função principal que desenha o relatório na tela
    const renderReport = (view) => { // 'view' pode ser 'mobile' ou 'desktop'
        if (!lighthouseData || !lighthouseData[view]) {
            container.innerHTML = `<p class="text-red-500">Dados do relatório para '${view}' não foram encontrados.</p>`;
            return;
        }

        const data = lighthouseData[view];
        const title = view === 'mobile' ? 'Relatório de Simulação (Celular)' : 'Relatório de Simulação (Computador)';
        const oppositeView = view === 'mobile' ? 'Computador' : 'Celular';

        const opportunitiesHTML = data.opportunities && data.opportunities.length > 0
            ? data.opportunities.map(op => `
                <li class="flex items-start gap-3">
                    <span class="material-symbols-outlined text-sky-400 text-base mt-1">arrow_circle_right</span>
                    <div>
                        <p class="text-[var(--text-primary)]">${op.title}</p>
                        <p class="text-xs text-[var(--text-secondary)]">Economia potencial: ${op.savings}</p>
                    </div>
                </li>
            `).join('')
            : '<li><p class="text-[var(--text-secondary)]">Ótimo trabalho! Nenhuma oportunidade de melhoria de alto impacto encontrada.</p></li>';

        const reportHTML = `
            <div class="p-6 bg-[var(--background-secondary)] border border-[var(--secondary-color)] rounded-lg">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                    <div>
                        <p class="text-3xl font-bold ${getScoreColor(data.scores.performance)}">${data.scores.performance}</p>
                        <p class="text-sm text-[var(--text-secondary)]">Desempenho</p>
                    </div>
                    <div>
                        <p class="text-3xl font-bold ${getScoreColor(data.scores.accessibility)}">${data.scores.accessibility}</p>
                        <p class="text-sm text-[var(--text-secondary)]">Acessibilidade</p>
                    </div>
                    <div>
                        <p class="text-3xl font-bold ${getScoreColor(data.scores.bestPractices)}">${data.scores.bestPractices}</p>
                        <p class="text-sm text-[var(--text-secondary)]">Práticas Rec.</p>
                    </div>
                    <div>
                        <p class="text-3xl font-bold ${getScoreColor(data.scores.seo)}">${data.scores.seo}</p>
                        <p class="text-sm text-[var(--text-secondary)]">SEO</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <h4 class="font-semibold text-[var(--text-primary)] mb-2 border-b border-[var(--secondary-color)] pb-2">Métricas Principais</h4>
                        <ul class="text-sm space-y-2 pt-2">
                            <li class="flex justify-between"><span>First Contentful Paint:</span> <strong>${data.metrics.fcp}</strong></li>
                            <li class="flex justify-between"><span>Largest Contentful Paint:</span> <strong>${data.metrics.lcp}</strong></li>
                            <li class="flex justify-between"><span>Total Blocking Time:</span> <strong>${data.metrics.tbt}</strong></li>
                            <li class="flex justify-between"><span>Cumulative Layout Shift:</span> <strong>${data.metrics.cls}</strong></li>
                            <li class="flex justify-between"><span>Speed Index:</span> <strong>${data.metrics.si}</strong></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold text-[var(--text-primary)] mb-2 border-b border-[var(--secondary-color)] pb-2">Principais Sugestões de Melhoria</h4>
                        <ul class="text-sm space-y-3 pt-2">
                            ${opportunitiesHTML}
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold tracking-tight text-[var(--text-primary)]">${title}</h2>
                <button id="device-toggle-btn" class="text-sm font-medium text-[var(--primary-color)] hover:opacity-80 transition-opacity flex items-center gap-2">
                    <span>Ver relatório para ${oppositeView}</span>
                    <span class="material-symbols-outlined">swap_horiz</span>
                </button>
            </div>
            ${reportHTML}
        `;

        document.getElementById('device-toggle-btn').addEventListener('click', () => {
            renderReport(oppositeView.toLowerCase());
        });
    };

    fetch(`${baseUrl}pagespeed-data.json?cache_bust=` + Date.now())
        .then(response => {
            if (!response.ok) {
                throw new Error("Arquivo pagespeed-data.json não encontrado.");
            }
            return response.json();
        })
        .then(data => {
            lighthouseData = data;
            renderReport('mobile'); // Inicia com a visão de celular por padrão
        })
        .catch(error => {
            console.error("Erro ao carregar dados do PageSpeed:", error);
            container.innerHTML = `
                <h2 class="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-4">Relatório PageSpeed Insights</h2>
                <div class="p-6 bg-[var(--background-secondary)] border border-[var(--secondary-color)] rounded-lg">
                    <p class="text-red-500">Não foi possível carregar os resultados.</p>
                    <p class="text-[var(--text-secondary)] mt-2">Por favor, rode a automação "Auditoria Lighthouse" na aba Actions do seu repositório no GitHub para gerar o relatório.</p>
                </div>
            `;
        });
});
