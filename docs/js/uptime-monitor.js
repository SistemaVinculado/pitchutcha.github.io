document.addEventListener("DOMContentLoaded",()=>{const e=document.getElementById("uptime-history-container"),t=document.getElementById("incidents-history-container"),n=document.getElementById("metric-api-latency"),o=document.getElementById("metric-inference-time"),a=document.getElementById("metric-error-rate");if(e&&t){const c=c=>{if(!c)return"N/A";const e=new Date(1e3*c);return e.toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})},r=c=>{switch(c){case 1:return{text:"Pausa",color:"text-yellow-400",icon:"pause_circle"};case 2:return{text:"Iniciado",color:"text-green-400",icon:"check_circle"};case 9:return{text:"Parece estar fora",color:"text-red-500",icon:"error"};case 8:return{text:"Parece estar online",color:"text-green-400",icon:"check_circle"};default:return{text:`Evento (${c})`,color:"text-gray-400",icon:"info"}}};fetch("uptime-data.json?cache_bust="+Date.now()).then(c=>{if(!c.ok)throw new Error("Não foi possível carregar os dados de uptime.");return c.json()}).then(s=>{if("ok"!==s.stat||!s.monitors||0===s.monitors.length)throw new Error("Os dados de uptime retornaram um erro: "+(s.error?.message||"Formato inválido"));const i=s.monitors[0];if(n&&o&&a&&s.metrics){n.textContent=s.metrics.api_latency||"--ms",o.textContent=s.metrics.inference_time||"--ms",a.textContent=s.metrics.error_rate||"--%"}const d=i.custom_uptime_ratio.split("-"),l=`
                <div class="p-6 bg-[#161b22] border border-[#30363d] rounded-lg">
                    <h3 class="font-semibold text-white">Uptime Histórico</h3>
                    <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="text-center">
                            <p class="text-3xl font-bold text-green-400">${d[0]}%</p>
                            <p class="text-sm text-gray-400">Últimos 7 dias</p>
                        </div>
                        <div class="text-center">
                            <p class="text-3xl font-bold text-green-400">${d[1]}%</p>
                            <p class="text-sm text-gray-400">Últimos 30 dias</p>
                        </div>
                    </div>
                </div>
            `;e.innerHTML=l;let m=`
                 <div class="p-6 bg-[#161b22] border border-[#30363d] rounded-lg">
                    <h3 class="font-semibold text-white mb-4">Histórico de Incidentes Recentes</h3>
                    <ul class="space-y-4">
            `;i.logs&&i.logs.length>0?i.logs.forEach(e=>{const t=r(e.type);m+=`
                        <li class="flex items-start gap-3">
                            <span class="material-symbols-outlined ${t.color}">${t.icon}</span>
                            <div>
                                <p class="font-medium ${t.color}">${t.text}</p>
                                <p class="text-sm text-gray-500">${c(e.datetime)} (Duração: ${e.duration}s)</p>
                            </div>
                        </li>
                    `}):m+='<li><p class="text-gray-400">Nenhum incidente registrado recentemente.</p></li>',m+="</ul></div>",t.innerHTML=m}).catch(n=>{console.error("Erro ao processar dados de uptime:",n),e.innerHTML='<p class="text-red-500">Erro ao carregar dados de Uptime.</p>',t.innerHTML='<p class="text-red-500">Erro ao carregar histórico de incidentes.</p>'})}});
