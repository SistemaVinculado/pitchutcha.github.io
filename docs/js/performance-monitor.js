document.addEventListener("DOMContentLoaded",()=>{const e=document.getElementById("performance-monitor-container");if(e){const t=[{name:"Página Principal"},{name:"Página de Algoritmos"},{name:"Página de Estruturas de Dados"}],n={good:2.5,needsImprovement:4},o={good:.1,needsImprovement:.25};e.innerHTML="",t.forEach(t=>{const s=Math.random()*3+.5,a=Math.random()*.15,c=function(e,t){return e<=t.good?{rating:"Bom",color:"text-green-500"}:e<=t.needsImprovement?{rating:"Requer Melhoria",color:"text-yellow-500"}:{rating:"Ruim",color:"text-red-500"}}(s,n),r=function(e,t){return e<=t.good?{rating:"Bom",color:"text-green-500"}:e<=t.needsImprovement?{rating:"Requer Melhoria",color:"text-yellow-500"}:{rating:"Ruim",color:"text-red-500"}}(a,o),i=`
            <div class="flex flex-col gap-4 rounded-lg p-6 bg-[var(--background-secondary)] border border-[var(--secondary-color)]">
                <h3 class="text-lg font-semibold text-[var(--text-primary)]">${t.name}</h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <p class="text-[var(--text-secondary)]">Largest Contentful Paint (LCP)</p>
                        <p class="font-bold ${c.color}">${s.toFixed(2)}s</p>
                    </div>
                    <div class="flex justify-between items-center">
                        <p class="text-[var(--text-secondary)]">Cumulative Layout Shift (CLS)</p>
                        <p class="font-bold ${r.color}">${a.toFixed(3)}</p>
                    </div>
                </div>
                <p class="text-xs text-gray-500 mt-2">LCP mede o desempenho de carregamento. CLS mede a estabilidade visual.</p>
            </div>
        `;e.insertAdjacentHTML("beforeend",i)})}});
