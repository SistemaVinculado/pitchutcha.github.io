document.addEventListener("DOMContentLoaded",()=>{const e=document.getElementById("performance-monitor-container");if(e){const t=[{name:"Página Principal",url:"index.html"},{name:"Página de Algoritmos",url:"algoritmos.html"},{name:"Página de Estruturas de Dados",url:"estruturas-de-dados.html"}],n={good:2500,needsImprovement:4e3},o={good:.1,needsImprovement:.25};async function s(){for(const e of t)await a(e)}function a(t){return new Promise(s=>{const a=document.createElement("iframe");a.src=t.url,a.style.display="none",document.body.appendChild(a),a.onload=()=>{const c=a.contentWindow;let r={value:0},i={value:0};try{const l=new c.PerformanceObserver(e=>{const t=e.getEntries();t.forEach(e=>{("largest-contentful-paint"===e.entryType&&(r=e),"layout-shift"===e.entryType&&(i.value+=e.value))})});l.observe({type:["largest-contentful-paint","layout-shift"],buffered:!0})}catch(l){console.error("PerformanceObserver não suportado ou falhou.",l)}setTimeout(()=>{(function(t,s,a){const c=function(e,t){return e<=t.good?{rating:"Bom",color:"text-green-500"}:e<=t.needsImprovement?{rating:"Requer Melhoria",color:"text-yellow-500"}:{rating:"Ruim",color:"text-red-500"}}(s.value,n),r=function(e,t){return e<=t.good?{rating:"Bom",color:"text-green-500"}:e<=t.needsImprovement?{rating:"Requer Melhoria",color:"text-yellow-500"}:{rating:"Ruim",color:"text-red-500"}}(a.value,o),i=`
            <div class="flex flex-col gap-4 rounded-lg p-6 bg-[var(--background-secondary)] border border-[var(--secondary-color)]">
                <h3 class="text-lg font-semibold text-[var(--text-primary)]">${t}</h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <p class="text-[var(--text-secondary)]">Largest Contentful Paint (LCP)</p>
                        <p class="font-bold ${c.color}">${(s.value/1e3).toFixed(2)}s</p>
                    </div>
                    <div class="flex justify-between items-center">
                        <p class="text-[var(--text-secondary)]">Cumulative Layout Shift (CLS)</p>
                        <p class="font-bold ${r.color}">${a.value.toFixed(3)}</p>
                    </div>
                </div>
                <p class="text-xs text-gray-500 mt-2">LCP mede o desempenho de carregamento. CLS mede a estabilidade visual.</p>
            </div>
        `;e.insertAdjacentHTML("beforeend",i)})(t.name,r,i),document.body.removeChild(a),s()},3e3)}})}s()}});
