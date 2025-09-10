document.addEventListener("DOMContentLoaded",()=>{const e=document.getElementById("overall-status-indicator"),t=document.getElementById("overall-status-text"),n=document.getElementById("detailed-status-container");if(e&&n){const o=[{name:"Página Principal",url:"index.html",type:"Página"},{name:"Página de Algoritmos",url:"algorithms.html",type:"Página"},{name:"Página de Estrutura de Dados",url:"data-structures.html",type:"Página"},{name:"Página de Busca",url:"search.html",type:"Página"},{name:"Página de Status",url:"status.html",type:"Página"},{name:"CSS Principal",url:"css/style.css",type:"Recurso"},{name:"JS Principal",url:"js/script.js",type:"Recurso"},{name:"JS da Busca",url:"js/search.js",type:"Recurso"},{name:"Painel de Dev",url:"js/dev-panel.js",type:"Recurso"},{name:"Banco de Dados da Busca",url:"search.json",type:"Recurso",checkIntegrity:!0}],a=1e3;async function s(){let s="operational";for(const c of o){const o=performance.now();let r="outage",l="";try{const u=await fetch(c.url,{cache:"no-store"}),d=performance.now()-o;u.ok?c.checkIntegrity?await u.text().then(e=>{""===e.trim()?(r="outage",l="Falha: Arquivo está vazio. Dica: Verifique se o conteúdo não foi apagado.",s="outage"):(JSON.parse(e),r="operational",l=`Componente íntegro e operacional (${d.toFixed(0)}ms).`)}):(d>a?(r="degraded",l=`Aviso: Componente com lentidão (${d.toFixed(0)}ms). Dica: Verifique o tamanho do arquivo.`,"operational"===s&&(s="degraded")):(r="operational",l=`Componente operacional (${d.toFixed(0)}ms).`)):(r="outage",l=`Falha: Arquivo não encontrado (Erro ${u.status}). Dica: Verifique o nome e o caminho do arquivo.`,s="outage")}catch(e){r="outage",l=`Falha Crítica: ${e.message}. Dica: Verifique se o arquivo está corrompido ou se há erro de rede.`,s="outage"}i(c.name,r,l)}c(s)}function i(e,t,o){const a={operational:{color:"green",text:"Operational",pulseColor:"ping-green"},degraded:{color:"yellow",text:"Degraded",pulseColor:"ping-yellow"},outage:{color:"red",text:"Outage",pulseColor:"ping-red"}},s=a[t]||{color:"gray",text:"Unknown",pulseColor:""};const c=`
            <div class="flex items-center justify-between p-4 border-b border-[#30363d] last:border-b-0">
                <div>
                    <p class="text-white font-semibold">${e}</p>
                    <p class="text-sm text-gray-400">${o}</p>
                </div>
                <div class="flex items-center gap-2 text-sm">
                    <span class="relative flex h-3 w-3">
                        <span class="ping-pulse ${s.pulseColor} text-${s.color}-400"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 ${s.pulseColor}"></span>
                    </span>
                    <span class="capitalize text-${s.color}-400">${s.text}</span>
                </div>
            </div>
        `;n.insertAdjacentHTML("beforeend",c)}function c(n){const o={operational:{pulseColor:"ping-green",text:"All Systems Operational",textColor:"text-green-400"},degraded:{pulseColor:"ping-yellow",text:"Degraded Performance",textColor:"text-yellow-400"},outage:{pulseColor:"ping-red",text:"Major System Outage",textColor:"text-red-400"}},a=o[n];const s=`
            <span class="ping-pulse ${a.pulseColor} text-${a.pulseColor.replace("ping-","")}-400"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 ${a.pulseColor}"></span>
        `;e.innerHTML=s,t.className=a.textColor,t.textContent=a.text}s()}});
