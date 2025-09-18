document.addEventListener("DOMContentLoaded", () => {
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    // --- LÓGICA DOS PARADIGMAS (COM TRANSIÇÃO DE IMAGEM MELHORADA) ---
    const paradigmsSection = document.getElementById("paradigms-section");
    if (paradigmsSection) {
        const tabButtons = paradigmsSection.querySelectorAll(".paradigm-tab-button");
        const tabPanels = paradigmsSection.querySelectorAll(".paradigm-tab-panel");
        const paradigmImages = paradigmsSection.querySelectorAll(".paradigm-image");

        tabButtons.forEach(button => {
            button.addEventListener("click", () => {
                const paradigm = button.dataset.paradigm;

                tabButtons.forEach(btn => btn.classList.remove("active"));
                button.classList.add("active");

                tabPanels.forEach(panel => {
                    panel.classList.toggle("active", panel.dataset.paradigmContent === paradigm);
                });

                paradigmImages.forEach(image => {
                    image.classList.toggle("active", image.dataset.paradigmImage === paradigm);
                });
            });
        });
    }

    // --- LÓGICA DOS BLOCOS DE CÓDIGO COM ABAS ---
    const codeBlockCard = document.querySelector(".code-block-card");
    if (codeBlockCard) {
        const tabButtons = codeBlockCard.querySelectorAll('.tab-button[data-tab]');
        const tabPanels = codeBlockCard.querySelectorAll(".code-tab-panel[data-tab-content]");

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
    }

    // --- NOVA LÓGICA PARA ANIMAÇÃO DE SCROLL ---
    const revealOnScrollElements = document.querySelectorAll(".reveal-on-scroll");
    const observerOptions = { root: null, rootMargin: "0px", threshold: 0.1 };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    revealOnScrollElements.forEach(element => observer.observe(element));

    // --- NOVA LÓGICA PARA ATUALIZAR STATUS EM TEMPO REAL NA HOME ---
    function updateLiveStatus() {
        const latencyEl = document.getElementById("metric-api-latency-home");
        const inferenceEl = document.getElementById("metric-inference-time-home");
        const errorEl = document.getElementById("metric-error-rate-home");

        if (!latencyEl || !inferenceEl || !errorEl) return;

        fetch(`${baseUrl}uptime-data.json?cache_bust=${Date.now()}`)
            .then(response => {
                if (!response.ok) throw new Error("Falha ao carregar dados de uptime.");
                return response.json();
            })
            .then(data => {
                if (data.metrics) {
                    latencyEl.textContent = data.metrics.api_latency || "--ms";
                    inferenceEl.textContent = data.metrics.inference_time || "--ms";
                    errorEl.textContent = data.metrics.error_rate || "--%";
                }
            })
            .catch(error => {
                console.error("Erro ao buscar dados de status para a home:", error);
                latencyEl.textContent = "Erro";
                inferenceEl.textContent = "Erro";
                errorEl.textContent = "Erro";
            });
    }

    updateLiveStatus();
});
