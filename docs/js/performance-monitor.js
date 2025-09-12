document.addEventListener("DOMContentLoaded",()=>{const e=document.querySelector('meta[name="base-url"]')?.content||"",t=document.getElementById("performance-monitor-container");if(t){const o=[{name:"Página Principal",url:"index.html"},{name:"Página de Algoritmos",url:"algoritmos.html"},{name:"Página de Estruturas de Dados",url:"estruturas-de-dados.html"}],n={good:200,needsImprovement:500};t.innerHTML="",o.forEach(async o=>{let s,a,r;const i=performance.now();try{const t=await fetch(`${e}${o.url}`,{method:"HEAD",cache:"no-store"});if(s=(performance.now()-i).toFixed(0),!t.ok)throw new Error(`Status ${t.status}`)}catch(e){s=-1}a=s<0?{rating:"Erro",color:"text-red-500"}:s<=n.good?{rating:"Rápido",color:"text-green-500"}:s<=n.needsImprovement?{rating:"Moderado",color:"text-yellow-500"}:{rating:"Lento",color:"text-red-500"},r=s<0?"Falha no teste":`${s}ms`;const c=`
            <div class="flex flex-col gap-4 rounded-lg p-6 bg-[var(--background-secondary)] border border-[var(--secondary-color)]">
                <h3 class="text-lg font-semibold text-[var(--text-primary)]">${o.name}</h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <p class="text-[var(--text-secondary)]">Tempo de Resposta do Servidor</p>
                        <p class="font-bold ${a.color}">${r}</p>
                    </div>
                    <div class="flex justify-between items-center">
                        <p class="text-[var(--text-secondary)]">Classificação</p>
                        <p class="font-bold ${a.color}">${a.rating}</p>
                    </div>
                </div>
            </div>
        `;t.insertAdjacentHTML("beforeend",c)})}});
