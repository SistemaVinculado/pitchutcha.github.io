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
                    <nav class="flex gap-1 overflow-x-auto whitespace-rap">
                        <button data-tab="elements" class="dev-tab active-tab">Elements</button>
                        <button data-tab="console" class="dev-tab">Console</button>
                        <button data-tab="storage" class="dev-tab">Storage</button>
                        <button data-tab="testes" class="dev-tab">Testes</button>
                        <button data-tab="acessibilidade" class="dev-tab">Acessibilidade</button>
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

    // Expor estado para diagnóstico
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
        if (isInspecting) toggleInspector();
        
        switch (tabId) {
            case "elements": renderElementsTab(); break;
            case "console": renderConsoleTab(); break;
            case "storage": renderStorageTab(); break;
            case "testes": renderTestesTab(); break;
            case "acessibilidade": renderAcessibilidadeTab(); break;
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
        elementsContainer.appendChild(buildElementsTree(document.documentElement));
        document.getElementById("inspector-toggle").addEventListener("click", toggleInspector);
    }
    
    function renderConsoleTab() { panelContent.innerHTML = '<div id="console-output" class="flex-1 overflow-y-auto p-2"></div>'; }
    function renderStorageTab() {
        let tableRows = "";
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            tableRows += `<tr class='border-b border-gray-800'><td class='p-2 text-orange-400'>${key}</td><td class='p-2 text-green-400'>${value}</td></tr>`;
        }
        panelContent.innerHTML = `<div class="p-2 w-full"><h3 class="font-bold text-lg mb-2">Local Storage</h3><table class="w-full text-left text-xs"><thead><tr class="border-b border-gray-700"><th class="p-2 w-1/4">Key</th><th class="p-2">Value</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
    }
    
    function renderAcessibilidadeTab() {
        panelContent.innerHTML = '<div class="p-4"><button id="run-axe" class="dev-button">Rodar Análise de Acessibilidade</button><div id="axe-results" class="mt-4"></div></div>';
        document.getElementById("run-axe").addEventListener("click", runAxeAudit);
    }
    
    function renderTestesTab() {
        panelContent.innerHTML = `<div class="p-4 w-full"><button id="run-diagnostics" class="dev-button">Rodar Diagnóstico Completo do Sistema</button><div id="test-results" class="mt-4"></div></div>`;
        document.getElementById("run-diagnostics").addEventListener("click", runComprehensiveDiagnostics);
    }

    // --- Lógica da Aba "Elements" ---
    function buildElementsTree(rootElement) {
        const treeContainer = document.createElement('div');
        function createNode(element, depth) {
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
                    childrenContainer.appendChild(createNode(child, depth + 1));
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
            window.devPanelState.listeners['click'] = selectElementOnPage;
            document.addEventListener('click', window.devPanelState.listeners['click'], { capture: true });
        } else {
            document.removeEventListener('mouseover', highlightElementOnPage);
            document.removeEventListener('click', window.devPanelState.listeners['click'], { capture: true });
            delete window.devPanelState.listeners['click'];
            if(lastInspectedElement) lastInspectedElement.style.outline = '';
        }
    }
    
    function selectElementOnPage(e) {
        if (!isInspecting) return;
        e.preventDefault();
        e.stopPropagation();
        const clickedElement = e.target;
        selectElement(clickedElement);
        revealInTree(clickedElement);
        toggleInspector();
    }
    
    // --- Lógica de Diagnóstico ---
    async function runComprehensiveDiagnostics() {
        const resultsContainer = document.getElementById("test-results");
        resultsContainer.innerHTML = `
            <table class="w-full text-left text-xs">
                <thead>
                    <tr class="border-b border-gray-700">
                        <th class="p-2 w-1/3">Teste</th>
                        <th class="p-2 w-1/6">Resultado</th>
                        <th class="p-2">Detalhes / Solução Sugerida</th>
                    </tr>
                </thead>
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

        // Teste 1: Verificação de Elementos DOM Essenciais
        const trigger = document.getElementById('dev-tools-trigger');
        addResult('Elemento Trigger do Painel (#dev-tools-trigger)', !!trigger, trigger ? 'Elemento principal do painel foi encontrado no DOM.' : 'O elemento que ativa o painel não foi encontrado. Isso indica uma falha na injeção do HTML inicial do script. Verifique se há erros de console que impedem a execução do script.');
        
        // Teste 2: Verificação de Carregamento de Scripts
        let scriptLoaded = Array.from(document.scripts).some(s => s.src.includes('script.js'));
        addResult('Carregamento de `script.js`', scriptLoaded, scriptLoaded ? 'Tag <script> para script.js foi encontrada.' : 'Não foi encontrada a tag <script src="js/script.js">. Verifique se a tag está presente no final dos seus arquivos HTML.');

        // Teste 3: Lógica do Inspetor
        const inspectorButton = document.getElementById('inspector-toggle');
        if (inspectorButton) {
            const initialState = window.devPanelState.isInspecting();
            inspectorButton.click(); // Simula um clique para ligar
            const turnedOnState = window.devPanelState.isInspecting();
            inspectorButton.click(); // Simula um clique para desligar
            const turnedOffState = window.devPanelState.isInspecting();
            const pass = initialState === false && turnedOnState === true && turnedOffState === false;
            addResult('Lógica de Ativação do Inspetor', pass, pass ? 'O estado do inspetor (ligado/desligado) está a ser alterado corretamente.' : `Falha na lógica de estado. Estado inicial: ${initialState}, após 1º clique: ${turnedOnState}, após 2º clique: ${turnedOffState}. O problema está na função \`toggleInspector\`.`);
        } else {
             addResult('Lógica de Ativação do Inspetor', false, 'Botão do inspetor (#inspector-toggle) não foi encontrado para o teste.');
        }

        // Teste 4: Verificação do Listener de Clique do Inspetor
        if(inspectorButton) {
            inspectorButton.click(); // Liga o inspetor
            const listenerAttached = typeof window.devPanelState.listeners['click'] === 'function';
            addResult('Anexação do Listener de Clique do Inspetor', listenerAttached, listenerAttached ? 'O listener de clique foi anexado ao documento com sucesso.' : 'O listener de clique não foi anexado. O erro está na função `toggleInspector` que não está a adicionar o `EventListener`.');
            inspectorButton.click(); // Desliga o inspetor
        } else {
            addResult('Anexação do Listener de Clique do Inspetor', false, 'Botão do inspetor (#inspector-toggle) não foi encontrado para o teste.');
        }

        // Teste 5: Validade do JSON de Busca
        try {
            const response = await fetch('search.json');
            if (response.ok) {
                await response.json();
                addResult('Arquivo `search.json`', true, 'Arquivo encontrado e o seu conteúdo é um JSON válido.');
            } else {
                addResult('Arquivo `search.json`', false, `Arquivo não encontrado ou inacessível (Status: ${response.status}). Verifique o caminho e as permissões do arquivo.`);
            }
        } catch(e) {
            addResult('Arquivo `search.json`', false, 'Arquivo encontrado, mas o conteúdo não é um JSON válido. Verifique a sintaxe do arquivo.');
        }
    }
});
