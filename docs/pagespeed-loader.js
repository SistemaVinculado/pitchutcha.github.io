document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("pagespeed-report-container");
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    if (!container) {
        return;
    }

    // Função para definir a cor da pontuação
    const getScoreColor = (score) => {
        if (score >= 90) return 'text-green-500';
        if (score >= 50) return 'text-orange-400';
        return 'text-red-500';
    };

    // Função para criar o HTML do relatório
    const createReportHTML = (title, data) => {
        if (!data || !data.scores) {
            return `<div class="p-6 bg-[var(--background-secondary)] border border-[var(--secondary-color)] rounded-lg"><h3 class="text-lg font-semibold">${title}</h3><p>Relatório não disponível ou em processamento.</p></div>`;
        }

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

        return `
            <div class="p-6 bg-[var(--background-secondary)] border border-[var(--secondary-color)] rounded-lg">
                <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">${title}</h3>
                
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
    };

    fetch(`${baseUrl}pagespeed-data.json?cache_bust=` + Date.now())
        .then(response => {
            if (!response.ok) {
                throw new Error("Arquivo pagespeed-data.json não encontrado.");
            }
            return response.json();
        })
        .then(data => {
            const reportHTML = createReportHTML("Relatório de Simulação (Celular)", data);
            container.innerHTML = `
                <h2 class="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-4">Relatório PageSpeed Insights</h2>
                ${reportHTML}
            `;
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
