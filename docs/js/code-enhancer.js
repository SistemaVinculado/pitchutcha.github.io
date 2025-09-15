document.addEventListener("DOMContentLoaded", () => {
    // --- Ícones SVG para o botão de copiar ---
    const copyIconSVG = `
        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
            <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
            <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
        </svg>`;
    
    const checkIconSVG = `
        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor" class="text-green-500">
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
        </svg>`;

    // --- Função para a Notificação "Toast" ---
    function showToast(message) {
        const toast = document.getElementById('toast-notification');
        if (toast) {
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000); // A notificação some após 3 segundos
        }
    }
    
    // --- Função para Acessibilidade (Leitor de Tela) ---
    function announceToScreenReader(message) {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            // Limpa após um tempo para permitir que a mesma mensagem seja anunciada novamente
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    // --- Lógica Principal ---
    document.querySelectorAll("figure.highlight, div.highlighter-rouge").forEach(codeBlock => {
        const codeElement = codeBlock.querySelector("pre > code");
        if (!codeElement) return;

        // --- 1. Exibir o Nome da Linguagem ---
        const langMatch = codeElement.className.match(/language-(\w+)/);
        if (langMatch && langMatch[1]) {
            const lang = langMatch[1];
            const langTag = document.createElement('span');
            langTag.className = 'code-language-tag';
            langTag.textContent = lang;
            codeBlock.appendChild(langTag);
        }

        // --- Botão de Copiar ---
        const button = document.createElement("button");
        button.className = "absolute top-2 right-2 p-2 text-gray-400 bg-gray-800 rounded-md hover:bg-gray-700 hover:text-white transition-colors";
        button.innerHTML = copyIconSVG;
        button.setAttribute("aria-label", "Copiar código");
        button.setAttribute("data-tooltip-text", "Copiar código");

        button.addEventListener("click", () => {
            // --- 2. Lógica para ignorar números de linha ---
            // Tenta encontrar o contêiner de código específico que exclui números de linha (comum no Jekyll/Rouge)
            let elementToCopy = codeBlock.querySelector('.rouge-code pre, .rouge-code code');
            // Se não encontrar, usa o seletor padrão
            if (!elementToCopy) {
                elementToCopy = codeElement;
            }
            const code = elementToCopy.innerText;

            navigator.clipboard.writeText(code).then(() => {
                // Feedback visual e de acessibilidade
                button.innerHTML = checkIconSVG;
                button.setAttribute("data-tooltip-text", "Copiado!");
                button.dispatchEvent(new Event('mouseenter'));

                // --- 3. Ativa Notificação "Toast" e Anúncio para Leitor de Tela ---
                showToast("Copiado para a área de transferência!");
                announceToScreenReader("Código copiado com sucesso.");

                setTimeout(() => {
                    button.innerHTML = copyIconSVG;
                    button.setAttribute("data-tooltip-text", "Copiar código");
                }, 2000);
            }).catch(err => {
                button.setAttribute("data-tooltip-text", "Erro ao copiar!");
                button.dispatchEvent(new Event('mouseenter'));
                console.error("Falha ao copiar código: ", err);
            });
        });

        codeBlock.appendChild(button);
    });
});
