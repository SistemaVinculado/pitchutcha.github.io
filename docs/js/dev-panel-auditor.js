// docs/js/dev-panel-auditor.js

window.DevPanelAuditor = {
    initialize: function (panelContent, baseUrl) {
        panelContent.innerHTML = `
            <div class="p-4 w-full flex flex-col h-full">
                <div id="panel-diagnostics-container" class="mb-4 flex-shrink-0"></div>
                <div class="flex items-center justify-between mb-4 flex-shrink-0">
                    <div>
                        <h3 class="font-bold text-lg">Auditoria Global do Site</h3>
                        <p class="text-sm text-gray-400">Executa testes de acessibilidade, performance, SEO e mais em todas as páginas.</p>
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
        
        document.getElementById('run-global-audit').addEventListener('click', () => this.runGlobalAudit(baseUrl));
        this.runPanelDiagnostics(baseUrl);
    },

    runPanelDiagnostics: async function(baseUrl) {
        const container = document.getElementById('panel-diagnostics-container');
        if (!container) return;

        let diagnosticsHTML = '<details class="border border-gray-700 rounded-md"><summary class="p-2 cursor-pointer text-sm font-semibold">Diagnóstico do Painel de Desenvolvedor</summary><div class="p-4 border-t border-gray-700 text-xs space-y-2">';
        let allOk = true;

        // Verifica se a biblioteca Axe está disponível
        if (typeof axe === 'undefined') {
            diagnosticsHTML += '<div class="flex items-center gap-2 text-red-400"><span class="material-symbols-outlined">error</span><span>Biblioteca Axe (axe.min.js) não foi encontrada. Testes de acessibilidade falharão.</span></div>';
            allOk = false;
        } else {
            diagnosticsHTML += '<div class="flex items-center gap-2 text-green-400"><span class="material-symbols-outlined">check_circle</span><span>Biblioteca Axe carregada com sucesso.</span></div>';
        }

        // Verifica se search.json está acessível
        try {
            const response = await fetch(`${baseUrl}search.json?v=${Date.now()}`);
            if (response.ok) {
                diagnosticsHTML += '<div class="flex items-center gap-2 text-green-400"><span class="material-symbols-outlined">check_circle</span><span>Arquivo de busca (search.json) acessível.</span></div>';
            } else {
                diagnosticsHTML += `<div class="flex items-center gap-2 text-red-400"><span class="material-symbols-outlined">error</span><span>search.json não encontrado (Status: ${response.status}). A auditoria não incluirá todos os posts.</span></div>`;
                allOk = false;
            }
        } catch(e) {
            diagnosticsHTML += `<div class="flex items-center gap-2 text-red-400"><span class="material-symbols-outlined">error</span><span>Falha ao buscar search.json. Verifique o console para erros de rede.</span></div>`;
            allOk = false;
        }

        if (allOk) {
             diagnosticsHTML = '<div class="p-2 text-sm text-green-400 font-semibold flex items-center gap-2"><span class="material-symbols-outlined">check_circle</span><span>Diagnóstico do Painel: Todos os sistemas operacionais.</span></div>';
        } else {
            diagnosticsHTML += '</div></details>';
        }
        
        container.innerHTML = diagnosticsHTML;
    },

    runGlobalAudit: async function (baseUrl) {
        const resultsContainer = document.getElementById('audit-results');
        const runButton = document.getElementById('run-global-audit');
        const copyButton = document.getElementById('copy-audit-report');
        
        runButton.disabled = true; runButton.textContent = 'Executando...';
        copyButton.classList.add('hidden'); resultsContainer.innerHTML = '';
    
        let pagesToScan = ['index.html', 'algoritmos.html', 'estruturas-de-dados.html', 'search.html', 'status.html'];
        try {
            const response = await fetch(`${baseUrl}search.json?v=${Date.now()}`);
            if (response.ok) {
                const posts = await response.json();
                posts.forEach(post => pagesToScan.push(post.url));
            }
        } catch(e) { console.warn("Não foi possível carregar posts.", e); }
    
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
            
            const pageResults = await this.analyzePageInIframe(iframe, url, baseUrl);
            
            const resultHTML = document.createElement('details');
            resultHTML.className = 'bg-gray-900 border border-gray-700 rounded-md mb-2';
            const issueCount = Object.values(pageResults.issues).reduce((acc, val) => acc + val.length, 0);
            resultHTML.innerHTML = `<summary class="p-2 cursor-pointer flex justify-between items-center"><span>${page}</span> <span class="px-2 py-1 text-xs rounded-full ${issueCount > 0 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}">${issueCount} problemas</span></summary><div class="p-4 border-t border-gray-700 text-xs">${pageResults.html}</div>`;
            resultsContainer.appendChild(resultHTML);
            fullReportText += pageResults.text;
        }
    
        document.body.removeChild(iframe);
        runButton.disabled = false; runButton.textContent = 'Executar Novamente';
        copyButton.classList.remove('hidden');
        copyButton.onclick = () => {
            navigator.clipboard.writeText(fullReportText).then(() => {
                copyButton.textContent = 'Copiado!';
                setTimeout(() => copyButton.textContent = 'Copiar Relatório', 2000);
            });
        };
    },

    analyzePageInIframe: function (iframe, url, baseUrl) {
        return new Promise(resolve => {
            let issues = { accessibility: [], jsErrors: [], missingAlts: [], seo: [], bestPractices: [], performance: [], passes: [] };
            let text = `--- PÁGINA: ${url} ---\n\n`;
            let html = '';
            
            const timeout = setTimeout(() => {
                iframe.onload = null;
                issues.jsErrors.push({ text: `Timeout: A página ${url} demorou muito para carregar.`});
                formatAndResolve();
            }, 15000);

            const onIframeLoad = async () => {
                clearTimeout(timeout);
                const doc = iframe.contentDocument;
                const win = iframe.contentWindow;
                try {
                    if (typeof axe !== 'undefined') {
                        const axeIframeScript = doc.createElement('script');
                        axeIframeScript.src = `${baseUrl}js/vendor/axe.min.js`;
                        doc.head.appendChild(axeIframeScript);
                        await new Promise(r => axeIframeScript.onload = r);
                        
                        const axeResults = await win.axe.run(doc.documentElement, { resultTypes: ['violations', 'passes', 'incomplete'] });
                        issues.accessibility = axeResults.violations;
                        issues.passes = axeResults.passes;
                    }
                    
                    doc.querySelectorAll('img:not([alt])').forEach(img => issues.missingAlts.push({ text: `Imagem sem alt: ${img.src.substring(0,100)}...` }));
                    if (!doc.documentElement.hasAttribute('lang')) issues.bestPractices.push({ text: 'Atributo "lang" ausente na tag <html>.' });
                    if (!doc.querySelector('title') || doc.querySelector('title').innerText.trim() === '') issues.seo.push({ text: 'A tag <title> está vazia ou ausente.' });
                    if (!doc.querySelector('meta[name="description"]')) issues.seo.push({ text: 'A tag <meta name="description"> está ausente.' });
                    
                    const perf = win.performance.getEntriesByType("navigation")[0];
                    if(perf && perf.domContentLoadedEventEnd > 2000) issues.performance.push({ text: `DOM Content Loaded Lento: ${perf.domContentLoadedEventEnd.toFixed(0)}ms`});
                
                } catch(e) {
                     issues.jsErrors.push({ text: `Erro ao analisar a página com Axe: ${e.message}` });
                } finally {
                    formatAndResolve();
                }
            };

            const formatAndResolve = () => {
                const sections = {
                    'Erros Críticos (JS)': { items: issues.jsErrors, color: 'red', format: item => item.text },
                    'Acessibilidade (Violações)': { items: issues.accessibility, color: 'red', format: item => `<strong>${item.help}:</strong> ${item.description}` },
                    'Melhores Práticas e Qualidade': { items: [...issues.missingAlts, ...issues.bestPractices], color: 'yellow', format: item => item.text },
                    'SEO': { items: issues.seo, color: 'yellow', format: item => item.text },
                    'Performance': { items: issues.performance, color: 'yellow', format: item => item.text },
                    'Acessibilidade (Passes)': { items: issues.passes, color: 'green', format: item => item.help },
                };

                for (const [title, section] of Object.entries(sections)) {
                    if (section.items.length > 0) {
                        html += `<h4 class="font-bold text-${section.color}-400 mt-3 mb-1">${title} (${section.items.length})</h4>`;
                        text += `[${title} (${section.items.length})]\n`;
                        section.items.forEach(item => {
                            const formattedText = section.format(item).replace(/<[^>]*>/g, '');
                            html += `<div class="mb-2 p-1 border-l-2 border-${section.color}-400">${section.format(item)}</div>`;
                            text += `- ${formattedText}\n`;
                        });
                    }
                }
                text += `\n\n`;
                resolve({issues, html, text});
            };
            
            iframe.onload = onIframeLoad;
            iframe.contentWindow.onerror = (message) => { issues.jsErrors.push({ text: message.toString() }); return true; };
            iframe.src = url;
        });
    }
};
