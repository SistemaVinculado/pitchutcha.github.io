document.addEventListener('DOMContentLoaded', () => {
    // Evita rodar em iframes ou ambientes não desejados
    if (window.self !== window.top) return;

    const devPanelHTML = `
        <div id="dev-tools-trigger" class="fixed bottom-4 right-4 z-[100] bg-slate-800 text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-slate-700 transition-transform hover:scale-110">
            <span class="material-symbols-outlined">developer_mode</span>
        </div>
        <div id="dev-panel" class="hidden fixed bottom-0 left-0 w-full h-2/3 bg-gray-900 text-white shadow-2xl z-[99] flex flex-col font-mono text-sm">
            <div class="flex items-center justify-between bg-gray-800 p-2 border-b border-gray-700">
                <div class="flex items-center gap-4">
                    <h2 class="font-bold text-lg px-2">Pitchutcha Dev Panel</h2>
                    <nav class="flex gap-1">
                        <button data-tab="console" class="dev-tab active-tab">Console</button>
                        <button data-tab="elements" class="dev-tab">Elements</button>
                        <button data-tab="network" class="dev-tab">Network</button>
                        <button data-tab="storage" class="dev-tab">Storage</button>
                        <button data-tab="tests" class="dev-tab">Testes</button>
                        <button data-tab="info" class="dev-tab">Info</button>
                    </nav>
                </div>
                <button id="dev-panel-close" class="p-2 rounded-full hover:bg-gray-700">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="flex-grow overflow-hidden flex">
                <div id="tab-console" class="dev-tab-content flex-grow flex flex-col p-2 gap-2">
                    <div class="flex-shrink-0 flex items-center gap-2">
                         <button id="clear-console" class="dev-button">Clear</button>
                         <button id="export-console" class="dev-button">Export JSON</button>
                    </div>
                    <div id="console-output" class="flex-grow overflow-y-auto bg-black bg-opacity-20 p-2 rounded"></div>
                    <div class="flex-shrink-0 flex items-center gap-2">
                        <span class="material-symbols-outlined text-cyan-400">chevron_right</span>
                        <input type="text" id="console-input" class="flex-grow bg-gray-800 border border-gray-700 rounded p-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Executar JavaScript...">
                    </div>
                </div>
                <div id="tab-elements" class="dev-tab-content hidden flex-grow flex overflow-hidden">
                    <div class="w-1/2 overflow-y-auto p-2 border-r border-gray-700">
                        <div class="flex items-center gap-2 mb-2">
                            <button id="element-picker" class="dev-button">Pick Element</button>
                        </div>
                        <div id="dom-tree"></div>
                    </div>
                    <div id="style-inspector" class="w-1/2 overflow-y-auto p-2">
                        <h3 class="font-bold border-b border-gray-700 mb-2 pb-1">Styles (element.style)</h3>
                        <div id="style-rules" class="text-xs">Select an element to inspect.</div>
                    </div>
                </div>
                <div id="tab-network" class="dev-tab-content hidden flex-grow p-2">
                     <div id="network-log" class="overflow-y-auto h-full"></div>
                </div>
                <div id="tab-storage" class="dev-tab-content hidden flex-grow p-2">
                    <p>Funcionalidade de Storage ainda não implementada.</p>
                </div>
                <div id="tab-tests" class="dev-tab-content hidden flex-grow flex flex-col p-2 gap-2">
                     <button id="run-tests" class="dev-button self-start">Executar Testes de Diagnóstico</button>
                     <div id="test-results" class="overflow-y-auto h-full"></div>
                </div>
                <div id="tab-info" class="dev-tab-content hidden flex-grow p-2">
                    <p>User Agent: ${navigator.userAgent}</p>
                    <p>Viewport: ${window.innerWidth}x${window.innerHeight}</p>
                 </div>
            </div>
            
            <div class="flex-shrink-0 bg-gray-800 p-1 border-t border-gray-700 flex items-center gap-2">
                <div id="status-indicator" class="w-3 h-3 bg-green-500 rounded-full" title="No errors detected"></div>
                <span>Status: OK</span>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', devPanelHTML);

    const trigger = document.getElementById('dev-tools-trigger');
    const panel = document.getElementById('dev-panel');
    const closeBtn = document.getElementById('dev-panel-close');
    const tabs = document.querySelectorAll('.dev-tab');
    const tabContents = document.querySelectorAll('.dev-tab-content');
    const consoleOutput = document.getElementById('console-output');
    const consoleInput = document.getElementById('console-input');
    const statusIndicator = document.getElementById('status-indicator');
    
    // Abrir/Fechar painel
    trigger.addEventListener('click', () => panel.classList.toggle('hidden'));
    closeBtn.addEventListener('click', () => panel.classList.add('hidden'));

    // Navegação por abas
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active-tab'));
            tab.classList.add('active-tab');
            const targetId = `tab-${tab.dataset.tab}`;
            tabContents.forEach(content => {
                content.classList.add('hidden');
                if (content.id === targetId) {
                    content.classList.remove('hidden');
                }
            });
        });
    });

    // --- Funcionalidades do Console ---
    const logHistory = [];
    let historyIndex = -1;

    function logToPanel(type, args) {
        const icons = { log: '📝', info: 'ℹ️', warn: '⚠️', error: '❌' };
        const colors = { log: 'text-gray-300', info: 'text-blue-400', warn: 'text-yellow-400', error: 'text-red-400' };
        const entry = document.createElement('div');
        entry.className = `flex items-start gap-2 border-b border-gray-800 py-1 ${colors[type]}`;
        const timestamp = new Date().toLocaleTimeString();
        let content = `<span class="flex-shrink-0">${icons[type]}</span> <span class="flex-shrink-0 text-gray-500">${timestamp}</span> <div class="break-all">`;
        content += [...args].map(arg => {
            if (typeof arg === 'object') return JSON.stringify(arg, null, 2);
            return arg;
        }).join(' ');
        content += '</div>';
        entry.innerHTML = content;
        consoleOutput.appendChild(entry);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
        logHistory.push({ type, timestamp, args: [...args] });
    }

    const originalConsole = {};
    ['log', 'warn', 'info', 'error'].forEach(type => {
        originalConsole[type] = console[type];
        console[type] = (...args) => {
            originalConsole[type](...args);
            logToPanel(type, args);
        };
    });
    
    document.getElementById('clear-console').addEventListener('click', () => { consoleOutput.innerHTML = ''; logHistory.length = 0; });
    document.getElementById('export-console').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(logHistory, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'console-log.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    const commandHistory = [];
    let commandHistoryIndex = -1;
    consoleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && consoleInput.value) {
            const command = consoleInput.value;
            console.log('>', command);
            commandHistory.push(command);
            commandHistoryIndex = commandHistory.length;
            try {
                const result = new Function(`return ${command}`)();
                console.info('=', result);
            } catch (error) {
                console.error(error.message);
            }
            consoleInput.value = '';
        } else if (e.key === 'ArrowUp') {
            if (commandHistoryIndex > 0) {
                commandHistoryIndex--;
                consoleInput.value = commandHistory[commandHistoryIndex];
            }
        } else if (e.key === 'ArrowDown') {
            if (commandHistoryIndex < commandHistory.length - 1) {
                commandHistoryIndex++;
                consoleInput.value = commandHistory[commandHistoryIndex];
            } else {
                 consoleInput.value = '';
                 commandHistoryIndex = commandHistory.length;
            }
        }
    });

    // --- Funcionalidades de Elementos ---
    const domTreeContainer = document.getElementById('dom-tree');
    const styleRulesContainer = document.getElementById('style-rules');
    
    function buildDomTree(element, parentElement, indent = 0) {
        if(['SCRIPT', 'STYLE', 'LINK', 'META'].includes(element.tagName)) return;

        const details = document.createElement('details');
        details.style.marginLeft = `${indent * 15}px`;
        details.open = indent < 2;

        const summary = document.createElement('summary');
        summary.className = 'cursor-pointer hover:bg-gray-700 p-1 rounded';
        summary.textContent = `<${element.tagName.toLowerCase()}>`;
        summary.addEventListener('click', (e) => {
             e.preventDefault();
             e.stopPropagation();
             details.open = !details.open;
            inspectStyles(element);
        });
        
        details.appendChild(summary);
        [...element.children].forEach(child => buildDomTree(child, details, indent + 1));
        parentElement.appendChild(details);
    }
    buildDomTree(document.documentElement, domTreeContainer);

    function inspectStyles(element) {
        styleRulesContainer.innerHTML = '';
        const title = document.createElement('h3');
        title.className = 'font-bold border-b border-gray-700 mb-2 pb-1';
        title.innerHTML = `Styles for <code><${element.tagName.toLowerCase()}></code>`;
        styleRulesContainer.appendChild(title);
        
        const styleBlock = document.createElement('div');
        styleBlock.className = "p-2 bg-gray-800 rounded";
        
        const addPropBtn = document.createElement('button');
        addPropBtn.textContent = '+ Add property';
        addPropBtn.className = "dev-button mt-2";
        
        addPropBtn.onclick = () => {
             const newProp = createEditableStyle('', '', element, styleBlock);
             styleBlock.appendChild(newProp);
        };
        for (let i = 0; i < element.style.length; i++) {
            const prop = element.style[i];
            const value = element.style.getPropertyValue(prop);
            styleBlock.appendChild(createEditableStyle(prop, value, element, styleBlock));
        }
        styleRulesContainer.appendChild(styleBlock);
        styleRulesContainer.appendChild(addPropBtn);
    }
    
    function createEditableStyle(prop, value, element, container){
        const ruleDiv = document.createElement('div');
        ruleDiv.innerHTML = `<span contenteditable="true" class="style-prop text-purple-400">${prop || 'property'}</span>: <span contenteditable="true" class="style-value text-green-400">${value || 'value'}</span>;`;
        const updateStyle = () => {
             element.style.cssText = '';
             const allProps = container.querySelectorAll('.style-prop');
             const allValues = container.querySelectorAll('.style-value');
             allProps.forEach((p, i) => {
                 const currentProp = p.textContent.trim();
                 const currentValue = allValues[i].textContent.trim();
                 if(currentProp) {
                     element.style.setProperty(currentProp, currentValue);
                 }
            });
        };
        ruleDiv.querySelector('.style-prop').addEventListener('blur', updateStyle);
        ruleDiv.querySelector('.style-value').addEventListener('blur', updateStyle);
        return ruleDiv;
    }

    // --- Funcionalidades de Network ---
    const networkLog = document.getElementById('network-log');
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const startTime = performance.now();
        const url = args[0] instanceof Request ? args[0].url : args[0];
        const logEntry = document.createElement('div');
        logEntry.className = 'flex justify-between items-center p-1 border-b border-gray-800';
        logEntry.innerHTML = `<span>${url.substring(0, 80)}...</span> <span class="loader"></span>`;
        networkLog.prepend(logEntry);

        return originalFetch.apply(this, args).then(response => {
            const duration = (performance.now() - startTime).toFixed(2);
            const statusColor = response.ok ? 'text-green-500' : 'text-red-500';
            logEntry.innerHTML = `<span>${url.substring(0, 80)}...</span><span class="flex items-center gap-2"><span class="${statusColor}">${response.status}</span><span class="text-gray-500">${duration}ms</span></span>`;
            return response;
        }).catch(error => {
            const duration = (performance.now() - startTime).toFixed(2);
             logEntry.innerHTML = `<span>${url.substring(0, 80)}...</span><span class="flex items-center gap-2"><span class="text-red-500">Error</span><span class="text-gray-500">${duration}ms</span></span>`;
            throw error;
        });
    };

    // --- Funcionalidades de Testes ---
    const testResults = document.getElementById('test-results');
    document.getElementById('run-tests').addEventListener('click', async () => {
        testResults.innerHTML = '';
        const filesToCheck = [
            'css/style.css', 'js/script.js', 'js/dev-panel.js', 
            'index.html', 'algorithms.html', 'data-structures.html', 'search.html', 'status.html'
        ];
        for(const file of filesToCheck) {
            let status, message;
            try {
                const response = await fetch(file, { method: 'HEAD', cache: 'no-store' });
                if (response.ok) {
                    status = 'success';
                    message = `Arquivo encontrado e acessível.`;
                } else {
                    status = 'error';
                    message = `Falha ao carregar o arquivo (Status: ${response.status}). Verifique o caminho.`;
                }
            } catch (e) {
                status = 'error';
                message = `Erro de rede. Verifique se o arquivo existe e o servidor está online.`;
            }
            logTestResult(file, status, message);
        }
    });

    function logTestResult(name, type, message) {
        const icons = { info: 'ℹ️', success: '✅', warn: '⚠️', error: '❌' };
        const colors = { info: 'text-blue-400', success: 'text-green-400', warn: 'text-yellow-400', error: 'text-red-400' };
        const entry = document.createElement('div');
        entry.className = `flex items-start gap-2 border-b border-gray-800 py-1 ${colors[type]}`;
        entry.innerHTML = `<span>${icons[type]}</span> <span class="font-bold w-48 flex-shrink-0">${name}</span> <span>${message}</span>`;
        testResults.appendChild(entry);
    }
    
    // Captura de erros globais
    window.onerror = function (message, source, lineno, colno, error) {
        console.error(`Erro global: ${message} em ${source}:${lineno}`);
        statusIndicator.classList.remove('bg-green-500');
        statusIndicator.classList.add('bg-red-500');
        statusIndicator.parentElement.querySelector('span').textContent = 'Status: Error';
    };
});
