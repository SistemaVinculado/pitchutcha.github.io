document.addEventListener("DOMContentLoaded",()=>{const e=document.getElementById("overall-status-indicator"),t=document.getElementById("overall-status-text"),n=document.getElementById("detailed-status-container");if(e&&n){const o=[{name:"Página Principal",url:"index.html",type:"Página"},{name:"Página de Saúde",url:"saude.html",type:"Página"},{name:"Página de Busca",url:"search.html",type:"Página"},{name:"Página de Status",url:"status.html",type:"Página"},{name:"CSS Principal",url:"css/style.css",type:"Recurso"},{name:"JS Principal",url:"js/script.js",type:"Recurso"},{name:"JS da Busca",url:"js/search.js",type:"Recurso"},{name:"Painel de Dev",url:"js/dev-panel.js",type:"Recurso"},{name:"Banco de Dados da Busca",url:"search.json",type:"Recurso",checkIntegrity:!0}],s=1e3;async function a(){let a="operational";for(const c of o){const o=performance.now();let r="outage",l="";try{const d=await fetch(c.url,{cache:"no-store"}),i=performance.now()-o;d.ok?c.checkIntegrity?await d.text().then(e=>{""===e.trim()?(r="outage",l="Falha: Arquivo está vazio. Dica: Verifique se o conteúdo não foi apagado.",a="outage"):(JSON.parse(e),r="operational",l=`Componente íntegro e operacional (${i.toFixed(0)}ms).`)}):i>s?(r="degraded",l=`Aviso: Componente com lentidão (${i.toFixed(0)}ms). Dica: Verifique o tamanho do arquivo.`,"operational"===a&&(a="degraded")):(r="operational",l=`Componente operacional (${i.toFixed(0)}ms).`):(r="outage",l=`Falha: Arquivo não encontrado (Erro ${d.status}). Dica: Verifique o nome e o caminho do arquivo.`,a="outage")}catch(e){r="outage",l=`Falha Crítica: ${e.message}. Dica: Verifique se o arquivo está corrompido ou se há erro de rede.`,a="outage"}c(c.name,r,l)}r(a)}function c(e,o,s){const a={operational:{text:"Operational",pulseColor:"ping-green",dotColor:"bg-green-500",textColor:"text-green-600"},degraded:{text:"Degraded",pulseColor:"ping-yellow",dotColor:"bg-yellow-500",textColor:"text-yellow-600"},outage:{text:"Outage",pulseColor:"ping-red",dotColor:"bg-red-500",textColor:"text-red-500"}},c=a[o]||{text:"Unknown",pulseColor:"ping-gray",dotColor:"bg-gray-400",textColor:"text-gray-400"},r=`
 <div class="flex items-center justify-between p-4 border-b border-[var(--secondary-color)] last:border-b-0">
 <div>
 <p class="text-[var(--text-primary)] font-semibold">${e}</p>
 <p class="text-sm text-[var(--text-secondary)]">${s}</p>
 </div>
 <div class="flex items-center gap-2 text-sm">
 <span class="relative flex h-3 w-3">
 <span class="ping-pulse ${c.pulseColor}"></span>
 <span class="relative inline-flex rounded-full h-3 w-3 ${c.dotColor}"></span>
 </span>
 <span class="capitalize font-medium ${c.textColor}">${c.text}</span>
 </div>
 </div>
 `;n.insertAdjacentHTML("beforeend",r)}function r(n){const o={operational:{pulseColor:"ping-green",dotColor:"bg-green-500",text:"Todos os sistemas operacionais",textColor:"text-green-600"},degraded:{pulseColor:"ping-yellow",dotColor:"bg-yellow-500",text:"Performance degradada",textColor:"text-yellow-600"},outage:{pulseColor:"ping-red",dotColor:"bg-red-500",text:"Falha crítica no sistema",textColor:"text-red-500"}},s=o[n]||o.degraded,a=`
 <span class="ping-pulse ${s.pulseColor}"></span>
 <span class="relative inline-flex rounded-full h-3 w-3 ${s.dotColor}"></span>
 `;e.innerHTML=a,t.className=s.textColor,t.textContent=s.text}a()}});
