document.addEventListener("DOMContentLoaded",()=>{const e=document.getElementById("performance-monitor-container");if(e){const t=[{name:"Página Principal",url:"index.html"},{name:"Página de Saúde",url:"saude.html"}],n={good:200,needsImprovement:500};e.innerHTML="",t.forEach(async t=>{let o,s,a;const c=performance.now();try{const e=await fetch(t.url,{method:"HEAD",cache:"no-store"});if(o=(performance.now()-c).toFixed(0),!e.ok)throw new Error(`Status ${e.status}`)}catch(e){o=-1}s=o<0?{rating:"Erro",color:"text-red-500"}:o<=n.good?{rating:"Rápido",color:"text-green-500"}:o<=n.needsImprovement?{rating:"Moderado",color:"text-yellow-500"}:{rating:"Lento",color:"text-red-500"},a=o<0?"Falha no teste":`${o}ms`;const r=`
            <div class="flex flex-col gap-4 rounded-lg p-6 bg-[var(--background-secondary)] border border-[var(--secondary-color)]">
                <h3 class="text-lg font-semibold text-[var(--text-primary)]">${t.name}</h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <p class="text-[var(--text-secondary)]">Tempo de Resposta do Servidor</p>
                        <p class="font-bold ${s.color}">${a}</p>
                    </div>
                    <div class="flex justify-between items-center">
                        <p class="text-[var(--text-secondary)]">Classificação</p>
                        <p class="font-bold ${s.color}">${s.rating}</p>
                    </div>
                </div>
            </div>
        `;e.insertAdjacentHTML("beforeend",r)})}});
