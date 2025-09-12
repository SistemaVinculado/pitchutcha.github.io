/**
 * @file ui.js
 * @description Responsável por criar a interface do Dev Panel,
 * injetá-la no DOM e exportar as referências dos elementos.
 */

// 1. Define o HTML do painel e do botão
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

// 2. Injeta o HTML no corpo da página
const panelWrapper = document.createElement("div");
panelWrapper.innerHTML = panelHTML;
document.body.appendChild(panelWrapper);

// 3. Exporta as referências dos elementos para que main.js possa usá-los
export const triggerButton = document.getElementById("dev-tools-trigger");
export const devPanel = document.getElementById("dev-panel");
export const closeButton = document.getElementById("close-dev-panel");
export const panelContent = document.getElementById("dev-panel-content");
export const consoleInputContainer = document.getElementById("console-input-container");
export const devTabs = document.querySelectorAll(".dev-tab");
