document.addEventListener("DOMContentLoaded", () => {
    let tooltipElement = null;

    const createTooltip = () => {
        if (!tooltipElement) {
            tooltipElement = document.createElement("div");
            tooltipElement.className = "dev-tooltip";
            document.body.appendChild(tooltipElement);
        }
    };

    const showTooltip = (event) => {
        const target = event.currentTarget;
        const tooltipText = target.getAttribute("data-tooltip-text");

        if (!tooltipText) return;

        tooltipElement.textContent = tooltipText;
        tooltipElement.style.display = "block";

        // Posiciona o tooltip acima do elemento
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltipElement.getBoundingClientRect();
        
        let top = targetRect.top - tooltipRect.height - 8; // 8px de espaço
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        // Ajusta para não sair da tela
        if (top < 0) {
            top = targetRect.bottom + 8;
        }
        if (left < 0) {
            left = 5;
        }
        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 5;
        }

        tooltipElement.style.top = `${top + window.scrollY}px`;
        tooltipElement.style.left = `${left + window.scrollX}px`;
    };

    const hideTooltip = () => {
        if (tooltipElement) {
            tooltipElement.style.display = "none";
        }
    };

    const setupTooltips = () => {
        createTooltip();
        const elementsWithTooltip = document.querySelectorAll("[data-tooltip-text]");
        
        elementsWithTooltip.forEach(element => {
            element.addEventListener("mouseenter", showTooltip);
            element.addEventListener("mouseleave", hideTooltip);
            element.addEventListener("click", hideTooltip);
        });
    };

    // Roda a configuração inicial e também depois de qualquer busca
    setupTooltips();

    // Re-aplica para novos elementos que aparecem na página (como em resultados de busca)
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                setupTooltips();
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
