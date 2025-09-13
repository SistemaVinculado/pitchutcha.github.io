// docs/js/dev-panel.js

document.addEventListener("DOMContentLoaded", () => {
    // Evita que o painel seja executado em iframes ou se o objeto de features não carregou
    if (window.self !== window.top || typeof DevPanelFeatures === 'undefined') {
        return;
    }

    const DEV_PANEL_VERSION = "1.6.1"; // Versão com correções
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

    let elementsState = {
        isInspecting: false,
        lastInspectedElement: null,
        lastSelectedTreeNode: null,
        domElementToTreeNode: new WeakMap()
    };
    
    const helpers = {
        logToPanel: (log) => {
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
                try { return JSON.stringify(arg, null, 2); } catch(e) { return "[Não foi possível serializar o objeto]" }
            }).join(" ");
            item.innerHTML = `<span class="opacity-50">${new Date().toLocaleTimeString()}</span><pre class="flex-1 whitespace-pre-wrap">${contentText}</pre>`;
            consoleOutput.appendChild(item);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        },
        buildElementsTree: (element, depth = 0) => {
            if (!element.tagName || element.closest('#dev-panel')) return null;
            const nodeWrapper = document.createElement('div');
            const nodeHeader = document.createElement('div');
            nodeHeader.className = 'element-node-header flex items-center cursor-pointer hover:bg-gray-800 rounded p-0.5';
            nodeHeader.style.paddingLeft = `${depth}rem`;
            elementsState.domElementToTreeNode.set(element, nodeHeader);

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
                helpers.selectElement(element);
            });

            if (hasChildren) {
                for (const child of element.children) {
                    const childNode = helpers.buildElementsTree(child, depth + 1);
                    if (childNode) childrenContainer.appendChild(childNode);
                }
            }
            return nodeWrapper;
        },
        selectElement: (element) => {
            helpers.highlightOnPage(element);
            helpers.highlightInTree(element);
            helpers.displayComputedStyles(element);
        },
        highlightOnPage: (element) => {
            if (elementsState.lastInspectedElement) elementsState.lastInspectedElement.style.outline = '';
            if (element) {
                element.style.outline = '2px solid #0ea5e9';
                elementsState.lastInspectedElement = element;
            }
        },
        highlightInTree: (element) => {
            if (elementsState.lastSelectedTreeNode) elementsState.lastSelectedTreeNode.style.backgroundColor = '';
            const treeNode = elementsState.domElementToTreeNode.get(element);
            if (treeNode) {
                treeNode.style.backgroundColor = 'rgba(14, 165, 233, 0.3)';
                elementsState.lastSelectedTreeNode = treeNode;
            }
        },
        displayComputedStyles: (element) => {
            const container = document.getElementById("computed-styles-container");
            if (!container || !element) return;
            const styles = window.getComputedStyle(element);
            let tableHTML = "<table class='w-full text-left text-xs'>";
            Array.from(styles).forEach(prop => {
                tableHTML += `<tr class='border-b border-gray-800'><td class='p-1 text-pink-400'>${prop}</td><td class='p-1 text-cyan-400 break-all'>${styles.getPropertyValue(prop)}</td></tr>`;
            });
            tableHTML += "</table>";
            container.innerHTML = tableHTML;
        },
        toggleInspector: () => {
            elementsState.isInspecting = !elementsState.isInspecting;
            const button = document.getElementById('inspector-toggle');
            if (button) {
                button.style.backgroundColor = elementsState.isInspecting ? '#0ea5e9' : 'transparent';
                button.style.color = elementsState.isInspecting ? 'white' : '';
            }
            document.body.style.cursor = elementsState.isInspecting ? 'crosshair' : 'default';

            const clickHandler = (e) => {
                if (!elementsState.isInspecting || e.target.closest("#dev-panel")) return;
                e.preventDefault(); e.stopPropagation();
                helpers.selectElement(e.target);
                helpers.revealInTree(e.target);
                helpers.toggleInspector();
            };

            if (elementsState.isInspecting) {
                document.addEventListener('click', clickHandler, { capture: true });
            } else {
                document.removeEventListener('click', clickHandler, { capture: true });
                if (elementsState.lastInspectedElement) elementsState.lastInspectedElement.style.outline = '';
            }
        },
        revealInTree: (element) => {
             let current = element;
             while(current && current !== document.body) {
                 const treeNode = elementsState.domElementToTreeNode.get(current);
                 if(treeNode) {
                     const childrenContainer = treeNode.parentElement.querySelector('.element-children');
                     if(childrenContainer && childrenContainer.classList.contains('hidden')) {
                         childrenContainer.classList.remove('hidden');
                         const icon = treeNode.querySelector('.expand-icon');
                         if (icon) icon.textContent = 'arrow_drop_down';
                     }
                 }
                 current = current.parentElement;
             }
             const finalNode = elementsState.domElementToTreeNode.get(element);
             if(finalNode) finalNode.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    };
    
    ["log", "warn", "error", "info"].forEach(type => {
        const original = console[type];
        console[type] = (...args) => {
            original.apply(console, args);
            if (devPanel && !devPanel.classList.contains('hidden')) {
                helpers.logToPanel({ type, args });
            }
        };
    });

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

    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    function renderTabContent(tabId) {
        panelContent.innerHTML = ""; 
        consoleInputContainer.style.display = (tabId === "console") ? "flex" : "none";
        
        if (elementsState.isInspecting) helpers.toggleInspector();

        const featureFunctionName = `render${capitalize(tabId)}Tab`;
        if (window.DevPanelFeatures && typeof window.DevPanelFeatures[featureFunctionName] === 'function') {
            window.DevPanelFeatures[featureFunctionName](panelContent, baseUrl, elementsState, helpers, DEV_PANEL_VERSION);
        } else {
            panelContent.innerHTML = `<div class="p-4">Funcionalidade da aba '${tabId}' não encontrada.</div>`;
        }
    }
});
