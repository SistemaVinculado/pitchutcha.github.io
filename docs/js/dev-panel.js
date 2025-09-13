// docs/js/dev-panel.js

document.addEventListener("DOMContentLoaded", () => {
    if (window.self !== window.top) return;

    const DEV_PANEL_VERSION = "1.5.0";
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    // Aplica preferências salvas (como tab-size) assim que a página carrega
    const applySavedPreferences = () => {
        const savedTabSize = localStorage.getItem('tabSizePreference');
        if (savedTabSize) {
            document.documentElement.style.setProperty('--tab-size-preference', savedTabSize);
        }
    };
    applySavedPreferences();

    // Carrega a biblioteca Axe para testes de acessibilidade
    const axeScript = document.createElement("script");
    axeScript.src = `${baseUrl}js/vendor/axe.min.js`;
    axeScript.defer = true;
    document.head.appendChild(axeScript);

    // --- Estrutura HTML do Painel ---
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
                        <button data-tab="testes" class="dev-tab">Testes</button>
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

    // --- Seletores e Variáveis de Estado ---
    const triggerButton = document.getElementById("dev-tools-trigger");
    const devPanel = document.getElementById("dev-panel");
    const closeButton = document.getElementById("close-dev-panel");
    const panelContent = document.getElementById("dev-panel-content");
    const consoleInputContainer = document.getElementById("console-input-container");
    const devTabs = document.querySelectorAll(".dev-tab");
    
    // Objeto de estado para compartilhar entre os módulos
    let state = {
        isInspecting: false,
        lastInspectedElement: null,
        lastSelectedTreeNode: null,
        domElementToTreeNode: new WeakMap()
    };

    // --- Lógica Principal do Painel ---
    triggerButton.addEventListener("click", () => {
        devPanel.classList.toggle("hidden");
        if (!devPanel.classList.contains("hidden") && !document.querySelector('.dev-tab.active-tab')) {
            devTabs[0].classList.add('active-tab');
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
        if (state.isInspecting) helpers.toggleInspector(state, helpers);

        // Verifica se o objeto de features e a função específica existem
        if (window.DevPanelFeatures && typeof window.DevPanelFeatures[`render${capitalize(tabId)}Tab`] === 'function') {
            window.DevPanelFeatures[`render${capitalize(tabId)}Tab`](panelContent, baseUrl, state, helpers, DEV_PANEL_VERSION);
        } else {
            panelContent.innerHTML = `<div class="p-4">Funcionalidade da aba '${tabId}' não encontrada.</div>`;
        }
    }

    // --- Funções Auxiliares (Helpers) ---
    // Funções que são necessárias por múltiplos módulos ou que manipulam o estado principal.
    const helpers = {
        logToPanel: function(log) {
            const consoleOutput = document.getElementById("console-output");
            if (!consoleOutput) return;
            let color = "text-white";
            if (log.type === "error") color = "text-red-400";
            if (log.type === "warn") color = "text-yellow-400";
            if (log.type === "info") color = "text-sky-400";
            const item = document.createElement("div");
            item.className = `console-log-item group relative py-1 px-2 border-b border-gray-800 flex gap-2 ${color}`;
            let contentText = log.args.map(arg => typeof arg === "string" ? arg : JSON.stringify(arg, null, 2)).join(" ");
            item.innerHTML = `<span class="opacity-50">${new Date().toLocaleTimeString()}</span><div class="flex-1 whitespace-pre-wrap">${contentText}</div>`;
            consoleOutput.appendChild(item);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        },

        buildElementsTree: function(rootElement, state, helpers) {
            // ... (implementação completa movida para dev-panel-features.js)
            // Esta função agora está em DevPanelFeatures e é chamada por renderElementsTab
        },

        toggleInspector: function(state, helpers) {
             state.isInspecting = !state.isInspecting;
             const button = document.getElementById('inspector-toggle');
             if (button) button.style.backgroundColor = state.isInspecting ? '#0ea5e9' : 'transparent';
             document.body.style.cursor = state.isInspecting ? 'crosshair' : 'default';
             
             const eventHandler = (e) => helpers.selectElementOnPage(e, state, helpers);

             if (state.isInspecting) {
                 document.addEventListener('mouseover', (e) => helpers.highlightOnPage(e.target, state));
                 document.addEventListener('click', eventHandler, { capture: true });
             } else {
                 document.removeEventListener('mouseover', (e) => helpers.highlightOnPage(e.target, state));
                 document.removeEventListener('click', eventHandler, { capture: true });
                 if(state.lastInspectedElement) state.lastInspectedElement.style.outline = '';
             }
        },

        selectElementOnPage: function(e, state, helpers) {
            if (!state.isInspecting || e.target.closest("#dev-panel")) return;
            e.preventDefault();
            e.stopPropagation();
            // Lógica para selecionar o elemento (implementada dentro de dev-panel-features.js)
        }
    };

    // Sobrescreve o console para logar no painel
    ["log", "warn", "error", "info"].forEach(type => {
        const original = console[type];
        console[type] = (...args) => {
            original.apply(console, args);
            if (document.getElementById('dev-panel') && !document.getElementById('dev-panel').classList.contains('hidden')) {
                helpers.logToPanel({ type, args });
            }
        };
    });
    
    function capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
});
