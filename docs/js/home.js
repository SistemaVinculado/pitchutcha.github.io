document.addEventListener("DOMContentLoaded", () => {
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    // --- LÓGICA DO SELETOR DE TEMA ---
    const themeToggle = document.getElementById('theme-toggle');
    const themeOptions = document.getElementById('theme-options');
    const themeButtons = document.querySelectorAll('[data-theme]');

    if (themeToggle && themeOptions) {
        themeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            themeOptions.classList.toggle('hidden');
        });

        document.addEventListener('click', () => themeOptions.classList.add('hidden'));

        themeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const theme = button.dataset.theme;
                document.documentElement.className = theme;
                localStorage.setItem('theme', theme);
            });
        });
    }

    // --- LÓGICA DOS BLOCOS DE CÓDIGO COM ABAS E BOTÃO DE COPIAR ---
    const codeBlockCard = document.querySelector(".code-block-card");
    if (codeBlockCard) {
        const tabButtons = codeBlockCard.querySelectorAll('.tab-button[data-tab]');
        const tabPanels = codeBlockCard.querySelectorAll(".code-tab-panel");
        const copyButton = codeBlockCard.querySelector('.copy-button');

        tabButtons.forEach(button => {
            button.addEventListener("click", () => {
                const tab = button.dataset.tab;
                tabButtons.forEach(btn => btn.classList.remove("active"));
                button.classList.add("active");
                tabPanels.forEach(panel => {
                    panel.classList.toggle("active", panel.dataset.tabContent === tab);
                });
            });
        });

        if (copyButton) {
            copyButton.addEventListener('click', () => {
                const activePanel = codeBlockCard.querySelector('.code-tab-panel.active');
                const code = activePanel.querySelector('code').innerText;
                navigator.clipboard.writeText(code).then(() => {
                    copyButton.classList.add('copied');
                    setTimeout(() => copyButton.classList.remove('copied'), 2000);
                });
            });
        }
    }

    // --- LÓGICA PARA ANIMAÇÃO DE SCROLL ---
    const revealOnScrollElements = document.querySelectorAll(".reveal-on-scroll");
    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    revealOnScrollElements.forEach(element => scrollObserver.observe(element));

    // --- LÓGICA PARA ATUALIZAR E ANIMAR STATUS EM TEMPO REAL ---
    const latencyEl = document.getElementById("metric-api-latency-home");
    const inferenceEl = document.getElementById("metric-inference-time-home");
    const errorEl = document.getElementById("metric-error-rate-home");

    const animateCountUp = (element, targetValue, unit) => {
        let start = 0;
        const duration = 1500; // 1.5 segundos
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = targetValue / steps;
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= targetValue) {
                start = targetValue;
                clearInterval(timer);
            }
            element.textContent = `${unit === '%' ? start.toFixed(2) : Math.floor(start)}${unit}`;
        }, stepTime);
    };

    const statusObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                fetch(`${baseUrl}uptime-data.json?cache_bust=${Date.now()}`)
                    .then(response => response.ok ? response.json() : Promise.reject("Falha ao carregar dados."))
                    .then(data => {
                        if (data.metrics) {
                            const latency = parseFloat(data.metrics.api_latency) || 0;
                            const inference = parseFloat(data.metrics.inference_time) || 0;
                            const error = parseFloat(data.metrics.error_rate) || 0;
                            
                            animateCountUp(latencyEl, latency, 'ms');
                            animateCountUp(inferenceEl, inference, 'ms');
                            animateCountUp(errorEl, error, '%');
                        }
                    })
                    .catch(error => {
                        console.error("Erro ao buscar dados de status:", error);
                        latencyEl.textContent = "Erro";
                        inferenceEl.textContent = "Erro";
                        errorEl.textContent = "Erro";
                    });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    if (latencyEl) {
        statusObserver.observe(latencyEl);
    }
});
