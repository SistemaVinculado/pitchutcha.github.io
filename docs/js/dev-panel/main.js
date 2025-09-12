/**
 * @file main.js
 * @description Ponto de entrada e orquestrador principal do Dev Panel.
 * Conecta a UI com as funcionalidades e gerencia os eventos.
 */

// 1. Importa os elementos da interface do usuário
import {
    triggerButton,
    devPanel,
    closeButton,
    devTabs
} from './ui.js';

// 2. Importa as funções que renderizam o conteúdo de cada aba
import {
    renderElementsTab,
    renderConsoleTab,
    renderStorageTab,
    renderNetworkTab,
    renderRecursosTab,
    renderAcessibilidadeTab,
    renderTestesTab,
    renderInfoTab
} from './features.js';

// --- Lógica Principal de Eventos ---

// Abre e fecha o painel principal
triggerButton.addEventListener("click", () => {
    devPanel.classList.toggle("hidden");
    // Ao abrir, carrega a aba de elementos por padrão
    if (!devPanel.classList.contains("hidden")) {
        renderTabContent("elements");
    }
});

closeButton.addEventListener("click", () => devPanel.classList.add("hidden"));

// Gerencia a troca de abas
devTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        devTabs.forEach(t => t.classList.remove("active-tab"));
        tab.classList.add("active-tab");
        renderTabContent(tab.dataset.tab);
    });
});

// --- Roteador de Conteúdo ---

// Função central que decide qual conteúdo de aba renderizar
function renderTabContent(tabId) {
    switch (tabId) {
        case "elements": renderElementsTab(); break;
        case "console": renderConsoleTab(); break;
        case "storage": renderStorageTab(); break;
        case "network": renderNetworkTab(); break;
        case "recursos": renderRecursosTab(); break;
        case "acessibilidade": renderAcessibilidadeTab(); break;
        case "testes": renderTestesTab(); break;
        case "info": renderInfoTab(); break;
        default: 
            const panelContent = document.getElementById('dev-panel-content');
            if(panelContent) {
                panelContent.innerHTML = `<div class="p-4">Aba não encontrada: ${tabId}</div>`;
            }
    }
}
