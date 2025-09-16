document.addEventListener("DOMContentLoaded", () => {
    /**
     * Lógica aprimorada para agrupar blocos de código consecutivos em abas.
     * Esta versão usa uma abordagem de duas etapas para evitar erros de manipulação do DOM.
     * 1. Identifica os grupos de blocos de código.
     * 2. Constrói a interface de abas para cada grupo.
     */
    const identifyCodeBlockGroups = () => {
        const codeBlocks = Array.from(document.querySelectorAll("article > .highlight, article > .highlighter-rouge"));
        if (codeBlocks.length === 0) {
            return [];
        }

        const groups = [];
        let currentGroup = [codeBlocks[0]];

        for (let i = 1; i < codeBlocks.length; i++) {
            const currentBlock = codeBlocks[i];
            const previousBlock = codeBlocks[i - 1];

            // Verifica se o bloco atual vem imediatamente após o anterior no DOM
            if (currentBlock.previousElementSibling === previousBlock) {
                currentGroup.push(currentBlock);
            } else {
                groups.push(currentGroup);
                currentGroup = [currentBlock];
            }
        }
        groups.push(currentGroup); // Adiciona o último grupo

        // Retorna apenas os grupos que precisam de abas (mais de um bloco)
        return groups.filter(group => group.length > 1);
    };

    const createTabbedInterface = (group) => {
        const wrapper = document.createElement("div");
        wrapper.className = "code-tabs-wrapper";

        const nav = document.createElement("nav");
        nav.className = "code-tabs-nav";

        const content = document.createElement("div");
        content.className = "code-tabs-content";

        // Insere o wrapper antes do primeiro bloco do grupo
        const firstBlock = group[0];
        firstBlock.parentNode.insertBefore(wrapper, firstBlock);

        group.forEach((block, index) => {
            // Cria o botão da aba
            const button = document.createElement("button");
            button.className = "code-tab-button";
            
            const codeElement = block.querySelector("code[class*='language-']");
            let lang = "Código"; // Fallback
            if (codeElement) {
                // Extrai o nome da linguagem da classe, ex: "language-python"
                const langClass = Array.from(codeElement.classList).find(cls => cls.startsWith('language-'));
                if (langClass) {
                    lang = langClass.replace('language-', '');
                    lang = lang.charAt(0).toUpperCase() + lang.slice(1);
                }
            }
            button.textContent = lang;
            button.setAttribute("data-tab-index", index);

            if (index === 0) {
                button.classList.add("active");
                block.style.display = "block";
            } else {
                block.style.display = "none";
            }

            nav.appendChild(button);
            content.appendChild(block); // Move o bloco de código para o contêiner de conteúdo
        });

        // Monta a estrutura final
        wrapper.appendChild(nav);
        wrapper.appendChild(content);

        // Adiciona o event listener para a navegação das abas
        nav.addEventListener("click", (event) => {
            if (event.target.tagName === "BUTTON") {
                const tabIndex = event.target.dataset.tabIndex;

                nav.querySelectorAll(".code-tab-button").forEach(btn => btn.classList.remove("active"));
                event.target.classList.add("active");

                Array.from(content.children).forEach((block, index) => {
                    block.style.display = index == tabIndex ? "block" : "none";
                });
            }
        });
    };

    // Executa a lógica
    const codeBlockGroups = identifyCodeBlockGroups();
    codeBlockGroups.forEach(createTabbedInterface);
});
