document.addEventListener('DOMContentLoaded', () => {
    const performanceContainer = document.getElementById('performance-monitor-container');

    if (!performanceContainer) {
        return;
    }

    const pagesToTest = [
        { name: 'Página Principal', url: 'index.html' },
        { name: 'Página de Algoritmos', url: 'algorithms.html' },
        { name: 'Página de Estruturas de Dados', url: 'data-structures.html' }
    ];

    // Limites para Core Web Vitals (Verde, Amarelo, Vermelho)
    const LCP_THRESHOLDS = { good: 2500, needsImprovement: 4000 };
    const CLS_THRESHOLDS = { good: 0.1, needsImprovement: 0.25 };

    function getMetricRating(value, thresholds) {
        if (value <= thresholds.good) return { rating: 'Good', color: 'text-green-400' };
        if (value <= thresholds.needsImprovement) return { rating: 'Needs Improvement', color: 'text-yellow-400' };
        return { rating: 'Poor', color: 'text-red-400' };
    }

    function renderResult(name, lcp, cls) {
        const lcpResult = getMetricRating(lcp.value, LCP_THRESHOLDS);
        const clsResult = getMetricRating(cls.value, CLS_THRESHOLDS);

        const resultHTML = `
            <div class="flex flex-col gap-4 rounded-lg p-6 bg-[#161b22] border border-[#30363d]">
                <h3 class="text-lg font-semibold text-white">${name}</h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <p class="text-gray-300">Largest Contentful Paint (LCP)</p>
                        <p class="font-bold ${lcpResult.color}">${(lcp.value / 1000).toFixed(2)}s</p>
                    </div>
                    <div class="flex justify-between items-center">
                        <p class="text-gray-300">Cumulative Layout Shift (CLS)</p>
                        <p class="font-bold ${clsResult.color}">${cls.value.toFixed(3)}</p>
                    </div>
                </div>
                <p class="text-xs text-gray-500 mt-2">LCP measures loading performance. CLS measures visual stability.</p>
            </div>
        `;
        performanceContainer.insertAdjacentHTML('beforeend', resultHTML);
    }

    function measurePagePerformance(page) {
        return new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.src = page.url;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            iframe.onload = () => {
                const iframeWindow = iframe.contentWindow;
                let lcpValue = { value: 0 };
                let clsValue = { value: 0 };

                // Usando PerformanceObserver para capturar as métricas
                try {
                    const observer = new iframeWindow.PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        entries.forEach(entry => {
                            if (entry.entryType === 'largest-contentful-paint') {
                                lcpValue = entry;
                            }
                            if (entry.entryType === 'layout-shift') {
                                clsValue.value += entry.value;
                            }
                        });
                    });
                    observer.observe({ type: ['largest-contentful-paint', 'layout-shift'], buffered: true });
                } catch (e) {
                    console.error('PerformanceObserver not supported or failed.', e);
                }

                // Espera um pouco para as métricas serem coletadas e depois resolve
                setTimeout(() => {
                    renderResult(page.name, lcpValue, clsValue);
                    document.body.removeChild(iframe);
                    resolve();
                }, 1000); // 3 segundos de espera
            };
        });
    }

    async function runAllPerformanceChecks() {
        for (const page of pagesToTest) {
            await measurePagePerformance(page);
        }
    }

    runAllPerformanceChecks();
});
