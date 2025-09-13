// docs/js/dev-panel-features.js

// Cria um objeto global para armazenar as funções das abas.
window.DevPanelFeatures = {};

/**
 * ABA DE AUDITORIA
 * Contém a lógica para escanear todas as páginas do site.
 */
DevPanelFeatures.renderAuditoriaTab = function(panelContent, baseUrl) {
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

    document.getElementById('run-global-audit').addEventListener('click', () => DevPanelFeatures.runGlobalAudit(baseUrl));
};

DevPanelFeatures.runGlobalAudit = async function(baseUrl) {
    const resultsContainer = document.getElementById('audit-results');
    const runButton = document.getElementById('run-global-audit');
    const copyButton = document.getElementById('copy-audit-report');
    
    runButton.disabled = true;
    runButton.textContent = 'Executando...';
    copyButton.classList.add('hidden');
    resultsContainer.innerHTML = '<div class="p-4 text-center text-gray-400">Iniciando auditoria...</div>';

    const pagesToScan = ['index.html', 'algoritmos.html', 'estruturas-de-dados.html', 'search.html', 'status.html'];
    
    try {
        const response = await fetch(`${baseUrl}search.json`);
        if (response.ok) {
            const posts = await response.json();
            posts.forEach(post => pagesToScan.push(post.url.replace(baseUrl, '')));
        }
    } catch(e) { console.warn("Não foi possível carregar a lista de posts de search.json."); }

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
        
        const pageResults = await DevPanelFeatures.analyzePageInIframe(iframe, url);
        
        const resultHTML = document.createElement('details');
        resultHTML.className = 'bg-gray-900 border border-gray-700 rounded-md mb-2';
        
        const summary = document.createElement('summary');
        summary.className = 'p-2 cursor-pointer flex justify-between items-center';
        const errorCount = pageResults.accessibility.length + pageResults.jsErrors.length + pageResults.missingAlts.length;
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
};

DevPanelFeatures.analyzePageInIframe = function(iframe, url) {
    return new Promise(resolve => {
        let results = {
            accessibility: [], jsErrors: [], missingAlts: [],
            text: `--- PÁGINA: ${url} ---\n\n`, html: ''
        };
        
        const timeout = setTimeout(() => {
            iframe.removeEventListener('load', onIframeLoad);
            results.jsErrors.push({ message: `Timeout: A página ${url} demorou muito para carregar.`});
            formatAndResolve();
        }, 10000);

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
        iframe.contentWindow.onerror = (message) => { results.jsErrors.push({ message }); return true; };
        iframe.src = url;
    });
};


/**
 * ABA DE ELEMENTOS
 * Contém a lógica para inspecionar o DOM.
 */
DevPanelFeatures.renderElementsTab = function(panelContent, state, helpers) {
    panelContent.innerHTML = `
        <div id="elements-tree-container" class="w-1/2 overflow-auto p-2 border-r border-gray-700"></div>
        <div id="styles-container" class="w-1/2 overflow-auto p-2">
            <div class="flex items-center gap-2 mb-2">
                <button id="inspector-toggle" class="p-1 rounded hover:bg-gray-700" title="Inspecionar"><span class="material-symbols-outlined">ads_click</span></button>
                <h3 class="font-bold">Computed Styles</h3>
            </div>
            <div id="computed-styles-container">Clique em um elemento para ver os estilos.</div>
        </div>`;
    document.getElementById("elements-tree-container").appendChild(helpers.buildElementsTree(document.documentElement, state, helpers));
    document.getElementById("inspector-toggle").addEventListener("click", () => helpers.toggleInspector(state, helpers));
};


/**
 * ABA DE CONSOLE
 */
DevPanelFeatures.renderConsoleTab = function(panelContent, helpers) {
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
                    helpers.logToPanel({ type: "log", args: [`> ${command}`] });
                    try {
                        const result = eval(command);
                        if (result !== undefined) helpers.logToPanel({ type: "info", args: [result] });
                    } catch (error) {
                        helpers.logToPanel({ type: "error", args: [error.toString()] });
                    }
                }
            }
        });
        consoleInput.addEventListener('input', () => {
            consoleInput.style.height = 'auto';
            consoleInput.style.height = `${consoleInput.scrollHeight}px`;
        });
    }
};


/**
 * ABA DE STORAGE
 */
DevPanelFeatures.renderStorageTab = function(panelContent) {
    let tableRows = "";
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        tableRows += `<tr class='border-b border-gray-800'><td class='p-2 align-top text-orange-400'>${key}</td><td class='p-2 align-top text-green-400 whitespace-pre-wrap break-all'>${value}</td></tr>`;
    }
    panelContent.innerHTML = `<div class="p-2 w-full"><h3 class="font-bold text-lg mb-2">Local Storage</h3><table class="w-full text-left text-xs"><thead><tr class="border-b border-gray-700"><th class="p-2 w-1/4">Key</th><th class="p-2">Value</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
};


/**
 * ABA DE TESTES
 */
DevPanelFeatures.renderTestesTab = function(panelContent, baseUrl) {
    panelContent.innerHTML = `<div class="p-4 w-full"><button id="run-diagnostics" class="dev-button">Rodar Diagnóstico da Página Atual</button><div id="test-results" class="mt-4"></div></div>`;
    document.getElementById("run-diagnostics")?.addEventListener("click", () => DevPanelFeatures.runComprehensiveDiagnostics(baseUrl));
};

DevPanelFeatures.runComprehensiveDiagnostics = async function(baseUrl) {
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
            addResult("Validação de `search.json`", data.length > 0 ? "PASS" : "FAIL", data.length > 0 ? "Arquivo contém dados." : "Arquivo vazio.");
        } else {
            addResult("Validação de `search.json`", "FAIL", `Não encontrado (Status: ${response.status}).`);
        }
    } catch (e) { addResult("Validação de `search.json`", "FAIL", "Não é um JSON válido."); }
};


/**
 * ABA DE INFO
 */
DevPanelFeatures.renderInfoTab = function(panelContent, devPanelVersion) {
    const buildTimeMeta = document.querySelector('meta[name="jekyll-build-time"]');
    const buildTime = buildTimeMeta ? new Date(buildTimeMeta.content).toLocaleString("pt-BR") : 'Não encontrado';
    panelContent.innerHTML = `
        <div class="p-4 w-full">
            <table class='w-full text-left'><tbody>
                <tr class='border-b border-gray-800'><td class='p-2 font-bold text-sky-400'>Versão do Painel</td><td class='p-2'>${devPanelVersion}</td></tr>
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
};
