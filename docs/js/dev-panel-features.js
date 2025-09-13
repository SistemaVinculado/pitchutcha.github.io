// docs/js/dev-panel-features.js

window.DevPanelFeatures = {};

/**
 * ABA DE AUDITORIA (AGORA COMPLETA)
 */
DevPanelFeatures.renderAuditoriaTab = function(panelContent, baseUrl) {
    panelContent.innerHTML = `
        <div class="p-4 w-full flex flex-col h-full">
            <div class="flex items-center justify-between mb-4 flex-shrink-0">
                <div>
                    <h3 class="font-bold text-lg">Auditoria Global do Site</h3>
                    <p class="text-sm text-gray-400">Executa testes de acessibilidade, links quebrados, SEO e mais em todas as páginas.</p>
                </div>
                <div id="audit-controls" class="flex items-center gap-2">
                    <button id="run-global-audit" class="dev-button bg-sky-600 hover:bg-sky-500 border-sky-500">Iniciar Auditoria Completa</button>
                    <button id="copy-audit-report" class="dev-button hidden">Copiar Relatório</button>
                </div>
            </div>
            <div id="audit-results" class="bg-gray-800 p-2 rounded-md flex-grow overflow-auto">
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
    resultsContainer.innerHTML = '';

    let pagesToScan = ['index.html', 'algoritmos.html', 'estruturas-de-dados.html', 'search.html', 'status.html'];
    try {
        const response = await fetch(`${baseUrl}search.json?v=${Date.now()}`);
        if (response.ok) {
            const posts = await response.json();
            posts.forEach(post => pagesToScan.push(post.url));
        }
    } catch(e) { console.warn("Não foi possível carregar a lista de posts de search.json.", e); }

    const uniquePages = [...new Set(pagesToScan)];
    let fullReportText = `Relatório de Auditoria Global - ${new Date().toLocaleString('pt-BR')}\nTotal de Páginas Analisadas: ${uniquePages.length}\n\n`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position: absolute; width: 1px; height: 1px; left: -9999px;';
    document.body.appendChild(iframe);

    for (let i = 0; i < uniquePages.length; i++) {
        let page = uniquePages[i];
        page = page.startsWith('/') ? page.substring(1) : page;
        const url = `${baseUrl}${page}`;

        const progressDiv = document.createElement('div');
        progressDiv.className = 'p-2 text-sky-400';
        progressDiv.textContent = `Analisando (${i+1}/${uniquePages.length}): ${page}...`;
        resultsContainer.appendChild(progressDiv);
        resultsContainer.scrollTop = resultsContainer.scrollHeight;
        
        const pageResults = await DevPanelFeatures.analyzePageInIframe(iframe, url, baseUrl);
        
        const resultHTML = document.createElement('details');
        resultHTML.className = 'bg-gray-900 border border-gray-700 rounded-md mb-2';
        
        const summary = document.createElement('summary');
        summary.className = 'p-2 cursor-pointer flex justify-between items-center';
        const errorCount = pageResults.accessibility.length + pageResults.jsErrors.length + pageResults.missingAlts.length + pageResults.brokenLinks.length + pageResults.seo.length;
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

DevPanelFeatures.analyzePageInIframe = function(iframe, url, baseUrl) {
    return new Promise(resolve => {
        let results = {
            accessibility: [], jsErrors: [], missingAlts: [], brokenLinks: [], seo: [],
            text: `--- PÁGINA: ${url} ---\n\n`, html: ''
        };
        
        const timeout = setTimeout(() => {
            iframe.onload = null;
            results.jsErrors.push({ message: `Timeout: A página ${url} demorou muito para carregar.`});
            formatAndResolve();
        }, 15000);

        const onIframeLoad = async () => {
            clearTimeout(timeout);
            const doc = iframe.contentDocument;
            try {
                if (typeof axe !== 'undefined') {
                    const axeResults = await axe.run(doc.body, {resultTypes: ['violations', 'incomplete']});
                    results.accessibility = axeResults.violations;
                }
                
                doc.querySelectorAll('img:not([alt])').forEach(img => results.missingAlts.push({ src: img.src }));
                
                if (!doc.querySelector('title') || doc.querySelector('title').innerText.trim() === '') results.seo.push({ issue: 'A tag <title> está vazia ou ausente.' });
                if (!doc.querySelector('meta[name="description"]')) results.seo.push({ issue: 'A tag <meta name="description"> está ausente.' });
                
                const links = Array.from(doc.querySelectorAll('a[href]'));
                for (const link of links) {
                    const href = link.getAttribute('href');
                    if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                        const absoluteUrl = new URL(href, url).href;
                        if (absoluteUrl.startsWith(window.location.origin)) { // Check only internal links
                            try {
                                const response = await fetch(absoluteUrl, { method: 'HEAD' });
                                if (!response.ok) {
                                    results.brokenLinks.push({ href: absoluteUrl, status: response.status });
                                }
                            } catch (e) {
                                results.brokenLinks.push({ href: absoluteUrl, status: 'Falha na Rede' });
                            }
                        }
                    }
                }
            } catch(e) {
                 results.jsErrors.push({ message: `Erro ao analisar a página: ${e.message}` });
            } finally {
                formatAndResolve();
            }
        };

        const formatAndResolve = () => {
            let htmlReport = '';
            const sections = {
                'Erros de Console': { items: results.jsErrors, color: 'red', format: item => `${item.message}` },
                'Acessibilidade (Violações)': { items: results.accessibility, color: 'red', format: item => `<strong>${item.help}:</strong> ${item.description}` },
                'Links Quebrados': { items: results.brokenLinks, color: 'red', format: item => `[Status ${item.status}] ${item.href}` },
                'Problemas de SEO': { items: results.seo, color: 'yellow', format: item => item.issue },
                'Imagens sem Atributo "alt"': { items: results.missingAlts, color: 'yellow', format: item => `SRC: ${item.src.substring(0, 100)}...` },
            };

            for (const [title, section] of Object.entries(sections)) {
                htmlReport += `<h4 class="font-bold text-${section.color}-400 mt-2 mb-1">${title}</h4>`;
                if (section.items.length > 0) {
                    results.text += `[${title}]\n`;
                    section.items.forEach(item => {
                        const formattedText = section.format(item).replace(/<[^>]*>/g, ''); // Remove HTML for text report
                        htmlReport += `<div class="mb-2 p-1 border-l-2 border-${section.color}-400">${section.format(item)}</div>`;
                        results.text += `- ${formattedText}\n`;
                    });
                } else {
                    htmlReport += '<p class="text-gray-400">Nenhum problema encontrado.</p>';
                }
            }
            results.html = htmlReport;
            results.text += `\n\n`;
            resolve(results);
        };
        
        iframe.onload = onIframeLoad;
        iframe.contentWindow.onerror = (message) => { results.jsErrors.push({ message }); return true; };
        iframe.src = url;
    });
};

/**
 * ABA DE ELEMENTOS, CONSOLE, STORAGE, ETC.
 */
DevPanelFeatures.renderElementsTab = function(panelContent, baseUrl, state, helpers) {
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
    treeContainer.appendChild(helpers.buildElementsTree(document.documentElement));
    document.getElementById("inspector-toggle").addEventListener("click", () => helpers.toggleInspector());
};

DevPanelFeatures.renderConsoleTab = function(panelContent, baseUrl, state, helpers) {
    panelContent.innerHTML = '<div id="console-output" class="flex-1 overflow-y-auto p-2 relative"></div>';
    const consoleInput = document.getElementById("console-input");
    if (consoleInput) {
        consoleInput.addEventListener("keydown", e => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); 
                const command = consoleInput.value;
                if (command) {
                    consoleInput.value = "";
                    helpers.logToPanel({ type: "log", args: [`> ${command}`] });
                    try {
                        // Executa no escopo global (window)
                        const result = (new Function(`return ${command}`))();
                        if (result !== undefined) helpers.logToPanel({ type: "info", args: [result] });
                    } catch (error) {
                        helpers.logToPanel({ type: "error", args: [error] });
                    }
                }
            }
        });
    }
};

DevPanelFeatures.renderStorageTab = function(panelContent) {
    let tableRows = "";
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        tableRows += `<tr class='border-b border-gray-800'><td class='p-2 align-top text-orange-400'>${key}</td><td class='p-2 align-top text-green-400 whitespace-pre-wrap break-all'>${value}</td></tr>`;
    }
    panelContent.innerHTML = `<div class="p-2 w-full"><h3 class="font-bold text-lg mb-2">Local Storage</h3><table class="w-full text-left text-xs"><thead><tr class="border-b border-gray-700"><th class="p-2 w-1/4">Key</th><th class="p-2">Value</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
};

DevPanelFeatures.renderNetworkTab = function(panelContent) {
    const nav = performance.getEntriesByType("navigation")[0];
    if(!nav) {
        panelContent.innerHTML = `<div class="p-4">Informação de Network não disponível.</div>`;
        return;
    };
    panelContent.innerHTML = `<div class="p-4 w-full"><table class='w-full text-left'><tbody><tr class='border-b border-gray-800'><td class='p-2 font-bold'>Tempo Total de Carregamento</td><td class='p-2'>${nav.duration.toFixed(0)} ms</td></tr><tr class='border-b border-gray-800'><td class='p-2'>Lookup de DNS</td><td class='p-2'>${(nav.domainLookupEnd - nav.domainLookupStart).toFixed(0)} ms</td></tr><tr class='border-b border-gray-800'><td class='p-2'>Conexão TCP</td><td class='p-2'>${(nav.connectEnd - nav.connectStart).toFixed(0)} ms</td></tr><tr class='border-b border-gray-800'><td class='p-2'>TTFB</td><td class='p-2'>${(nav.responseStart - nav.requestStart).toFixed(0)} ms</td></tr></tbody></table></div>`;
};

DevPanelFeatures.renderRecursosTab = function(panelContent) {
    const resources = performance.getEntriesByType("resource");
    let tableRows = "";
    resources.forEach(r => { tableRows += `<tr class='border-b border-gray-800'><td class='p-2 truncate max-w-xs'>${r.name.split("/").pop()}</td><td class='p-2'>${r.initiatorType}</td><td class='p-2'>${(r.transferSize / 1024).toFixed(2)}</td><td class='p-2'>${r.duration.toFixed(0)}</td></tr>`; });
    panelContent.innerHTML = `<div class="p-4 w-full"><table class='w-full text-left'><thead><tr class='border-b border-gray-700'><th class='p-2'>Nome</th><th class='p-2'>Tipo</th><th class='p-2'>Tamanho (KB)</th><th class='p-2'>Tempo (ms)</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
};

DevPanelFeatures.renderInfoTab = function(panelContent, baseUrl, state, helpers, devPanelVersion) {
    const buildTimeMeta = document.querySelector('meta[name="jekyll-build-time"]');
    const buildTime = buildTimeMeta ? new Date(buildTimeMeta.content).toLocaleString("pt-BR") : 'Não encontrado';
    panelContent.innerHTML = `
        <div class="p-4 w-full">
            <table class='w-full text-left'><tbody>
                <tr class='border-b border-gray-800'><td class='p-2 font-bold text-sky-400'>Versão do Painel</td><td class='p-2'>${devPanelVersion}</td></tr>
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
        const savedTabSize = localStorage.getItem('tabSizePreference') || '4';
        tabSizeSelect.value = savedTabSize;
        tabSizeSelect.addEventListener('change', (e) => {
            const newSize = e.target.value;
            document.documentElement.style.setProperty('--tab-size-preference', newSize);
            localStorage.setItem('tabSizePreference', newSize);
        });
    }
};

// As abas 'Acessibilidade' e 'Testes' foram removidas da interface e sua lógica integrada na 'Auditoria'.
// Deixamos as funções aqui caso queira reativá-las como abas separadas no futuro.
DevPanelFeatures.renderAcessibilidadeTab = DevPanelFeatures.renderAcessibilidadeTab;
DevPanelFeatures.renderTestesTab = DevPanelFeatures.renderTestesTab;
