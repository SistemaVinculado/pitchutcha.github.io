document.addEventListener("DOMContentLoaded", () => {
    // --- LÓGICA DOS PARADIGMAS (COM TRANSIÇÃO DE IMAGEM MELHORADA) ---
    const paradigmsSection = document.getElementById("paradigms-section");
    if (paradigmsSection) {
        const tabButtons = paradigmsSection.querySelectorAll(".paradigm-tab-button");
        const tabPanels = paradigmsSection.querySelectorAll(".paradigm-tab-panel");
        const paradigmImages = paradigmsSection.querySelectorAll(".paradigm-image");

        tabButtons.forEach(button => {
            button.addEventListener("click", () => {
                const paradigm = button.dataset.paradigm;

                // Botões
                tabButtons.forEach(btn => btn.classList.remove("active"));
                button.classList.add("active");

                // Painéis de texto
                tabPanels.forEach(panel => {
                    panel.classList.toggle("active", panel.dataset.paradigmContent === paradigm);
                });

                // Imagens com transição de slide
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

    const observerOptions = {
        root: null, // viewport
        rootMargin: "0px",
        threshold: 0.15 // Revela quando 15% do elemento está visível
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target); // Para a observação após a primeira vez
            }
        });
    }, observerOptions);

    revealOnScrollElements.forEach(element => {
        observer.observe(element);
    });
});
