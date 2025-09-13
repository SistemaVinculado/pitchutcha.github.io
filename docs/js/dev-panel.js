// docs/js/dev-panel.js (Versão 1.9.0 - Com gancho para Auditor)

document.addEventListener("DOMContentLoaded", () => {
    if (window.self !== window.top) return;

    const DEV_PANEL_VERSION = "1.9.0";
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

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
                        <button data-tab="auditoria" class="dev-tab">Auditoria</button>
                        <button data-tab="elements" class="dev-tab">Elements</button>
                        <button data-tab="console" class="dev-tab">Console</button>
                        <button data-tab="storage" class="dev-tab">Storage</button>
                        <button data-tab="network" class="dev-tab">Network</button>
                        <button data-tab="recursos" class="dev-tab">Recursos</button>
                        <button data-tab="info" class="dev-tab">Info</button>
                    </nav>
                </div>
                <button id="close-dev-panel" class="p-2 rounded-full hover:bg-gray-700"><span class="material-symbols-outlined">close</span></button>
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

    const logToPanel = (log) => {
        const consoleOutput = document.getElementById("console-output");
        if (!consoleOutput) return;
        let color = "text-white";
        if (log.type === "error") color = "text-red-400";
        if (log.type === "warn") color = "text-yellow-400";
        if (log.type === "info") color = "text-sky-400";
        const item = document.createElement("div");
        item.className = `py-1 px-2 border-b border-gray-800 flex gap-2 ${color}`;
        let contentText = log.args.map(arg => {
            if (arg instanceof Error) return arg.stack || arg.message;
            if (typeof arg === "string") return arg;
            try { return JSON.stringify(arg, null, 2); } catch (e) { return "[Não foi possível serializar o objeto]" }
        }).join(" ");
        item.innerHTML = `<span class="opacity-50">${new Date().toLocaleTimeString()}</span><pre class="flex-1 whitespace-pre-wrap">${contentText}</pre>`;
        consoleOutput.appendChild(item);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    };

    ["log", "warn", "error", "info"].forEach(type => {
        const original = console[type];
        console[type] = (...args) => {
            original.apply(console, args);
            if (devPanel && !devPanel.classList.contains('hidden') && document.getElementById('console-output')) {
                logToPanel({ type, args });
            }
        };
    });

    const highlightOnPage = (element) => {
        if (lastInspectedElement) lastInspectedElement.style.outline = '';
        if (element && typeof element.style !== 'undefined' && !element.closest('#dev-panel')) {
            element.style.outline = '2px solid #0ea5e9';
            lastInspectedElement = element;
        }
    };
    
    const displayComputedStyles = (element) => {
        const container = document.getElementById("computed-styles-container");
        if (!container || !element) return;
        const styles = window.getComputedStyle(element);
        let tableHTML = "<table class='w-full text-left text-xs'>";
        Array.from(styles).forEach(prop => {
            tableHTML += `<tr class='border-b border-gray-800'><td class='p-1 text-pink-400'>${prop}</td><td class='p-1 text-cyan-400 break-all'>${styles.getPropertyValue(prop)}</td></tr>`;
        });
        tableHTML += "</table>";
        container.innerHTML = tableHTML;
    };

    const highlightInTree = (element) => {
        if (lastSelectedTreeNode) lastSelectedTreeNode.style.backgroundColor = '';
        const treeNode = domElementToTreeNode.get(element);
        if (treeNode) {
            treeNode.style.backgroundColor = 'rgba(14, 165, 233, 0.3)';
            lastSelectedTreeNode = treeNode;
        }
    };

    const selectElement = (element) => {
        highlightOnPage(element);
        highlightInTree(element);
        displayComputedStyles(element);
    };

    const revealInTree = (element) => {
        let current = element;
        while (current && current !== document.body) {
            const treeNode = domElementToTreeNode.get(current);
            if (treeNode) {
                const childrenContainer = treeNode.parentElement.querySelector('.element-children');
                if (childrenContainer && childrenContainer.classList.contains('hidden')) {
                    childrenContainer.classList.remove('hidden');
                    const icon = treeNode.querySelector('.expand-icon');
                    if (icon) icon.textContent = 'arrow_drop_down';
                }
            }
            current = current.parentElement;
        }
        const finalNode = domElementToTreeNode.get(element);
        if (finalNode) finalNode.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };

    const buildElementsTree = (element, depth = 0) => {
        if (!element.tagName || element.closest('#dev-panel')) return null;
        const nodeWrapper = document.createElement('div');
        const nodeHeader = document.createElement('div');
        nodeHeader.className = 'element-node-header flex items-center cursor-pointer hover:bg-gray-800 rounded p-0.5';
        nodeHeader.style.paddingLeft = `${depth}rem`;
        domElementToTreeNode.set(element, nodeHeader);

        const attributes = Array.from(element.attributes).map(attr => `<span class="text-orange-400">${attr.name}</span>="<span class="text-green-400">${attr.value}</span>"`).join(" ");
        const hasChildren = element.children.length > 0;
        const arrow = hasChildren ? `<span class="material-symbols-outlined text-sm expand-icon">arrow_right</span>` : `<span class='w-4 inline-block'></span>`;
        nodeHeader.innerHTML = `${arrow}<span class='text-gray-500'>&lt;</span><span class='text-pink-400'>${element.tagName.toLowerCase()}</span> ${attributes}<span class='text-gray-500'>&gt;</span>`;
        
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
                const childNode = buildElementsTree(child, depth + 1);
                if (childNode) childrenContainer.appendChild(childNode);
            }
        }
        return nodeWrapper;
    };
    
    const toggleInspector = () => {
        isInspecting = !isInspecting;
        const button = document.getElementById('inspector-toggle');
        if (button) {
            button.style.backgroundColor = isInspecting ? '#0ea5e9' : 'transparent';
            button.style.color = isInspecting ? 'white' : '';
        }
        document.body.style.cursor = isInspecting ? 'crosshair' : 'default';

        const clickHandler = (e) => {
            if (!isInspecting || e.target.closest("#dev-panel")) return;
            e.preventDefault(); e.stopPropagation();
            selectElement(e.target);
            revealInTree(e.target);
            toggleInspector();
        };

        const mouseoverHandler = (e) => { if (isInspecting) highlightOnPage(e.target); };

        if (isInspecting) {
            document.addEventListener('mouseover', mouseoverHandler);
            document.addEventListener('click', clickHandler, { capture: true });
        } else {
            document.removeEventListener('mouseover', mouseoverHandler);
            document.removeEventListener('click', clickHandler, { capture: true });
            if (lastInspectedElement) lastInspectedElement.style.outline = '';
        }
    };
    
    const tabRenderers = {
        renderElementsTab: function() {
            panelContent.innerHTML = `
                <div id="elements-tree-container" class="w-1/2 overflow-auto p-2 border-r border-gray-700"></div>
                <div id="styles-container" class="w-1/2 overflow-auto p-2">
                    <div class="flex items-center gap-2 mb-2">
                        <button id="inspector-toggle" class="p-1 rounded hover:bg-gray-700" title="Inspecionar"><span class="material-symbols-outlined">ads_click</span></button>
                        <h3 class="font-bold">Computed Styles</h3>
                    </div>
                    <div id="computed-styles-container">Clique em um elemento na página ou na árvore para ver os estilos.</div>
                </div>`;
            const treeContainer = document.getElementById("elements-tree-container");
            treeContainer.innerHTML = '';
            treeContainer.appendChild(buildElementsTree(document.documentElement));
            document.getElementById("inspector-toggle").addEventListener("click", toggleInspector);
        },
        renderConsoleTab: function() {
            panelContent.innerHTML = '<div id="console-output" class="flex-1 overflow-y-auto p-2 relative"></div>';
            const consoleInput = document.getElementById("console-input");
            if (consoleInput) {
                consoleInput.addEventListener("keydown", e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault(); 
                        const command = consoleInput.value;
                        if (command) {
                            consoleInput.value = "";
                            logToPanel({ type: "log", args: [`> ${command}`] });
                            try {
                                const result = window.eval(command);
                                if (result !== undefined) logToPanel({ type: "info", args: [result] });
                            } catch (error) {
                                logToPanel({ type: "error", args: [error] });
                            }
                        }
                    }
                });
            }
        },
        renderStorageTab: function() {
            let tableRows = "";
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                tableRows += `<tr class='border-b border-gray-800'><td class='p-2 align-top text-orange-400'>${key}</td><td class='p-2 align-top text-green-400 whitespace-pre-wrap break-all'>${value}</td></tr>`;
            }
            panelContent.innerHTML = `<div class="p-2 w-full"><h3 class="font-bold text-lg mb-2">Local Storage</h3><table class="w-full text-left text-xs"><thead><tr class="border-b border-gray-700"><th class="p-2 w-1/4">Key</th><th class="p-2">Value</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
        },
        renderNetworkTab: function() {
            const nav = performance.getEntriesByType("navigation")[0];
            if(!nav) { panelContent.innerHTML = `<div class="p-4">Informação de Network não disponível.</div>`; return; };
            panelContent.innerHTML = `<div class="p-4 w-full"><table class='w-full text-left'><tbody><tr class='border-b border-gray-800'><td class='p-2 font-bold'>Carregamento Total</td><td class='p-2'>${nav.duration.toFixed(0)} ms</td></tr><tr class='border-b border-gray-800'><td class='p-2'>DNS</td><td class='p-2'>${(nav.domainLookupEnd - nav.domainLookupStart).toFixed(0)} ms</td></tr><tr class='border-b border-gray-800'><td class='p-2'>Conexão TCP</td><td class='p-2'>${(nav.connectEnd - nav.connectStart).toFixed(0)} ms</td></tr><tr class='border-b border-gray-800'><td class='p-2'>TTFB</td><td class='p-2'>${(nav.responseStart - nav.requestStart).toFixed(0)} ms</td></tr></tbody></table></div>`;
        },
        renderRecursosTab: function() {
            const resources = performance.getEntriesByType("resource");
            let tableRows = "";
            resources.forEach(r => { tableRows += `<tr class='border-b border-gray-800'><td class='p-2 truncate max-w-xs'>${r.name.split("/").pop()}</td><td class='p-2'>${r.initiatorType}</td><td class='p-2'>${(r.transferSize / 1024).toFixed(2)} KB</td><td class='p-2'>${r.duration.toFixed(0)} ms</td></tr>`; });
            panelContent.innerHTML = `<div class="p-4 w-full"><table class='w-full text-left'><thead><tr class="border-b border-gray-700"><th class='p-2'>Nome</th><th class='p-2'>Tipo</th><th class='p-2'>Tamanho</th><th class='p-2'>Tempo</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
        },
        renderInfoTab: function() {
            const buildTimeMeta = document.querySelector('meta[name="jekyll-build-time"]');
            const buildTime = buildTimeMeta ? new Date(buildTimeMeta.content).toLocaleString("pt-BR") : 'Não encontrado';
            panelContent.innerHTML = `
                <div class="p-4 w-full">
                    <table class='w-full text-left'><tbody>
                        <tr class='border-b border-gray-800'><td class='p-2 font-bold text-sky-400'>Versão do Painel</td><td class='p-2'>${DEV_PANEL_VERSION}</td></tr>
                        <tr class='border-b border-gray-800'><td class='p-2 font-bold text-sky-400'>Hora da Construção</td><td class='p-2'>${buildTime}</td></tr>
                        <tr class='border-b border-gray-800'><td class='p-2 font-bold'>User Agent</td><td class='p-2'>${navigator.userAgent}</td></tr>
                        <tr class='border-b border-gray-800'><td class='p-2 font-bold'>Viewport</td><td class='p-2'>${window.innerWidth}px x ${window.innerHeight}px</td></tr>
                        <tr class='border-b border-gray-800'><td class='p-2 font-bold'>Plataforma</td><td class='p-2'>${navigator.platform}</td></tr>
                        <tr class='border-b border-gray-800'><td class='p-2 font-bold'>Linguagem</td><td class='p-2'>${navigator.language}</td></tr>
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
                tabSizeSelect.value = localStorage.getItem('tabSizePreference') || '4';
                tabSizeSelect.addEventListener('change', (e) => {
                    document.documentElement.style.setProperty('--tab-size-preference', e.target.value);
                    localStorage.setItem('tabSizePreference', e.target.value);
                });
            }
        },
    };

    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    function renderTabContent(tabId) {
        panelContent.innerHTML = "";
        consoleInputContainer.style.display = (tabId === "console") ? "flex" : "none";
        if (isInspecting) toggleInspector();

        // AQUI ESTÁ A CONEXÃO COM O NOVO ARQUIVO
        if (tabId === 'auditoria') {
            if (window.DevPanelAuditor) {
                window.DevPanelAuditor.initialize(panelContent, baseUrl);
            } else {
                panelContent.innerHTML = `<div class="p-4">Erro: Módulo de Auditoria não carregado.</div>`;
            }
            return;
        }

        const rendererName = `render${capitalize(tabId)}Tab`;
        const renderer = tabRenderers[rendererName];

        if (renderer) {
            renderer();
        } else {
            console.error(`Render function for tab '${tabId}' not found.`);
            panelContent.innerHTML = `<div class="p-4">Erro: Função para renderizar a aba '${tabId}' não encontrada.</div>`;
        }
    }

    triggerButton.addEventListener("click", () => {
        devPanel.classList.toggle("hidden");
        if (!devPanel.classList.contains("hidden") && !document.querySelector('.dev-tab.active-tab')) {
            const firstTab = devTabs[0];
            firstTab.classList.add('active-tab');
            renderTabContent(firstTab.dataset.tab);
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
});
