// docs/js/dev-panel.js

document.addEventListener("DOMContentLoaded", () => {
    // Evita que o painel seja executado em iframes
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

    // Estrutura HTML do Painel com todas as abas restauradas
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
                        <button data-tab="acessibilidade" class="dev-tab">Acessibilidade</button>
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

    const triggerButton = document.getElementById("dev-tools-trigger");
    const devPanel = document.getElementById("dev-panel");
    const closeButton = document.getElementById("close-dev-panel");
    const panelContent = document.getElementById("dev-panel-content");
    const consoleInputContainer = document.getElementById("console-input-container");
    const devTabs = document.querySelectorAll(".dev-tab");

    let isInspecting = false; // Estado do inspetor de elementos

    triggerButton.addEventListener("click", () => {
        devPanel.classList.toggle("hidden");
        // Se abriu e nenhuma aba está ativa, ativa a primeira
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

    function capitalize(s) {
        if (typeof s !== 'string') return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function renderTabContent(tabId) {
        panelContent.innerHTML = ""; 
        consoleInputContainer.style.display = (tabId === "console") ? "flex" : "none";
        
        const featureFunctionName = `render${capitalize(tabId)}Tab`;
        
        // Verifica se o objeto de features e a função específica existem
        if (window.DevPanelFeatures && typeof window.DevPanelFeatures[featureFunctionName] === 'function') {
            // Chama a função correspondente do arquivo dev-panel-features.js
            window.DevPanelFeatures[featureFunctionName](panelContent, baseUrl, DEV_PANEL_VERSION);
        } else {
            panelContent.innerHTML = `<div class="p-4">Funcionalidade da aba '${tabId}' não encontrada.</div>`;
        }
    }
});
