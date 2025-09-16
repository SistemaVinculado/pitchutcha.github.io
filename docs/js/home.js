document.addEventListener('DOMContentLoaded', () => {
    // Lógica para o Hero Section com Abas (específica do index.html)
    const tabs = document.querySelectorAll('[role="tab"]');
    if (tabs.length > 0) {
        function activateTab(tab) {
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
                t.setAttribute('tabindex', '-1');
                const panel = document.getElementById(t.getAttribute('aria-controls'));
                if (panel) {
                    panel.classList.remove('active');
                    panel.setAttribute('aria-hidden', 'true');
                }
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            tab.setAttribute('tabindex', '0');
            const activePanel = document.getElementById(tab.getAttribute('aria-controls'));
            if (activePanel) {
                activePanel.classList.add('active');
                activePanel.setAttribute('aria-hidden', 'false');
            }
        }
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                activateTab(e.currentTarget);
            });
        });
    }

    // Lógica para o Acordeão Interativo (específica do index.html)
    const accordionItems = document.querySelectorAll('.accordion-item');
    const accordionImage = document.getElementById('accordion-image-display');
    if (accordionItems.length > 0 && accordionImage) {
        accordionItems.forEach(item => {
            item.addEventListener('toggle', () => {
                if (item.open) {
                    accordionItems.forEach(otherItem => {
                        if (otherItem !== item) { otherItem.removeAttribute('open'); }
                    });
                    const newImageSrc = item.getAttribute('data-image');
                    if (newImageSrc) {
                        accordionImage.style.opacity = 0;
                        setTimeout(() => {
                            accordionImage.src = newImageSrc;
                            accordionImage.style.opacity = 1;
                        }, 300);
                    }
                }
            });
        });
    }
});
