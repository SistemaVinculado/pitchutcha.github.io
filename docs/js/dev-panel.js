document.addEventListener("DOMContentLoaded", () => {
    // Evita que o painel seja executado em iframes
    if (window.self !== window.top) {
        return;
    }

    const DEV_PANEL_VERSION = "1.5.1"; // Versão com botão de recarga de testes
    let capturedErrors = []; // Armazena erros de JS

    const baseUrlMeta = document.querySelector('meta[name="base-url"]');
    const baseUrl = baseUrlMeta ? baseUrlMeta.content : '';

    // Carrega a biblioteca Axe para testes de acessibilidade
    const axeScript = document.createElement("script");
    axeScript.src = `${baseUrl}js/vendor/axe.min.js`;
    axeScript.defer = true;
    document.head.appendChild(axeScript);

    // --- HTML para o Painel e o Botão de Ativação ---
    const panelHTML = `
        <div id="dev-tools-trigger" class="fixed bottom-4 right-4 z-[100] bg-slate-800 text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-slate-700 transition-transform hover:scale-110">
            <span class="material-symbols-outlined">developer_mode</span>
        </div>
        <div id="dev-panel" class="hidden fixed bottom-0 left-0 w-full h-2/3 bg-gray-900 text-white shadow-2xl z-[99] flex flex-col font-mono text-sm">
            <div class="flex items-center justify-between bg-gray-800 p-2 border-b border-gray-700">
                <div class="flex items-center gap-4 min-w-0">
                    <h2 class="font-bold text-lg px-2 flex-shrink-0">Pitchutcha Dev Panel</h2>
                    <nav class="flex gap-1 overflow-x-auto whitespace-nowrap">
                        <button data-tab="elements" class="dev-tab active-tab">Elements</button>
                        <button data-tab="console" class="dev-tab">Console</button>
                        <button data-tab="storage" class="dev-tab">Storage</button>
                        <button data-tab="network" class="dev-tab">Network</button>
                        <button data-tab="recursos" class="dev-tab">Recursos</button>
                        <button data-tab="acessibilidade" class="dev-tab">Acessibilidade</button>
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
                <textarea id="console-input" class="flex-1 bg-transparent border-none focus:outline-none ml-2 resize-none" rows="1" placeholder="Executar JavaScript... (Shift+Enter para nova linha)"></textarea>
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
            renderTabContent("info"); 
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
        
        if (isInspecting) {
            toggleInspector();
        }
        
        switch (tabId) {
            case "elements": renderElementsTab(); break;
            case "console": renderConsoleTab(); break;
            case "storage": renderStorageTab(); break;
            case "network": renderNetworkTab(); break;
            case "recursos": renderRecursosTab(); break;
            case "acessibilidade": renderAcessibilidadeTab(); break;
            case "testes": renderTestesTab(); break; // Modificado
            case "info": renderInfoTab(); break;
            default: panelContent.innerHTML = `<div class="p-4">Aba não encontrada: ${tabId}</div>`;
        }
    }

    // ... (todas as outras funções como renderElementsTab, renderConsoleTab, etc. continuam iguais) ...
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
        const elementsContainer = document.getElementById("elements-tree-container");
        if(elementsContainer) {
             elementsContainer.appendChild(buildElementsTree(document.documentElement));
        }
        const inspectorToggle = document.getElementById("inspector-toggle");
        if(inspectorToggle) {
            inspectorToggle.addEventListener("click", toggleInspector);
        }
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
                            if (result !== undefined) {
                                logToPanel({ type: "info", args: [result] });
                            }
                        } catch (error) {
                            logToPanel({ type: "error", args: [error.toString()] });
                        }
                    }
                }
            });
            consoleInput.addEventListener('input', () => {
                consoleInput.style.height = 'auto';
                consoleInput.style.height = (consoleInput.scrollHeight) + 'px';
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
    
    function renderNetworkTab() {
        const nav = performance.getEntriesByType("navigation")[0];
        if(!nav) {
            panelContent.innerHTML = `<div class="p-4">Informação de Network não disponível.</div>`;
            return;
        };
        panelContent.innerHTML = `<div class="p-4 w-full"><table class='w-full text-left'><tbody><tr class='border-b border-gray-800'><td class='p-2 font-bold'>Tempo Total de Carregamento</td><td class='p-2'>${nav.duration.toFixed(0)} ms</td></tr><tr class='border-b border-gray-800'><td class='p-2'>Lookup de DNS</td><td class='p-2'>${(nav.domainLookupEnd - nav.domainLookupStart).toFixed(0)} ms</td></tr><tr class='border-b border-gray-800'><td class='p-2'>Conexão TCP</td><td class='p-2'>${(nav.connectEnd - nav.connectStart).toFixed(0)} ms</td></tr><tr class='border-b border-gray-800'><td class='p-2'>Tempo até Primeiro Byte (TTFB)</td><td class='p-2'>${(nav.responseStart - nav.requestStart).toFixed(0)} ms</td></tr><tr class='border-b border-gray-800'><td class='p-2'>Download do Conteúdo</td><td class='p-2'>${(nav.responseEnd - nav.responseStart).toFixed(0)} ms</td></tr></tbody></table></div>`;
    }

    function renderRecursosTab() {
        const resources = performance.getEntriesByType("resource");
        let tableRows = "";
        resources.forEach(r => { tableRows += `<tr class='border-b border-gray-800'><td class='p-2 truncate max-w-xs'>${r.name.split("/").pop()}</td><td class='p-2'>${r.initiatorType}</td><td class='p-2'>${(r.transferSize / 1024).toFixed(2)}</td><td class='p-2'>${r.duration.toFixed(0)}</td></tr>`; });
        panelContent.innerHTML = `<div class="p-4 w-full"><table class='w-full text-left'><thead><tr class='border-b border-gray-700'><th class='p-2'>Nome</th><th class='p-2'>Tipo</th><th class='p-2'>Tamanho (KB)</th><th class='p-2'>Tempo (ms)</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
    }
    
    function renderAcessibilidadeTab() {
        panelContent.innerHTML = `
            <div class="p-4">
                <button id="run-accessibility-check" class="dev-button w-full mb-4">Verificar Acessibilidade da Página Atual</button>
                <div id="accessibility-results" class="space-y-4"></div>
            </div>`;
        document.getElementById("run-accessibility-check").addEventListener("click", runAxeAudit);
    }
    
    // MODIFICADO: Função para renderizar a Aba Testes
    function renderTestesTab() {
        panelContent.innerHTML = `
            <div class="p-4 w-full">
                <button id="run-diagnostics-report" class="dev-button w-full mb-4">Carregar Relatório de Diagnóstico</button>
                <div id="diagnostics-results" class="space-y-6 mt-4"></div>
            </div>`;
        document.getElementById("run-diagnostics-report").addEventListener("click", loadAndRenderDiagnostics);
    }

    function renderInfoTab() {
        const buildTimeMeta = document.querySelector('meta[name="jekyll-build-time"]');
        const buildTime = buildTimeMeta ? new Date(buildTimeMeta.content).toLocaleString("pt-BR") : 'Não encontrado';

        panelContent.innerHTML = `<div class="p-4 w-full"><table class='w-full text-left'><tbody>
            <tr class='border-b border-gray-800'><td class='p-2 font-bold text-sky-400'>Versão do Painel</td><td class='p-2'>${DEV_PANEL_VERSION}</td></tr>
            <tr class='border-b border-gray-800'><td class='p-2 font-bold text-sky-400'>Hora da Construção do Site</td><td class='p-2'>${buildTime}</td></tr>
            <tr class='border-b border-gray-800'><td class='p-2 font-bold'>User Agent</td><td class='p-2'>${navigator.userAgent}</td></tr>
            <tr class='border-b border-gray-800'><td class='p-2 font-bold'>Viewport</td><td class='p-2'>${window.innerWidth}px x ${window.innerHeight}px</td></tr>
            <tr class='border-b border-gray-800'><td class='p-2 font-bold'>Plataforma</td><td class='p-2'>${navigator.platform}</td></tr>
            <tr class='border-b border-gray-800'><td class='p-2 font-bold'>Linguagem</td><td class='p-2'>${navigator.language}</td></tr>
        </tbody></table></div>`;
    }

    // ... (funções logToPanel, buildElementsTree e inspetor continuam as mesmas) ...
    function logToPanel(log) {
        const consoleOutput = document.getElementById("console-output");
        if (!consoleOutput) return;

        let color = "text-white";
        if (log.type === "error") color = "text-red-400";
        if (log.type === "warn") color = "text-yellow-400";
        if (log.type === "info") color = "text-sky-400";
        
        const item = document.createElement("div");
        item.className = `console-log-item group relative py-1 px-2 border-b border-gray-800 flex gap-2 ${color}`;
        
        let contentText = '';
        try {
            contentText = log.args.map(arg => {
                if (typeof arg === "string") return arg;
                if (arg instanceof Node) return arg.outerHTML;
                return JSON.stringify(arg, null, 2);
            }).join(" ");
        } catch (e) {
            contentText = "Não foi possível exibir o objeto.";
        }

        item.innerHTML = `
            <span class="opacity-50">${new Date().toLocaleTimeString()}</span>
            <div class="flex-1 whitespace-pre-wrap">${contentText}</div>
            <button class="copy-log-btn absolute top-1 right-1 p-1 text-xs bg-gray-700 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">Copiar</button>
        `;
        
        consoleOutput.appendChild(item);

        const copyButton = item.querySelector('.copy-log-btn');
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(contentText).then(() => {
                copyButton.textContent = 'Copiado!';
                setTimeout(() => { copyButton.textContent = 'Copiar'; }, 2000);
            }).catch(err => {
                copyButton.textContent = 'Erro!';
                console.error('Falha ao copiar: ', err);
            });
        });

        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    ["log", "warn", "info"].forEach(type => {
        const original = console[type];
        console[type] = (...args) => {
            original.apply(console, args);
            logToPanel({ type, args });
        };
    });

    const originalError = console.error;
    console.error = (...args) => {
        originalError.apply(console, args);
        capturedErrors.push(args.join(' '));
        logToPanel({ type: "error", args });
    };
    window.onerror = (message, source, lineno, colno, error) => {
        const errorMsg = `Erro não capturado: ${message} em ${source}:${lineno}`;
        capturedErrors.push(errorMsg);
        logToPanel({ type: "error", args: [errorMsg] });
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
            const attributes = Array.from(element.attributes).map(attr => `<span class="text-orange-400">${attr.name}</span><span class="text-gray-500">="</span><span class="text-green-400">${attr.value}</span><span class="text-gray-500">"</span>`).join(" ");
            const hasChildren = element.children.length > 0;
            const arrow = hasChildren ? `<span class="material-symbols-outlined text-sm expand-icon">arrow_right</span>` : `<span class='w-4 inline-block'></span>`;
            nodeHeader.innerHTML = `${arrow}<span class='text-gray-500'>&lt;</span><span class='text-pink-400'>${element.tagName.toLowerCase()}</span> <span class="attributes">${attributes}</span><span class='text-gray-500'>&gt;</span>`;
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'element-children hidden';
            nodeWrapper.appendChild(nodeHeader);
            nodeWrapper.appendChild(childrenContainer);
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
        const rootNode = createNode(rootElement, 0);
        if (rootNode) treeContainer.appendChild(rootNode);
        return treeContainer;
    }

    function selectElement(element) {
        highlightOnPage(element);
        highlightInTree(element);
        displayComputedStyles(element);
    }

    function displayComputedStyles(element) {
        const container = document.getElementById("computed-styles-container");
        if (!container || !element) { if(container) container.innerHTML = "Selecione um elemento para ver os estilos."; return; };
        const styles = window.getComputedStyle(element);
        const properties = Array.from(styles).filter(prop => !prop.startsWith("-")).sort();
        let tableHTML = "<table class='w-full text-left text-xs'>";
        properties.forEach(prop => { tableHTML += `<tr class='border-b border-gray-800'><td class='p-1 text-pink-400'>${prop}</td><td class='p-1 text-cyan-400'>${styles.getPropertyValue(prop)}</td></tr>`; });
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
                if(childrenContainer) {
                    childrenContainer.classList.remove('hidden');
                    const icon = treeNode.querySelector('.expand-icon');
                    if (icon) icon.textContent = 'arrow_drop_down';
                }
            }
            current = current.parentElement;
        }
        const finalNode = domElementToTreeNode.get(element);
        if (finalNode) finalNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function toggleInspector() {
        isInspecting = !isInspecting;
        const inspectorButton = document.getElementById('inspector-toggle');
        if (inspectorButton) {
            inspectorButton.style.backgroundColor = isInspecting ? '#0ea5e9' : 'transparent';
            inspectorButton.style.color = isInspecting ? 'white' : '#9ca3af';
        }
        document.body.style.cursor = isInspecting ? 'crosshair' : 'default';
        if (isInspecting) {
            document.addEventListener('mouseover', highlightOnPage);
            document.addEventListener('click', selectElementOnPage, { capture: true });
        } else {
            document.removeEventListener('mouseover', highlightOnPage);
            document.removeEventListener('click', selectElementOnPage, { capture: true });
            if (lastInspectedElement) {
                lastInspectedElement.style.outline = '';
            }
        }
    }
    
    function selectElementOnPage(e) {
        if (!isInspecting || e.target.closest("#dev-panel")) return;
        e.preventDefault();
        e.stopPropagation();
        
        const clickedElement = e.target;
        
        selectElement(clickedElement);
        revealInTree(clickedElement);
        
        toggleInspector();
    }

    // --- LÓGICA DA ABA DE ACESSIBILIDADE (Mesma lógica da versão anterior) ---
    const createAxeResultBlock = (item, type) => {
        const colors = {
            violation: 'border-red-500 bg-red-900/20',
            incomplete: 'border-yellow-500 bg-yellow-900/20',
            pass: 'border-green-500 bg-green-900/20'
        };
        const impactColors = {
            critical: 'text-red-400',
            serious: 'text-orange-400',
            moderate: 'text-yellow-400',
            minor: 'text-blue-400',
            info: 'text-gray-400'
        };

        const impact = item.impact || 'info';
        const impactText = impact.charAt(0).toUpperCase() + impact.slice(1);

        return `
            <div class="p-2 my-1 rounded-md ${colors[type]} border-l-4">
                <div class="flex justify-between items-center mb-1">
                    <p class="font-semibold text-sm">${item.help}</p>
                    <span class="text-xs font-bold uppercase px-2 py-1 rounded ${impactColors[impact]}">${impactText}</span>
                </div>
                <p class="text-xs text-gray-400 mb-2">${item.description}</p>
                <a href="${item.helpUrl}" target="_blank" rel="noopener noreferrer" class="text-xs text-sky-400 hover:underline">Saiba mais</a>
            </div>
        `;
    };

    async function runAxeAudit() {
        const resultsContainer = document.getElementById("accessibility-results");
        if(!resultsContainer) return;
        resultsContainer.innerHTML = "<p>Analisando...</p>";
        try {
            if (typeof axe === 'undefined') {
                throw new Error("Biblioteca Axe não carregou. Verifique o console para erros de rede.");
            }
            const results = await axe.run({ exclude: [['#dev-panel', '#dev-tools-trigger']] });
            resultsContainer.innerHTML = ''; 

            let html = `
                <div class="p-1 mb-3 bg-gray-800 rounded-md text-center text-xs">
                    Resultados para ${results.violations.length} violações, ${results.incomplete.length} revisões, ${results.passes.length} aprovações.
                </div>
            `;

            if (results.violations.length > 0) {
                html += '<h4 class="text-base font-bold text-red-400 mb-2">Violações Críticas/Sérias</h4>';
                html += results.violations.map(v => createAxeResultBlock(v, 'violation')).join('');
            }
            if (results.incomplete.length > 0) {
                html += '<h4 class="text-base font-bold text-yellow-400 mt-4 mb-2">Itens para Revisão Manual</h4>';
                html += results.incomplete.map(i => createAxeResultBlock(i, 'incomplete')).join('');
            }
            if (results.passes.length > 0) {
                html += '<h4 class="text-base font-bold text-green-400 mt-4 mb-2">Testes Aprovados</h4>';
                html += results.passes.map(p => createAxeResultBlock(p, 'pass')).join('');
            }
            if (results.violations.length === 0 && results.incomplete.length === 0) {
                 resultsContainer.insertAdjacentHTML("afterbegin", '<p class="text-green-400 font-bold text-center mb-4">Parabéns! Nenhum problema de acessibilidade encontrado.</p>');
            }

            resultsContainer.innerHTML = html;
        } catch (err) {
            resultsContainer.innerHTML = `<p class="text-red-500">${err.message}</p>`;
        }
    }

    // --- LÓGICA DA ABA DE TESTES (Mesma lógica da versão anterior) ---
    const renderDiagnosticItem = (item, isGlobal = false) => {
        const severityMap = {
            critical: { color: 'red', icon: 'error' },
            serious: { color: 'orange', icon: 'warning' },
            moderate: { color: 'yellow', icon: 'priority_high' },
            review: { color: 'sky', icon: 'help' },
            disponibilidade: { color: 'red', icon: 'cloud_off'}
        };
        const sev = item.severity.toLowerCase();
        const type = item.type.toLowerCase();
        const currentSeverity = severityMap[sev] || severityMap[type] || { color: 'gray', icon: 'info' };

        return `
            <div class="border-l-4 border-${currentSeverity.color}-500 bg-${currentSeverity.color}-900/20 p-3 rounded-r-md mb-2">
                <div class="flex justify-between items-center mb-1">
                    <p class="font-semibold text-sm text-${currentSeverity.color}-300 flex items-center gap-2">
                        <span class="material-symbols-outlined text-base">${currentSeverity.icon}</span>
                        ${item.type} (${sev})
                    </p>
                    ${isGlobal ? `<p class="text-xs font-mono bg-gray-800 px-2 py-1 rounded">${item.page}</p>` : ''}
                </div>
                <p class="text-xs text-gray-300 mb-2">${item.description}</p>
                <p class="text-xs font-mono text-gray-500 truncate" title="${item.selector || 'N/A'}">Seletor: ${item.selector || 'N/A'}</p>
            </div>
        `;
    };
    
    async function loadAndRenderDiagnostics() {
        const diagnosticsContainer = document.getElementById('diagnostics-results');
        if (!diagnosticsContainer) return;

        diagnosticsContainer.innerHTML = '<p class="text-center text-gray-400">Carregando relatório de diagnóstico...</p>';
        
        try {
            const response = await fetch(`${baseUrl}diagnostics.json?cache_bust=${Date.now()}`);
            if (!response.ok) throw new Error(`Não foi possível carregar o relatório (Status: ${response.status}).`);
            
            const allDiagnostics = await response.json();
            const currentPagePath = window.location.pathname.replace(baseUrl, '') || '/';
            
            const currentPageIssues = allDiagnostics.filter(item => item.page === currentPagePath);
            const globalIssues = allDiagnostics.filter(item => item.page !== currentPagePath);

            let html = '';

            // Renderiza problemas da página atual
            html += '<div><h3 class="font-bold mb-3 text-lg text-sky-400">Página Atual</h3>';
            if (currentPageIssues.length > 0) {
                html += currentPageIssues.map(item => renderDiagnosticItem(item, false)).join('');
            } else {
                html += '<p class="text-sm text-green-400 p-3 bg-green-900/20 rounded-md">Nenhum problema específico encontrado nesta página.</p>';
            }
            html += '</div>';

            // Renderiza problemas do site global
            html += '<div class="mt-6"><h3 class="font-bold mb-3 text-lg text-sky-400">Site Global</h3>';
            if (globalIssues.length > 0) {
                html += globalIssues.map(item => renderDiagnosticItem(item, true)).join('');
            } else {
                html += '<p class="text-sm text-green-400 p-3 bg-green-900/20 rounded-md">Nenhum problema encontrado nas outras páginas do site.</p>';
            }
            html += '</div>';
            
            diagnosticsContainer.innerHTML = html;

        } catch (err) {
            diagnosticsContainer.innerHTML = `<p class="text-red-400 p-3 bg-red-900/20 rounded-md">Ocorreu um erro ao carregar o relatório de diagnóstico: ${err.message}</p>`;
        }
    }
});
