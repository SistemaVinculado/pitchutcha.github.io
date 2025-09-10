document.addEventListener("DOMContentLoaded",()=>{if(window.self!==window.top)return;const e=`
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
    `;document.body.insertAdjacentHTML("beforeend",e);const t=document.getElementById("dev-tools-trigger"),n=document.getElementById("dev-panel"),o=document.getElementById("dev-panel-close"),l=document.querySelectorAll(".dev-tab"),d=document.querySelectorAll(".dev-tab-content"),c=document.getElementById("console-output"),r=document.getElementById("console-input"),s=document.getElementById("status-indicator");t.addEventListener("click",()=>n.classList.toggle("hidden")),o.addEventListener("click",()=>n.classList.add("hidden")),l.forEach(e=>{e.addEventListener("click",()=>{l.forEach(e=>e.classList.remove("active-tab")),e.classList.add("active--tab");const t=`tab-${e.dataset.tab}`;d.forEach(e=>{e.classList.add("hidden"),e.id===t&&e.classList.remove("hidden")})})});const i=[],a=[];let u=-1,m=-1;function p(e,t){const n={log:"📝",info:"ℹ️",warn:"⚠️",error:"❌"},o={log:"text-gray-300",info:"text-blue-400",warn:"text-yellow-400",error:"text-red-400"},l=document.createElement("div");l.className=`flex items-start gap-2 border-b border-gray-800 py-1 ${o[e]}`;const d=new Date().toLocaleTimeString();let r=`<span class="flex-shrink-0">${n[e]}</span> <span class="flex-shrink-0 text-gray-500">${d}</span> <div class="break-all">`;r+=[...t].map(e=>"object"==typeof e?JSON.stringify(e,null,2):e).join(" "),"</div>",l.innerHTML=r,c.appendChild(l),c.scrollTop=c.scrollHeight,i.push({type:e,timestamp:d,args:[...t]})}const y={};["log","warn","info","error"].forEach(e=>{y[e]=console[e],console[e]=(...t)=>{y[e](...t),p(e,t)}}),document.getElementById("clear-console").addEventListener("click",()=>{c.innerHTML="",i.length=0}),document.getElementById("export-console").addEventListener("click",()=>{const e=new Blob([JSON.stringify(i,null,2)],{type:"application/json"}),t=URL.createObjectURL(e),n=document.createElement("a");n.href=t,n.download="console-log.json",n.click(),URL.revokeObjectURL(t)}),r.addEventListener("keydown",e=>{if("Enter"===e.key&&r.value){const e=r.value;console.log(">",e),a.push(e),m=a.length;try{const t=new Function(`return ${e}`)();console.info("=",t)}catch(t){console.error(t.message)}r.value=""}else"ArrowUp"===e.key?m>0&&(m--,r.value=a[m]):"ArrowDown"===e.key&&(m<a.length-1?(m++,r.value=a[m]):(r.value="",m=a.length))});const h=document.getElementById("dom-tree"),f=document.getElementById("style-rules");function b(e,t,n=0){if(["SCRIPT","STYLE","LINK","META"].includes(e.tagName))return;const o=document.createElement("details");o.style.marginLeft=`${15*n}px`,o.open=n<2;const l=document.createElement("summary");l.className="cursor-pointer hover:bg-gray-700 p-1 rounded",l.textContent=`<${e.tagName.toLowerCase()}>`,l.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),o.open=!o.open,v(e)}),o.appendChild(l),[...e.children].forEach(e=>b(e,o,n+1)),t.appendChild(o)}b(document.documentElement,h);function g(e,t,n,o){const l=document.createElement("div");l.innerHTML=`<span contenteditable="true" class="style-prop text-purple-400">${e||"property"}</span>: <span contenteditable="true" class="style-value text-green-400">${t||"value"}</span>;`;const d=()=>{n.style.cssText="";const e=o.querySelectorAll(".style-prop"),t=o.querySelectorAll(".style-value");e.forEach((e,o)=>{const l=e.textContent.trim(),d=t[o].textContent.trim();l&&n.style.setProperty(l,d)})};return l.querySelector(".style-prop").addEventListener("blur",d),l.querySelector(".style-value").addEventListener("blur",d),l}function v(e){f.innerHTML="";const t=document.createElement("h3");t.className="font-bold border-b border-gray-700 mb-2 pb-1",t.innerHTML=`Styles for <code><${e.tagName.toLowerCase()}></code>`,f.appendChild(t);const n=document.createElement("div");n.className="p-2 bg-gray-800 rounded";const o=document.createElement("button");o.textContent="+ Add property",o.className="dev-button mt-2",o.onclick=()=>{const e=g("","",e,n);n.appendChild(e)};for(let t=0;t<e.style.length;t++){const o=e.style[t],l=e.style.getPropertyValue(o);n.appendChild(g(o,l,e,n))}f.appendChild(n),f.appendChild(o)}const w=document.getElementById("network-log"),E=window.fetch;window.fetch=function(...e){const t=performance.now(),n=e[0]instanceof Request?e[0].url:e[0],o=document.createElement("div");return o.className="flex justify-between items-center p-1 border-b border-gray-800",o.innerHTML=`<span>${n.substring(0,80)}...</span> <span class="loader"></span>`,w.prepend(o),E.apply(this,e).then(e=>{const l=(performance.now()-t).toFixed(2),d=e.ok?"text-green-500":"text-red-500";return o.innerHTML=`<span>${n.substring(0,80)}...</span><span class="flex items-center gap-2"><span class="${d}">${e.status}</span><span class="text-gray-500">${l}ms</span></span>`,e}).catch(e=>{const n=(performance.now()-t).toFixed(2);throw o.innerHTML=`<span>${n.substring(0,80)}...</span><span class="flex items-center gap-2"><span class="text-red-500">Error</span><span class="text-gray-500">${n}ms</span></span>`,e})};const k=document.getElementById("test-results");document.getElementById("run-tests").addEventListener("click",async()=>{k.innerHTML="";const e=["css/style.css","js/script.js","js/dev-panel.js","index.html","algorithms.html","data-structures.html","search.html","status.html"];for(const t of e){let e,n;try{const o=await fetch(t,{method:"HEAD",cache:"no-store"});o.ok?(e="success",n="Arquivo encontrado e acessível."):(e="error",n=`Falha ao carregar o arquivo (Status: ${o.status}). Verifique o caminho.`)}catch(o){e="error",n="Erro de rede. Verifique se o arquivo existe e o servidor está online."}S(t,e,n)}});function S(e,t,n){const o={info:"ℹ️",success:"✅",warn:"⚠️",error:"❌"},l={info:"text-blue-400",success:"text-green-400",warn:"text-yellow-400",error:"text-red-400"},d=document.createElement("div");d.className=`flex items-start gap-2 border-b border-gray-800 py-1 ${l[t]}`,d.innerHTML=`<span>${o[t]}</span> <span class="font-bold w-48 flex-shrink-0">${e}</span> <span>${n}</span>`,k.appendChild(d)}window.onerror=function(e,t,n,o,l){console.error(`Erro global: ${e} em ${t}:${n}`),s.classList.remove("bg-green-500"),s.classList.add("bg-red-500"),s.parentElement.querySelector("span").textContent="Status: Error"}});
