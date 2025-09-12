document.addEventListener("DOMContentLoaded",()=>{
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';
    const container = document.getElementById("performance-monitor-container");

    if (container) {
        const pagesToTest = [
            { name: "Página Principal", url: "index.html" },
            { name: "Página de Algoritmos", url: "algoritmos.html" },
            { name: "Página de Estruturas de Dados", url: "estruturas-de-dados.html" }
        ];
        const thresholds = {
            good: 200,
            needsImprovement: 500
        };

        container.innerHTML = ""; // Limpa o container

        pagesToTest.forEach(async (page) => {
            let duration, classification, durationText;
            const startTime = performance.now();

            try {
                const response = await fetch(baseUrl + page.url, { method: "HEAD", cache: "no-store" });
                duration = (performance.now() - startTime).toFixed(0);
                if (!response.ok) throw new Error(`Status ${response.status}`);
            } catch (err) {
                duration = -1;
            }

            if (duration < 0) {
                classification = { rating: "Erro", color: "text-red-500" };
                durationText = "Falha no teste";
            } else if (duration <= thresholds.good) {
                classification = { rating: "Rápido", color: "text-green-500" };
                durationText = `${duration}ms`;
            } else if (duration <= thresholds.needsImprovement) {
                classification = { rating: "Moderado", color: "text-yellow-500" };
                durationText = `${duration}ms`;
            } else {
                classification = { rating: "Lento", color: "text-red-500" };
                durationText = `${duration}ms`;
            }

            const pageHTML = `
            <div class="flex flex-col gap-4 rounded-lg p-6 bg-[var(--background-secondary)] border border-[var(--secondary-color)]">
                <h3 class="text-lg font-semibold text-[var(--text-primary)]">${page.name}</h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <p class="text-[var(--text-secondary)]">Tempo de Resposta do Servidor</p>
                        <p class="font-bold ${classification.color}">${durationText}</p>
                    </div>
                    <div class="flex justify-between items-center">
                        <p class="text-[var(--text-secondary)]">Classificação</p>
                        <p class="font-bold ${classification.color}">${classification.rating}</p>
                    </div>
                </div>
            </div>
        `;
            container.insertAdjacentHTML("beforeend", pageHTML);
        });
    }
});
