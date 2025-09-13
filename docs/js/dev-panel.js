document.addEventListener("DOMContentLoaded", () => {
    // Evita que o painel seja executado em iframes
    if (window.self !== window.top) {
        return;
    }

    const DEV_PANEL_VERSION = "1.5.0"; // Versão com Auditoria Global

    const baseUrlMeta = document.querySelector('meta[name="base-url"]');
    const baseUrl = baseUrlMeta ? baseUrlMeta.content : '';

    const applySavedPreferences = () => {
        const savedTabSize = localStorage.getItem('tabSizePreference');
        if (savedTabSize) {
            document.documentElement.style.setProperty('--tab-size-preference', savedTabSize);
        }
    };
    applySavedPreferences();

    const axeScript = document.createElement("script");
    axeScript.src = `${baseUrl}js/vendor/axe.min.js`;
    axeScript.defer = true;
    document.head.appendChild(axeScript);

    const panelHTML = `
        <div id="dev-tools-trigger" class="fixed bottom-4 right-4 z-[100] bg-slate-800 text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-slate-700 transition-transform hover:scale-110">
            <span class="material-symbols-outlined">developer_mode</span>
        </div>
        <div id="dev-panel" class="hidden fixed bottom-0 left-0 w-full h-2/3 bg-gray-900 text-white shadow-2xl z-[99] flex flex-col font-mono text-sm">
            <div class="flex items-center justify-between bg-gray-800 p-2 border-b border-gray-700">
                <div class="flex items-center gap-4 min-w-0">
                    <h2 class="font-bold text-lg px-2 flex-shrink-0">Pitchutcha Dev Panel</h2>
                    <nav class="flex gap-1 overflow-x-auto whitespace-nowrap">
                        <button data-tab="auditoria" class="dev-tab active-tab">Auditoria</button>
                        <button data-tab="elements" class="dev-tab">Elements</button>
                        <button data-tab="console" class="dev-tab">Console</button>
                        <button data-tab="storage" class="dev-tab">Storage</button>
                        <button data-tab="testes" class="dev-tab">Testes</button>
                        <button data-tab="info" class="dev-tab">Info</button>
                    </nav>
                </div>
                <button id="close-dev-panel" class="p-2 rounded-full hover:bg-gray-700">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div id="dev-panel-content" class="flex-1 overflow-auto flex"></div>
            <div id="console-input-container" class="hidden items-center p-2 border-t border-gray-700">
                <span class="material-symbols-outlined text-sky-400">chevron_right</span>
                <textarea id="console-input" class="flex-1 bg-transparent border-none focus:outline-none ml-2 resize-none" rows="1" placeholder="Executar JavaScript..."></textarea>
            </div>
        </div>
    `;

    const panelWrapper = document.createElement("div");
    panelWrapper.innerHTML = panelHTML;
    document.body.appendChild(panelWrapper);

    const triggerButton = document.getElementById("dev-tools-trigger");
    const devPanel = document.getElementById("dev-panel");
    const closeButton = document.getElementById("close-dev-panel");
    const panelContent = document.getElementById("dev-panel-content");
    const consoleInputContainer = document.getElementById("console-input-container");
    const devTabs = document.querySelectorAll(".dev-tab");
    
    let isInspecting = false;
    let lastInspectedElement = null;
    let lastSelectedTreeNode = null;
    const domElementToTreeNode = new WeakMap();

    triggerButton.addEventListener("click", () => {
        devPanel.classList.toggle("hidden");
        if (!devPanel.classList.contains("hidden")) {
            renderTabContent("auditoria"); 
        }
    });
    closeButton.addEventListener("click", () => devPanel.classList.add("hidden"));
    
    devTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            devTabs.forEach(t => t.classList.remove("active-tab"));
            tab.classList.add("active-tab");
            renderTabContent(tab.dataset.tab);
        });
    });

    function renderTabContent(tabId) {
        panelContent.innerHTML = ""; 
        consoleInputContainer.style.display = (tabId === "console") ? "flex" : "none";
        if (isInspecting) toggleInspector();
        
        switch (tabId) {
            case "auditoria": renderAuditoriaTab(); break;
            case "elements": renderElementsTab(); break;
            case "console": renderConsoleTab(); break;
            case "storage": renderStorageTab(); break;
            case "testes": renderTestesTab(); break;
            case "info": renderInfoTab(); break;
            default: panelContent.innerHTML = `<div class="p-4">Aba não implementada: ${tabId}</div>`;
        }
    }

    // --- ABA DE AUDITORIA GLOBAL ---
    function renderAuditoriaTab() {
        panelContent.innerHTML = `
            <div class="p-4 w-full">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h3 class="font-bold text-lg">Auditoria Global do Site</h3>
                        <p class="text-sm text-gray-400">Executa uma série de testes em todas as páginas conhecidas do site.</p>
                    </div>
                    <div>
                        <button id="run-global-audit" class="dev-button bg-sky-600 hover:bg-sky-500 border-sky-500">Iniciar Auditoria</button>
                        <button id="copy-audit-report" class="dev-button hidden ml-2">Copiar Relatório</button>
                    </div>
                </div>
                <div id="audit-results" class="bg-gray-800 p-2 rounded-md overflow-auto h-[calc(100%-100px)]">
                    <div class="p-4 text-center text-gray-500">Aguardando início da auditoria...</div>
                </div>
            </div>`;
        document.getElementById('run-global-audit').addEventListener('click', runGlobalAudit);
    }
    
    async function runGlobalAudit() {
        const resultsContainer = document.getElementById('audit-results');
        const runButton = document.getElementById('run-global-audit');
        const copyButton = document.getElementById('copy-audit-report');
        
        runButton.disabled = true;
        runButton.textContent = 'Executando...';
        copyButton.classList.add('hidden');
        resultsContainer.innerHTML = '<div class="p-4 text-center text-gray-400">Iniciando auditoria...</div>';

        const pagesToScan = [
            'index.html', 'algoritmos.html', 'estruturas-de-dados.html', 'search.html', 'status.html'
        ];
        
        try {
            const response = await fetch(`${baseUrl}search.json`);
            if (response.ok) {
                const posts = await response.json();
                posts.forEach(post => pagesToScan.push(post.url.replace(baseUrl, '')));
            }
        } catch(e) {
            console.warn("Não foi possível carregar a lista de posts de search.json.");
        }

        const uniquePages = [...new Set(pagesToScan)];
        let fullReportText = `Relatório de Auditoria Global - ${new Date().toLocaleString('pt-BR')}\n\n`;

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        resultsContainer.innerHTML = ''; 

        for (let i = 0; i < uniquePages.length; i++) {
            const page = uniquePages[i];
            const url = page.startsWith('/') ? `${baseUrl}${page.substring(1)}` : `${baseUrl}${page}`;
            resultsContainer.innerHTML += `<div class="p-2 text-sky-400">Analisando (${i+1}/${uniquePages.length}): ${page}...</div>`;
            
            const pageResults = await analyzePageInIframe(iframe, url);
            
            const resultHTML = document.createElement('details');
            resultHTML.className = 'bg-gray-900 border border-gray-700 rounded-md mb-2';
            
            const summary = document.createElement('summary');
            summary.className = 'p-2 cursor-pointer flex justify-between items-center';
            const errorCount = pageResults.accessibility.length + pageResults.brokenLinks.length + pageResults.jsErrors.length + pageResults.missingAlts.length;
            summary.innerHTML = `<span>${page}</span> <span class="px-2 py-1 text-xs rounded-full ${errorCount > 0 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}">${errorCount} problemas</span>`;
            resultHTML.appendChild(summary);

            const content = document.createElement('div');
            content.className = 'p-4 border-t border-gray-700 text-xs';
            content.innerHTML = pageResults.html;
            resultHTML.appendChild(content);

            resultsContainer.appendChild(resultHTML);
            fullReportText += pageResults.text;
        }

        document.body.removeChild(iframe);
        resultsContainer.innerHTML += `<div class="p-2 text-green-400">Auditoria concluída em ${uniquePages.length} páginas.</div>`;
        runButton.disabled = false;
        runButton.textContent = 'Executar Novamente';

        copyButton.classList.remove('hidden');
        copyButton.onclick = () => {
            navigator.clipboard.writeText(fullReportText).then(() => {
                copyButton.textContent = 'Copiado!';
                setTimeout(() => copyButton.textContent = 'Copiar Relatório', 2000);
            });
        };
    }

    function analyzePageInIframe(iframe, url) {
        return new Promise(resolve => {
            let results = {
                accessibility: [], brokenLinks: [], jsErrors: [], missingAlts: [],
                text: `--- PÁGINA: ${url} ---\n\n`, html: ''
            };
            
            const timeout = setTimeout(() => {
                iframe.removeEventListener('load', onIframeLoad);
                results.jsErrors.push({ message: `Timeout: A página ${url} demorou muito para carregar.`});
                formatAndResolve();
            }, 10000); // Timeout de 10 segundos por página

            const onIframeLoad = async () => {
                clearTimeout(timeout);
                iframe.removeEventListener('load', onIframeLoad);
                const doc = iframe.contentDocument;

                if (typeof axe !== 'undefined') {
                    const axeResults = await axe.run(doc.body);
                    results.accessibility = axeResults.violations;
                }

                doc.querySelectorAll('img:not([alt]), img[alt=""]').forEach(img => {
                    results.missingAlts.push({ src: img.src });
                });

                formatAndResolve();
            };

            const formatAndResolve = () => {
                let htmlReport = '';
                // Acessibilidade
                htmlReport += '<h4 class="font-bold text-yellow-400 mb-1">Acessibilidade</h4>';
                if(results.accessibility.length > 0) {
                    results.text += `[Acessibilidade]\n`;
                    results.accessibility.forEach(v => {
                        htmlReport += `<div class="mb-2 p-1 border-l-2 border-yellow-400"><strong>${v.help}:</strong> ${v.description}</div>`;
                        results.text += `- ${v.help}: ${v.description}\n`;
                    });
                } else { htmlReport += '<p class="text-gray-400">Nenhum problema encontrado.</p>'; }

                // Erros JS
                htmlReport += '<h4 class="font-bold text-red-400 mt-2 mb-1">Erros de Console</h4>';
                if(results.jsErrors.length > 0) {
                    results.text += `\n[Erros de Console]\n`;
                    results.jsErrors.forEach(err => {
                        htmlReport += `<div class="mb-2 p-1 border-l-2 border-red-400">${err.message}</div>`;
                        results.text += `- ${err.message}\n`;
                    });
                } else { htmlReport += '<p class="text-gray-400">Nenhum erro encontrado.</p>'; }
                
                // Imagens
                htmlReport += '<h4 class="font-bold text-yellow-400 mt-2 mb-1">Imagens sem Atributo "alt"</h4>';
                if(results.missingAlts.length > 0) {
                    results.text += `\n[Imagens sem Alt]\n`;
                    results.missingAlts.forEach(img => {
                        htmlReport += `<div class="mb-2 p-1 border-l-2 border-yellow-400"><strong>SRC:</strong> ${img.src}</div>`;
                        results.text += `- ${img.src}\n`;
                    });
                } else { htmlReport += '<p class="text-gray-400">Nenhum problema encontrado.</p>'; }
                
                results.html = htmlReport;
                results.text += `\n\n`;
                resolve(results);
            };

            iframe.addEventListener('load', onIframeLoad);
            iframe.contentWindow.onerror = (message) => {
                results.jsErrors.push({ message });
                return true; 
            };
            iframe.src = url;
        });
    }

    // --- Outras Abas (Funções Originais) ---
    function renderElementsTab() {
        panelContent.innerHTML = `
            <div id="elements-tree-container" class="w-1/2 overflow-auto p-2 border-r border-gray-700"></div>
            <div id="styles-container" class="w-1/2 overflow-auto p-2">
                <div class="flex items-center gap-2 mb-2">
                    <button id="inspector-toggle" class="p-1 rounded hover:bg-gray-700" title="Inspecionar um elemento na página">
                        <span class="material-symbols-outlined">ads_click</span>
                    </button>
                    <h3 class="font-bold">Computed Styles</h3>
                </div>
                <div id="computed-styles-container">Clique em um elemento para ver os estilos.</div>
            </div>`;
        document.getElementById("elements-tree-container").appendChild(buildElementsTree(document.documentElement));
        document.getElementById("inspector-toggle").addEventListener("click", toggleInspector);
    }
    
    function renderConsoleTab() { 
        panelContent.innerHTML = '<div id="console-output" class="flex-1 overflow-y-auto p-2 relative"></div>';
        const consoleInput = document.getElementById("console-input");
        if (consoleInput) {
            consoleInput.addEventListener("keydown", e => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault(); 
                    const command = consoleInput.value;
                    if (command) {
                        consoleInput.value = "";
                        consoleInput.rows = 1;
                        logToPanel({ type: "log", args: [`> ${command}`] });
                        try {
                            const result = eval(command);
                            if (result !== undefined) logToPanel({ type: "info", args: [result] });
                        } catch (error) {
                            logToPanel({ type: "error", args: [error.toString()] });
                        }
                    }
                }
            });
            consoleInput.addEventListener('input', () => {
                consoleInput.style.height = 'auto';
                consoleInput.style.height = `${consoleInput.scrollHeight}px`;
            });
        }
    }

    function renderStorageTab() {
        let tableRows = "";
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            tableRows += `<tr class='border-b border-gray-800'><td class='p-2 align-top text-orange-400'>${key}</td><td class='p-2 align-top text-green-400 whitespace-pre-wrap break-all'>${value}</td></tr>`;
        }
        panelContent.innerHTML = `<div class="p-2 w-full"><h3 class="font-bold text-lg mb-2">Local Storage</h3><table class="w-full text-left text-xs"><thead><tr class="border-b border-gray-700"><th class="p-2 w-1/4">Key</th><th class="p-2">Value</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
    }
    
    function renderTestesTab() {
        panelContent.innerHTML = `<div class="p-4 w-full"><button id="run-diagnostics" class="dev-button">Rodar Diagnóstico da Página Atual</button><div id="test-results" class="mt-4"></div></div>`;
        document.getElementById("run-diagnostics")?.addEventListener("click", runComprehensiveDiagnostics);
    }

    function renderInfoTab() {
        const buildTimeMeta = document.querySelector('meta[name="jekyll-build-time"]');
        const buildTime = buildTimeMeta ? new Date(buildTimeMeta.content).toLocaleString("pt-BR") : 'Não encontrado';
        panelContent.innerHTML = `
            <div class="p-4 w-full">
                <table class='w-full text-left'><tbody>
                    <tr class='border-b border-gray-800'><td class='p-2 font-bold text-sky-400'>Versão do Painel</td><td class='p-2'>${DEV_PANEL_VERSION}</td></tr>
                    <tr class='border-b border-gray-800'><td class='p-2 font-bold text-sky-400'>Hora da Construção</td><td class='p-2'>${buildTime}</td></tr>
                    <tr class='border-b border-gray-800'><td class='p-2 font-bold'>User Agent</td><td class='p-2'>${navigator.userAgent}</td></tr>
                </tbody></table>
                <div class="mt-6 pt-4 border-t border-gray-700">
                    <h3 class="font-bold text-lg mb-2">Preferências</h3>
                    <div class="flex items-center gap-4 text-white">
                        <label for="tab-size-select">Tamanho da tabulação (espaços):</label>
                        <select id="tab-size-select" class="bg-gray-800 border border-gray-600 rounded p-1"><option value="2">2</option><option value="4">4</option><option value="8">8</option></select>
                    </div>
                </div>
            </div>`;
        const tabSizeSelect = document.getElementById('tab-size-select');
        if (tabSizeSelect) {
            const savedTabSize = localStorage.getItem('tabSizePreference') || '4';
            tabSizeSelect.value = savedTabSize;
            tabSizeSelect.addEventListener('change', (e) => {
                const newSize = e.target.value;
                document.documentElement.style.setProperty('--tab-size-preference', newSize);
                localStorage.setItem('tabSizePreference', newSize);
            });
        }
    }

    function logToPanel(log) {
        const consoleOutput = document.getElementById("console-output");
        if (!consoleOutput) return;
        let color = "text-white";
        if (log.type === "error") color = "text-red-400";
        if (log.type === "warn") color = "text-yellow-400";
        if (log.type === "info") color = "text-sky-400";
        const item = document.createElement("div");
        item.className = `console-log-item group relative py-1 px-2 border-b border-gray-800 flex gap-2 ${color}`;
        let contentText = log.args.map(arg => typeof arg === "string" ? arg : JSON.stringify(arg, null, 2)).join(" ");
        item.innerHTML = `
            <span class="opacity-50">${new Date().toLocaleTimeString()}</span>
            <div class="flex-1 whitespace-pre-wrap">${contentText}</div>
            <button class="copy-log-btn absolute top-1 right-1 p-1 text-xs bg-gray-700 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">Copiar</button>`;
        consoleOutput.appendChild(item);
        item.querySelector('.copy-log-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(contentText);
        });
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    ["log", "warn", "error", "info"].forEach(type => {
        const original = console[type];
        console[type] = (...args) => {
            original.apply(console, args);
            logToPanel({ type, args });
        };
    });

    window.onerror = (message, source, lineno) => {
        logToPanel({ type: "error", args: [`Erro: ${message} em ${source}:${lineno}`] });
    };

    function buildElementsTree(rootElement) {
        const treeContainer = document.createElement('div');
        function createNode(element, depth) {
            if (!element.tagName) return null;
            const nodeWrapper = document.createElement('div');
            const nodeHeader = document.createElement('div');
            nodeHeader.className = 'element-node-header flex items-center cursor-pointer hover:bg-gray-800 rounded p-0.5';
            nodeHeader.style.paddingLeft = `${depth}rem`;
            domElementToTreeNode.set(element, nodeHeader);
            const attributes = Array.from(element.attributes).map(attr => `<span class="text-orange-400">${attr.name}</span>="<span class="text-green-400">${attr.value}</span>"`).join(" ");
            const hasChildren = element.children.length > 0;
            const arrow = hasChildren ? `<span class="material-symbols-outlined text-sm expand-icon">arrow_right</span>` : `<span class='w-4 inline-block'></span>`;
            nodeHeader.innerHTML = `${arrow}<span class='text-gray-500'>&lt;</span><span class='text-pink-400'>${element.tagName.toLowerCase()}</span> <span class="attributes">${attributes}</span><span class='text-gray-500'>&gt;</span>`;
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'element-children hidden';
            nodeWrapper.append(nodeHeader, childrenContainer);
            nodeHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                childrenContainer.classList.toggle('hidden');
                const icon = nodeHeader.querySelector('.expand-icon');
                if (icon) icon.textContent = childrenContainer.classList.contains('hidden') ? 'arrow_right' : 'arrow_drop_down';
                selectElement(element);
            });
            if (hasChildren) {
                for (const child of element.children) {
                    const childNode = createNode(child, depth + 1);
                    if (childNode) childrenContainer.appendChild(childNode);
                }
            }
            return nodeWrapper;
        }
        treeContainer.appendChild(createNode(rootElement, 0));
        return treeContainer;
    }

    function selectElement(element) {
        highlightOnPage(element);
        highlightInTree(element);
        displayComputedStyles(element);
    }

    function displayComputedStyles(element) {
        const container = document.getElementById("computed-styles-container");
        if (!container || !element) { if(container) container.innerHTML = "Selecione um elemento."; return; };
        const styles = window.getComputedStyle(element);
        let tableHTML = "<table class='w-full text-left text-xs'>";
        Array.from(styles).forEach(prop => {
            tableHTML += `<tr class='border-b border-gray-800'><td class='p-1 text-pink-400'>${prop}</td><td class='p-1 text-cyan-400'>${styles.getPropertyValue(prop)}</td></tr>`;
        });
        tableHTML += "</table>";
        container.innerHTML = tableHTML;
    }

    function highlightOnPage(element) {
        if (lastInspectedElement) lastInspectedElement.style.outline = '';
        element.style.outline = '2px solid #0ea5e9';
        lastInspectedElement = element;
    }

    function highlightInTree(element) {
        if (lastSelectedTreeNode) lastSelectedTreeNode.style.backgroundColor = '';
        const treeNode = domElementToTreeNode.get(element);
        if (treeNode) {
            treeNode.style.backgroundColor = 'rgba(14, 165, 233, 0.3)';
            lastSelectedTreeNode = treeNode;
        }
    }

    function revealInTree(element) {
        let current = element;
        while(current) {
            const treeNode = domElementToTreeNode.get(current);
            if(treeNode) {
                const childrenContainer = treeNode.parentElement.querySelector('.element-children');
                if(childrenContainer) childrenContainer.classList.remove('hidden');
                const icon = treeNode.querySelector('.expand-icon');
                if (icon) icon.textContent = 'arrow_drop_down';
            }
            current = current.parentElement;
        }
        domElementToTreeNode.get(element)?.scrollIntoView({ block: 'center' });
    }

    function toggleInspector() {
        isInspecting = !isInspecting;
        const button = document.getElementById('inspector-toggle');
        if (button) {
            button.style.backgroundColor = isInspecting ? '#0ea5e9' : 'transparent';
        }
        document.body.style.cursor = isInspecting ? 'crosshair' : 'default';
        if (isInspecting) {
            document.addEventListener('mouseover', highlightOnPage);
            document.addEventListener('click', selectElementOnPage, { capture: true });
        } else {
            document.removeEventListener('mouseover', highlightOnPage);
            document.removeEventListener('click', selectElementOnPage, { capture: true });
        }
    }
    
    function selectElementOnPage(e) {
        if (!isInspecting || e.target.closest("#dev-panel")) return;
        e.preventDefault();
        e.stopPropagation();
        selectElement(e.target);
        revealInTree(e.target);
        toggleInspector();
    }

    async function runAxeAudit() {
        const resultsContainer = document.getElementById("axe-results");
        if(!resultsContainer) return;
        resultsContainer.innerHTML = "Analisando...";
        if (typeof axe === 'undefined') {
            resultsContainer.innerHTML = `<p class="text-red-500">Axe library not loaded.</p>`;
            return;
        }
        try {
            const results = await axe.run({ exclude: [['#dev-panel']] });
            resultsContainer.innerHTML = '';
            const { violations, incomplete, passes } = results;
            if (violations.length === 0 && incomplete.length === 0) {
                 resultsContainer.innerHTML = '<p class="text-green-400 font-bold">Parabéns! Nenhum problema de acessibilidade encontrado.</p>';
            }
            if (violations.length > 0) {
                resultsContainer.insertAdjacentHTML("beforeend", '<h4 class="text-lg font-bold text-red-400 mb-2">Violações</h4>');
                violations.forEach(v => resultsContainer.insertAdjacentHTML("beforeend", `<div class="p-2 my-1 bg-red-900/50"><p>${v.help}</p><a href="${v.helpUrl}" target="_blank" class="text-sky-400">Saiba mais</a></div>`));
            }
        } catch (err) {
            resultsContainer.innerHTML = `<p class="text-red-500">${err.message}</p>`;
        }
    }

    async function runComprehensiveDiagnostics() {
        const resultsContainer = document.getElementById("test-results");
        if (!resultsContainer) return;
        resultsContainer.innerHTML = `<table class="w-full text-left text-xs"><thead><tr class="border-b border-gray-700"><th class="p-2">Teste</th><th class="p-2">Resultado</th><th class="p-2">Detalhes</th></tr></thead><tbody></tbody></table>`;
        const tbody = resultsContainer.querySelector("tbody");
        const addResult = (test, status, details) => {
            const statusColor = status === "PASS" ? 'text-green-400' : 'text-red-400';
            tbody.innerHTML += `<tr class="border-b border-gray-800"><td class="p-2">${test}</td><td class="p-2 font-bold ${statusColor}">${status}</td><td class="p-2">${details}</td></tr>`;
        };
        
        try {
            const response = await fetch(`${baseUrl}search.json`);
            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) addResult("Validação de `search.json`", "PASS", "Arquivo encontrado e contém dados.");
                else addResult("Validação de `search.json`", "FAIL", "Arquivo vazio.");
            } else {
                addResult("Validação de `search.json`", "FAIL", `Arquivo não encontrado (Status: ${response.status}).`);
            }
        } catch (e) {
            addResult("Validação de `search.json`", "FAIL", "Não é um JSON válido.");
        }
    }
});
