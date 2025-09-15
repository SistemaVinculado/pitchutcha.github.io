import { getPyodideInstance } from './playground/pyodide-manager.js';

document.addEventListener("DOMContentLoaded", () => {
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    // --- Ícones SVG ---
    const copyIconSVG = `
        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor">
            <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
            <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
        </svg>`;
    
    const checkIconSVG = `
        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor" class="text-green-500">
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
        </svg>`;

    const editIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16" fill="currentColor">
            <path d="M0 0h24v24H0V0z" fill="none"/><path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"/>
        </svg>`;

    // --- Lógica Principal ---
    document.querySelectorAll("figure.highlight, div.highlighter-rouge").forEach(codeBlock => {
        // --- Botão de Copiar (existente) ---
        const copyButton = document.createElement("button");
        copyButton.className = "absolute top-2 right-2 p-2 text-gray-400 bg-gray-800 rounded-md hover:bg-gray-700 hover:text-white transition-colors";
        copyButton.innerHTML = copyIconSVG;
        copyButton.setAttribute("aria-label", "Copiar código");
        copyButton.setAttribute("data-tooltip-text", "Copiar código");

        copyButton.addEventListener("click", () => {
            const code = codeBlock.querySelector("pre > code").innerText;
            navigator.clipboard.writeText(code).then(() => {
                copyButton.innerHTML = checkIconSVG;
                copyButton.setAttribute("data-tooltip-text", "Copiado!");
                copyButton.dispatchEvent(new Event('mouseenter'));
                
                setTimeout(() => {
                    copyButton.innerHTML = copyIconSVG;
                    copyButton.setAttribute("data-tooltip-text", "Copiar código");
                }, 2000);
            }).catch(err => {
                copyButton.setAttribute("data-tooltip-text", "Erro ao copiar!");
                 copyButton.dispatchEvent(new Event('mouseenter'));
                console.error("Falha ao copiar código: ", err);
            });
        });
        codeBlock.appendChild(copyButton);

        // --- Botão de Editar (existente) ---
        const editButton = document.createElement("button");
        editButton.className = "absolute top-2 right-12 p-2 text-gray-400 bg-gray-800 rounded-md hover:bg-gray-700 hover:text-white transition-colors";
        editButton.innerHTML = editIconSVG;
        editButton.setAttribute("aria-label", "Editar código no Playground");
        editButton.setAttribute("data-tooltip-text", "Editar no Playground");

        editButton.addEventListener("click", () => {
            const codeElement = codeBlock.querySelector("pre > code");
            const code = codeElement.innerText;
            
            let lang = 'plaintext';
            if (codeElement && codeElement.className) {
                const match = codeElement.className.match(/language-(\w+)/);
                if (match && match[1]) {
                    lang = match[1];
                }
            }

            const encodedCode = btoa(code);
            const playgroundUrl = `${baseUrl}playground.html?code=${encodedCode}&lang=${lang}`;
            window.open(playgroundUrl, '_blank');
        });
        codeBlock.appendChild(editButton);

        // --- NOVO: Botão Executar e Painel de Saída para Mini-Playgrounds ---
        const codeElement = codeBlock.querySelector("pre > code");
        const langMatch = codeElement.className.match(/language-(\w+)/);
        const lang = (langMatch && langMatch[1]) ? langMatch[1] : null;

        if (lang === 'python') {
            const runButton = document.createElement("button");
            runButton.className = "absolute top-2 left-2 p-1 px-2 text-xs text-gray-300 bg-gray-800 rounded-md hover:bg-green-700 hover:text-white transition-colors flex items-center gap-1";
            runButton.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px;">play_arrow</span> Executar`;
            runButton.setAttribute("aria-label", "Executar código");
            runButton.setAttribute("data-tooltip-text", "Executar este código");

            let outputPanel = null;

            runButton.addEventListener('click', async () => {
                // Cria o painel de saída na primeira vez que o botão é clicado
                if (!outputPanel) {
                    outputPanel = document.createElement('pre');
                    outputPanel.className = "p-4 font-mono text-sm text-gray-300 bg-black rounded-b-md -mt-4 relative z-0";
                    codeBlock.parentNode.insertBefore(outputPanel, codeBlock.nextSibling);
                }
                
                outputPanel.textContent = "Inicializando ambiente...";
                runButton.disabled = true;
                runButton.classList.add("opacity-50");

                try {
                    // Carrega o Pyodide sob demanda (lazy-loading)
                    const pyodide = await getPyodideInstance((status) => {
                        outputPanel.textContent = status;
                    });
                    
                    const code = codeElement.innerText;
                    const result = await pyodide.run(code);
                    outputPanel.textContent = result;
                } catch (error) {
                    outputPanel.textContent = `Erro: ${error.message}`;
                } finally {
                    runButton.disabled = false;
                    runButton.classList.remove("opacity-50");
                }
            });
            codeBlock.appendChild(runButton);
        }
    });
});
