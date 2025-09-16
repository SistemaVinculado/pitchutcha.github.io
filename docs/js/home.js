document.addEventListener('DOMContentLoaded', () => {

    // --- Lógica das Abas da Seção HERO ---
    const heroTabs = document.querySelectorAll('.hero-tab-button');
    const heroPanels = document.querySelectorAll('.hero-tab-panel');

    heroTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            heroTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
                t.setAttribute('tabindex', '-1');
            });

            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            tab.removeAttribute('tabindex');

            const targetPanelId = tab.getAttribute('aria-controls');

            heroPanels.forEach(panel => {
                if (panel.id === targetPanelId) {
                    panel.classList.add('active');
                    panel.setAttribute('aria-hidden', 'false');
                } else {
                    panel.classList.remove('active');
                    panel.setAttribute('aria-hidden', 'true');
                }
            });
        });
    });

    // --- Lógica das Abas da Seção "PARADIGMAS ESSENCIAIS" ---
    const paradigmsContainer = document.getElementById('paradigms-section');
    if (paradigmsContainer) {
        const paradigmTabs = paradigmsContainer.querySelectorAll('.paradigm-tab-button');
        const paradigmPanels = paradigmsContainer.querySelectorAll('.paradigm-tab-panel');
        const paradigmImages = paradigmsContainer.querySelectorAll('.paradigm-image');

        paradigmTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetParadigm = tab.dataset.paradigm;

                // Atualiza os botões
                paradigmTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Atualiza os painéis de texto
                paradigmPanels.forEach(panel => {
                    panel.classList.toggle('active', panel.dataset.paradigmContent === targetParadigm);
                });

                // Atualiza as imagens com efeito de fade
                paradigmImages.forEach(image => {
                    const isTarget = image.dataset.paradigmImage === targetParadigm;
                    image.style.opacity = isTarget ? '1' : '0';
                });
            });
        });
    }


    // --- Lógica das Abas de Código da Seção "EXEMPLOS PRÁTICOS" ---
    const codeBlockCard = document.querySelector('.code-block-card');
    if (codeBlockCard) {
        const codeTabs = codeBlockCard.querySelectorAll('.tab-button');
        const codePanels = codeBlockCard.querySelectorAll('.code-tab-panel');

        codeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;

                codeTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                codePanels.forEach(panel => {
                    panel.classList.toggle('active', panel.dataset.tabContent === targetTab);
                });
            });
        });
    }

});
