document.addEventListener("DOMContentLoaded", () => {
    // Evita que o painel seja executado em iframes
    if (window.self !== window.top) {
        return;
    }

    // Carrega a biblioteca Axe para testes de acessibilidade
    const axeScript = document.createElement("script");
    axeScript.src = "js/vendor/axe.min.js";
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
                <input type="text" id="console-input" class="flex-1 bg-transparent border-none focus:outline-none ml-2" placeholder="Executar JavaScript...">
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

    window.devPanelState = {
        isInspecting: () => isInspecting,
        listeners: {}
    };

    triggerButton.addEventListener("click", () => {
        devPanel.classList.toggle("hidden");
        if (!devPanel.classList.contains("hidden")) {
            renderTabContent("elements");
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
        
        // Desativa o modo de inspeção se estiver ativo ao trocar de aba
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
            case "testes": renderTestesTab(); break;
            case "info": renderInfoTab(); break;
            default: panelContent.innerHTML = `<div class="p-4">Aba não encontrada: ${tabId}</div>`;
        }
    }

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
        panelContent.innerHTML = '<div id="console-output" class="flex-1 overflow-y-auto p-2"></div>';
        const consoleInput = document.getElementById("console-input");
        if(consoleInput) {
            consoleInput.addEventListener("keydown", e => {
                 if (e.key === "Enter" && consoleInput.value) {
                    const command = consoleInput.value;
                    consoleInput.value = "";
                    logToPanel({ type: "log", args: [`> ${command}`] });
                    try {
                        const result = new Function(`return ${command}`)();
                        logToPanel({ type: "info", args: [result] });
                    } catch (error) {
                        logToPanel({ type: "error", args: [error.toString()] });
                    }
                }
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
        if(!nav) return;
        panelContent.innerHTML = `<div class="p-4 w-full"><table class='w-full text-left'><tbody><tr class='border-b border-gray-800'><td class='p-2 font-bold'>Tempo Total de Carregamento</td><td class='p-2'>${nav.duration.toFixed(0)} ms</td></tr><tr class='border-b border-gray-800'><td class='p-2'>Lookup de DNS</td><td class='p-2'>${(nav.domainLookupEnd - nav.domainLookupStart).toFixed(0)} ms</td></tr><tr class='border-b border-gray-800'><td class='p-2'>Conexão TCP</td><td class='p-2'>${(nav.connectEnd - nav.connectStart).toFixed(0)} ms</td></tr><tr class='border-b border-gray-800'><td class='p-2'>Tempo até Primeiro Byte (TTFB)</td><td class='p-2'>${(nav.responseStart - nav.requestStart).toFixed(0)} ms</td></tr><tr class='border-b border-gray-800'><td class='p-2'>Download do Conteúdo</td><td class='p-2'>${(nav.responseEnd - nav.responseStart).toFixed(0)} ms</td></tr></tbody></table></div>`;
    }

    function renderRecursosTab() {
        const resources = performance.getEntriesByType("resource");
        let tableRows = "";
        resources.forEach(r => { tableRows += `<tr class='border-b border-gray-800'><td class='p-2 truncate max-w-xs'>${r.name.split("/").pop()}</td><td class='p-2'>${r.initiatorType}</td><td class='p-2'>${(r.transferSize / 1024).toFixed(2)}</td><td class='p-2'>${r.duration.toFixed(0)}</td></tr>`; });
        panelContent.innerHTML = `<div class="p-4 w-full"><table class='w-full text-left'><thead><tr class='border-b border-gray-700'><th class='p-2'>Nome</th><th class='p-2'>Tipo</th><th class='p-2'>Tamanho (KB)</th><th class='p-2'>Tempo (ms)</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
    }
    
    function renderAcessibilidadeTab() {
        panelContent.innerHTML = '<div class="p-4"><button id="run-axe" class="dev-button">Rodar Análise de Acessibilidade</button><div id="axe-results" class="mt-4"></div></div>';
        const runAxeButton = document.getElementById("run-axe");
        if(runAxeButton) {
            runAxeButton.addEventListener("click", runAxeAudit);
        }
    }
    
    function renderTestesTab() {
        panelContent.innerHTML = `<div class="p-4 w-full"><button id="run-diagnostics" class="dev-button">Rodar Diagnóstico Completo</button><div id="test-results" class="mt-4"></div></div>`;
        const runDiagnosticsButton = document.getElementById("run-diagnostics");
        if(runDiagnosticsButton) {
            runDiagnosticsButton.addEventListener("click", runComprehensiveDiagnostics);
        }
    }

    function renderInfoTab() {
        panelContent.innerHTML = `<div class="p-4 w-full"><table class='w-full text-left'><tbody><tr class='border-b border-gray-800'><td class='p-2 font-bold'>User Agent</td><td class='p-2'>${navigator.userAgent}</td></tr><tr class='border-b border-gray-800'><td class='p-2 font-bold'>Viewport</td><td class='p-2'>${window.innerWidth}px x ${window.innerHeight}px</td></tr><tr class='border-b border-gray-800'><td class='p-2 font-bold'>Plataforma</td><td class='p-2'>${navigator.platform}</td></tr><tr class='border-b border-gray-800'><td class='p-2 font-bold'>Linguagem</td><td class='p-2'>${navigator.language}</td></tr></tbody></table></div>`;
    }

    function logToPanel(log) {
        const consoleOutput = document.getElementById("console-output");
        if (!consoleOutput) return;
        let color = "text-white";
        if (log.type === "error") color = "text-red-400";
        if (log.type === "warn") color = "text-yellow-400";
        if (log.type === "info") color = "text-sky-400";
        const item = document.createElement("div");
        item.className = `console-log-item py-1 px-2 border-b border-gray-800 flex gap-2 ${color}`;
        item.innerHTML = `<span class="opacity-50">${new Date().toLocaleTimeString()}</span><div class="flex-1">${log.args.map(arg => typeof arg === "string" ? arg : JSON.stringify(arg, null, 2)).join(" ")}</div>`;
        consoleOutput.appendChild(item);
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
            // A linha que removia o contorno foi retirada daqui para corrigir o bug
        }
    }

    // CORREÇÃO: Lógica de seleção foi melhorada para não apagar o contorno.
    function selectElementOnPage(e) {
        if (!isInspecting || e.target.closest("#dev-panel")) return;
        e.preventDefault();
        e.stopPropagation();
        
        const clickedElement = e.target;
        
        // 1. Seleciona e destaca o elemento (o contorno azul é aplicado aqui)
        selectElement(clickedElement);
        revealInTree(clickedElement);
        
        // 2. Desativa o modo de inspeção manualmente sem chamar toggleInspector()
        isInspecting = false;
        const inspectorButton = document.getElementById('inspector-toggle');
        if (inspectorButton) {
            inspectorButton.style.backgroundColor = 'transparent';
            inspectorButton.style.color = '#9ca3af';
        }
        document.body.style.cursor = 'default';
        document.removeEventListener('mouseover', highlightOnPage);
        document.removeEventListener('click', selectElementOnPage, { capture: true });
    }

    async function runAxeAudit() {
        const resultsContainer = document.getElementById("axe-results");
        if(!resultsContainer) return;
        resultsContainer.innerHTML = "Analisando...";
        try {
            const results = await axe.run({ exclude: [['#dev-panel']] });
            resultsContainer.innerHTML = '';
            const { violations, incomplete, passes } = results;
            resultsContainer.insertAdjacentHTML("beforeend", `<h3 class="text-xl font-bold">Resultados (${violations.length} violações, ${incomplete.length} revisões, ${passes.length} passaram)</h3>`);
            if (violations.length > 0) {
                resultsContainer.insertAdjacentHTML("beforeend", '<h4 class="text-lg font-bold text-red-400 mt-4 mb-2">Violações Críticas/Sérias</h4>');
                violations.forEach(v => resultsContainer.insertAdjacentHTML("beforeend", `<div class="p-2 my-1 rounded-md bg-red-900 border border-red-700"><p class="font-bold">${v.help} (${v.impact})</p><p class="text-gray-400">${v.description}</p><a href="${v.helpUrl}" target="_blank" class="text-sky-400 hover:underline">Saiba mais</a></div>`));
            }
            if (incomplete.length > 0) {
                resultsContainer.insertAdjacentHTML("beforeend", '<h4 class="text-lg font-bold text-yellow-400 mt-4 mb-2">Itens para Revisão Manual</h4>');
                incomplete.forEach(i => resultsContainer.insertAdjacentHTML("beforeend", `<div class="p-2 my-1 rounded-md bg-yellow-900 border border-yellow-700"><p class="font-bold">${i.help} (${i.impact})</p><p class="text-gray-400">${i.description}</p><a href="${i.helpUrl}" target="_blank" class="text-sky-400 hover:underline">Saiba mais</a></div>`));
            }
            if (passes.length > 0) {
                resultsContainer.insertAdjacentHTML("beforeend", `<h4 class="text-lg font-bold text-green-400 mt-4 mb-2">Testes Aprovados (${passes.length})</h4>`);
                passes.forEach(p => resultsContainer.insertAdjacentHTML("beforeend", `<div class="p-2 my-1 rounded-md bg-green-900 border border-green-700"><p class="font-bold">${p.help}</p></div>`));
            }
            if (violations.length === 0 && incomplete.length === 0) {
                resultsContainer.insertAdjacentHTML("beforeend", '<p class="text-green-400 font-bold text-center mt-4">Parabéns! Nenhum problema de acessibilidade encontrado.</p>');
            }
        } catch (err) {
            resultsContainer.innerHTML = `<p class="text-red-500">${err.message}</p>`;
        }
    }

    async function runComprehensiveDiagnostics() {
        const resultsContainer = document.getElementById("test-results");
        if (!resultsContainer) return;
        resultsContainer.innerHTML = `
            <table class="w-full text-left text-xs">
                <thead><tr class="border-b border-gray-700"><th class="p-2 w-1/3">Teste</th><th class="p-2 w-1/6">Resultado</th><th class="p-2">Detalhes</th></tr></thead>
                <tbody></tbody>
            </table>`;
        const tbody = resultsContainer.querySelector("tbody");

        const addResult = (test, status, details) => {
            const statusColor = status ? 'text-green-400' : 'text-red-400';
            const statusIcon = status ? 'check_circle' : 'error';
            const row = `
                <tr class="border-b border-gray-800">
                    <td class="p-2 align-top">${test}</td>
                    <td class="p-2 align-top font-bold ${statusColor}"><span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">${statusIcon}</span> ${status ? 'PASS' : 'FAIL'}</span></td>
                    <td class="p-2 align-top text-gray-400">${details}</td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        };
        
        // CORREÇÃO: Garante que a aba de elementos seja renderizada antes do teste.
        renderElementsTab();

        const inspectorButton = document.getElementById('inspector-toggle');
        if (inspectorButton) {
            const initialState = window.devPanelState.isInspecting();
            toggleInspector();
            const turnedOnState = window.devPanelState.isInspecting();
            toggleInspector();
            const turnedOffState = window.devPanelState.isInspecting();
            const pass = initialState === false && turnedOnState === true && turnedOffState === false;
            addResult('Lógica de Ativação do Inspetor', pass, pass ? 'O estado do inspetor (ligado/desligado) está correto.' : `Falha na lógica de estado.`);
        } else {
             addResult('Lógica de Ativação do Inspetor', false, 'Botão do inspetor (#inspector-toggle) não foi encontrado.');
        }

        try {
            const response = await fetch('search.json');
            if (response.ok) {
                await response.json();
                addResult('Arquivo `search.json`', true, 'Arquivo encontrado e o JSON é válido.');
            } else {
                addResult('Arquivo `search.json`', false, `Arquivo não encontrado (Status: ${response.status}).`);
            }
        } catch(e) {
            addResult('Arquivo `search.json`', false, 'O conteúdo do arquivo não é um JSON válido.');
        }
    }
});
