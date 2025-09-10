document.addEventListener("DOMContentLoaded",()=>{if(window.self!==window.top){return}const e=document.createElement("script");e.src="js/vendor/axe.min.js",document.head.appendChild(e);const t=`
        <div id="dev-tools-trigger" class="fixed bottom-4 right-4 z-[100] bg-slate-800 text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-slate-700 transition-transform hover:scale-110">
            <span class="material-symbols-outlined">developer_mode</span>
        </div>
        <div id="dev-panel" class="hidden fixed bottom-0 left-0 w-full h-2/3 bg-gray-900 text-white shadow-2xl z-[99] flex flex-col font-mono text-sm">
            <div class="flex items-center justify-between bg-gray-800 p-2 border-b border-gray-700">
                <div class="flex items-center gap-4 min-w-0">
                    <h2 class="font-bold text-lg px-2 flex-shrink-0">Pitchutcha Dev Panel</h2>
                    <nav class="flex gap-1 overflow-x-auto whitespace-nowrap">
                        <button data-tab="console" class="dev-tab active-tab">Console</button>
                        <button data-tab="elements" class="dev-tab">Elements</button>
                        <button data-tab="network" class="dev-tab">Network</button>
                        <button data-tab="recursos" class="dev-tab">Recursos</button>
                        <button data-tab="acessibilidade" class="dev-tab">Acessibilidade</button>
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
                            <button id="element-picker-btn" class="dev-button">Selecionar Elemento</button>
                        </div>
                        <div id="dom-tree"></div>
                    </div>
                    <div id="style-inspector" class="w-1/2 overflow-y-auto p-2"></div>
                </div>
                <div id="tab-network" class="dev-tab-content hidden flex-grow p-2">
                     <div id="network-log" class="overflow-y-auto h-full"></div>
                </div>
                <div id="tab-recursos" class="dev-tab-content hidden flex-grow flex flex-col p-2 gap-2">
                    <div class="flex-shrink-0 flex items-center justify-between">
                        <button id="refresh-resources" class="dev-button">Atualizar</button>
                        <div id="resources-summary" class="text-right text-xs"></div>
                    </div>
                    <div class="flex-grow overflow-auto bg-black bg-opacity-20 rounded">
                        <table class="w-full text-left text-xs">
                            <thead class="sticky top-0 bg-gray-800">
                                <tr>
                                    <th class="p-2">Nome do Recurso</th>
                                    <th class="p-2">Tipo</th>
                                    <th class="p-2">Tamanho</th>
                                    <th class="p-2">Tempo (ms)</th>
                                </tr>
                            </thead>
                            <tbody id="resources-list"></tbody>
                        </table>
                    </div>
                </div>
                <div id="tab-acessibilidade" class="dev-tab-content hidden flex-grow flex flex-col p-2 gap-2">
                     <div class="flex-shrink-0">
                        <button id="run-accessibility-test" class="dev-button">Executar Teste de Acessibilidade</button>
                     </div>
                     <div id="accessibility-results" class="flex-grow overflow-y-auto bg-black bg-opacity-20 p-2 rounded"></div>
                </div>
                <div id="tab-tests" class="dev-tab-content hidden flex-grow flex flex-col p-2 gap-2">
                     <button id="run-tests" class="dev-button self-start">Executar Testes de Diagnóstico</button>
                     <div id="test-results" class="overflow-y-auto h-full"></div>
                </div>
                <div id="tab-info" class="dev-tab-content hidden flex-grow p-2"></div>
            </div>
            
            <div class="flex-shrink-0 bg-gray-800 p-1 border-t border-gray-700 flex items-center gap-2">
                <div id="status-indicator" class="w-3 h-3 bg-green-500 rounded-full" title="No errors detected"></div>
                <span>Status: OK</span>
            </div>
        </div>
    `;document.body.insertAdjacentHTML("beforeend",t);const n=document.getElementById("dev-tools-trigger"),o=document.getElementById("dev-panel"),l=document.getElementById("dev-panel-close"),d=document.querySelectorAll(".dev-tab"),c=document.querySelectorAll(".dev-tab-content");n.addEventListener("click",()=>{o.classList.toggle("hidden")}),l.addEventListener("click",()=>{o.classList.add("hidden")}),d.forEach(e=>{e.addEventListener("click",()=>{d.forEach(e=>e.classList.remove("active-tab")),e.classList.add("active-tab");const t=`tab-${e.dataset.tab}`;c.forEach(n=>{n.classList.add("hidden"),n.id===t&&(n.classList.remove("hidden"),"elements"===e.dataset.tab&&f(),"recursos"===e.dataset.tab&&b(),"info"===e.dataset.tab&&g())})})});const r=document.getElementById("console-output"),s=document.getElementById("console-input"),i=document.getElementById("status-indicator"),a=[],u=[];let m=-1,p=-1;function y(e,t){const n={log:"📝",info:"ℹ️",warn:"⚠️",error:"❌"},o={log:"text-gray-300",info:"text-blue-400",warn:"text-yellow-400",error:"text-red-400"},l=document.createElement("div");l.className=`flex items-start gap-2 border-b border-gray-800 py-1 ${o[e]}`;const d=new Date().toLocaleTimeString();let c=`<span class="flex-shrink-0">${n[e]}</span> <span class="flex-shrink-0 text-gray-500">${d}</span> <div class="break-all">`;c+=[...t].map(e=>"object"==typeof e?JSON.stringify(e,null,2):e).join(" "),"</div>",l.innerHTML=c,r.appendChild(l),r.scrollTop=r.scrollHeight,a.push({type:e,timestamp:d,args:[...t]})}const h={};["log","warn","info","error"].forEach(e=>{h[e]=console[e],console[e]=(...t)=>{h[e](...t),y(e,t)}}),document.getElementById("clear-console").addEventListener("click",()=>{r.innerHTML="",a.length=0}),document.getElementById("export-console").addEventListener("click",()=>{const e=new Blob([JSON.stringify(a,null,2)],{type:"application/json"}),t=URL.createObjectURL(e),n=document.createElement("a");n.href=t,n.download="console-log.json",n.click(),URL.revokeObjectURL(t)}),s.addEventListener("keydown",e=>{if("Enter"===e.key&&s.value){const t=s.value;console.log(">",t),u.push(t),p=u.length;try{const n=new Function(`return ${t}`)();console.info("=",n)}catch(n){console.error(n.message)}s.value=""}else"ArrowUp"===e.key?p>0&&(p--,s.value=u[p]):"ArrowDown"===e.key&&(p<u.length-1?(p++,s.value=u[p]):(s.value="",p=u.length))});const f=()=>{const e=document.getElementById("dom-tree");e.innerHTML="",v(document.documentElement,e)},b=()=>{const e=document.getElementById("resources-list"),t=document.getElementById("resources-summary"),n=performance.getEntriesByType("resource");let o=0;e.innerHTML="",n.forEach(t=>{const n=t.name.split("/").pop().split("?")[0],l=(t.transferSize/1024).toFixed(2);o+=t.transferSize;const d=`
            <tr class="border-b border-gray-800 hover:bg-gray-700/50">
                <td class="p-2" title="${t.name}">${n}</td>
                <td class="p-2">${t.initiatorType}</td>
                <td class="p-2">${l} KB</td>
                <td class="p-2">${t.duration.toFixed(0)} ms</td>
            </tr>
        `;e.insertAdjacentHTML("beforeend",d)}),t.innerHTML=`<span class="font-bold">${n.length}</span> requisições | <span class="font-bold">${(o/1024).toFixed(2)} KB</span> transferidos`},g=()=>{const e=document.getElementById("tab-info");e.innerHTML=`
        <p class="mb-2"><strong class="text-gray-400">User Agent:</strong> ${navigator.userAgent}</p>
        <p><strong class="text-gray-400">Viewport:</strong> ${window.innerWidth}x${window.innerHeight}</p>
    `};function v(e,t,n=0){if(["SCRIPT","STYLE","LINK","META"].includes(e.tagName))return;const o=document.createElement("details");o.style.marginLeft=`${15*n}px`,o.open=n<2;const l=document.createElement("summary");l.className="cursor-pointer hover:bg-gray-700 p-1 rounded",l.textContent=`<${e.tagName.toLowerCase()}>`,l.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),o.open=!o.open,w(e)}),o.appendChild(l),[...e.children].forEach(e=>v(e,o,n+1)),t.appendChild(o)}function w(e){const t=document.getElementById("style-inspector");t.innerHTML="";const n=document.createElement("h3");n.className="font-bold border-b border-gray-700 mb-2 pb-1",n.innerHTML=`Styles for <code>&lt;${e.tagName.toLowerCase()}&gt;</code>`,t.appendChild(n);const o=document.createElement("div");o.className="p-2 bg-gray-800 rounded";for(let t=0;t<e.style.length;t++){const n=e.style[t],l=e.style.getPropertyValue(n);o.innerHTML+=`<div><span class="text-purple-400">${n}</span>: <span class="text-green-400">${l}</span>;</div>`}t.appendChild(o)}document.getElementById("refresh-resources").addEventListener("click",b);const E=document.getElementById("element-picker-btn"),S=window.fetch;function L(e){e.preventDefault(),e.stopPropagation();const t=e.target;document.body.style.cursor="default",t.style.outline="",w(t),document.querySelectorAll("*:not(#dev-panel):not(#dev-panel *)").forEach(e=>{e.removeEventListener("mouseover",x),e.removeEventListener("mouseout",A),e.removeEventListener("click",L)})}function x(e){e.target.style.outline="2px solid #38bdf8"}function A(e){e.target.style.outline=""}E.addEventListener("click",()=>{document.body.style.cursor="crosshair",document.querySelectorAll("*:not(#dev-panel):not(#dev-panel *)").forEach(e=>{e.addEventListener("mouseover",x),e.addEventListener("mouseout",A),e.addEventListener("click",L)})}),window.fetch=function(...e){const t=performance.now(),n=e[0]instanceof Request?e[0].url:e[0],o=document.createElement("div");return o.className="flex justify-between items-center p-1 border-b border-gray-800",o.innerHTML=`<span>${n.substring(0,80)}...</span> <span class="loader"></span>`,document.getElementById("network-log").prepend(o),S.apply(this,e).then(e=>{const l=(performance.now()-t).toFixed(2),d=e.ok?"text-green-500":"text-red-500";return o.innerHTML=`<span>${n.substring(0,80)}...</span><span class="flex items-center gap-2"><span class="${d}">${e.status}</span><span class="text-gray-500">${l}ms</span></span>`,e}).catch(e=>{const n=(performance.now()-t).toFixed(2);throw o.innerHTML=`<span>${n.substring(0,80)}...</span><span class="flex items-center gap-2"><span class="text-red-500">Error</span><span class="text-gray-500">${n}ms</span></span>`,e})};const T=document.getElementById("run-accessibility-test"),C=document.getElementById("accessibility-results");function P(e,t,n){const o={minor:"bg-yellow-800 text-yellow-300",moderate:"bg-orange-800 text-orange-300",serious:"bg-red-800 text-red-300",critical:"bg-red-700 text-red-200 font-bold"};let l="";return e.nodes&&e.nodes.length>0&&(l="<ul>",e.nodes.forEach(e=>{l+=`<li class="mt-1"><code class="text-xs bg-gray-700 p-1 rounded">${e.target.join(", ")}</code></li>`}),l+="</ul>"),`
            <div class="p-3 border-l-4 border-${n}-500 bg-gray-800 mb-3 rounded-r">
                <div class="flex items-center justify-between">
                    <p class="font-semibold">${e.help}</p>
                    ${e.impact?`<span class="text-xs px-2 py-1 rounded-full ${o[e.impact]}">${e.impact}</span>`:""}
                </div>
                <p class="text-sm text-gray-400 mt-1">${e.description}</p>
                <div class="mt-2 text-sm text-gray-300">${l}</div>
                <a href="${e.helpUrl}" target="_blank" class="text-blue-400 text-xs hover:underline mt-2 inline-block">Saber mais...</a>
            </div>
        `}function I(){return new Promise((e,t)=>{let n=0;const o=setInterval(()=>{if("undefined"!=typeof axe)return clearInterval(o),e();(n+=1)>=25&&(clearInterval(o),t(new Error("Erro: A biblioteca de acessibilidade (axe-core) não carregou a tempo. Verifique sua conexão ou se um bloqueador de anúncios está impedindo o carregamento.")))},200)})}T.addEventListener("click",async()=>{C.innerHTML='<p class="text-yellow-400">Verificando a biblioteca de acessibilidade...</p>';try{await I(),C.innerHTML='<p class="text-yellow-400">Analisando...</p>';const e=await axe.run();(function(e){C.innerHTML="";const{violations:t,passes:n,incomplete:o}=e;let l=`<div class="mb-4 p-2 rounded bg-gray-800 flex justify-around">
            <span class="font-bold text-red-500">Violações: ${t.length}</span>
            <span class="font-bold text-yellow-500">Requer Revisão: ${o.length}</span>
            <span class="font-bold text-green-500">Aprovados: ${n.length}</span>
        </div>`;C.insertAdjacentHTML("beforeend",l),t.length>0&&(C.insertAdjacentHTML("beforeend",'<h3 class="text-lg font-bold text-red-400 mb-2">Violações Críticas</h3>'),t.forEach(e=>{const t=P(e,"error","red");C.insertAdjacentHTML("beforeend",t)})),o.length>0&&(C.insertAdjacentHTML("beforeend",'<h3 class="text-lg font-bold text-yellow-400 mt-4 mb-2">Itens que Requerem Revisão Manual</h3>'),o.forEach(e=>{const t=P(e,"warning","yellow");C.insertAdjacentHTML("beforeend",t)})),n.length>0&&0===t.length&&0===o.length&&C.insertAdjacentHTML("beforeend",'<p class="text-green-400 font-bold text-center mt-4">Parabéns! Nenhum problema de acessibilidade encontrado automaticamente.</p>')})(e)}catch(e){console.error("Erro no teste de acessibilidade:",e),C.innerHTML=`<p class="text-red-500">${e.message}</p>`}});const M=document.getElementById("test-results");document.getElementById("run-tests").addEventListener("click",async()=>{M.innerHTML="";const e=["css/style.css","js/script.js","js/dev-panel.js","index.html","algorithms.html","data-structures.html","search.html","status.html"];for(const t of e){let e,n;try{const o=await fetch(t,{method:"HEAD",cache:"no-store"});o.ok?(e="success",n="Arquivo encontrado e acessível."):(e="error",n=`Falha ao carregar o arquivo (Status: ${o.status}). Verifique o caminho.`)}catch(o){e="error",n="Erro de rede. Verifique se o servidor está online."}O(t,e,n)}});function O(e,t,n){const o={info:"ℹ️",success:"✅",warn:"⚠️",error:"❌"},l={info:"text-blue-400",success:"text-green-400",warn:"text-yellow-400",error:"text-red-400"},d=document.createElement("div");d.className=`flex items-start gap-2 border-b border-gray-800 py-1 ${l[t]}`,d.innerHTML=`<span>${o[t]}</span> <span class="font-bold w-48 flex-shrink-0">${e}</span> <span>${n}</span>`,M.appendChild(d)}window.onerror=function(e,t,n,o,l){console.error(`Erro global: ${e} em ${t}:${n}`),i.classList.remove("bg-green-500"),i.classList.add("bg-red-500"),i.parentElement.querySelector("span").textContent="Status: Error"}});
