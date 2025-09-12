document.addEventListener("DOMContentLoaded",()=>{
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';
    const latencyChartSVG = document.getElementById("latency-chart-svg");
    const inferenceChartContainer = document.getElementById("inference-chart-container");
    const avgLatencyEl = document.getElementById("chart-avg-latency");
    const avgInferenceEl = document.getElementById("chart-avg-inference");

    if (latencyChartSVG && inferenceChartContainer) {
        
        const renderCharts = (data) => {
            if (!data.graphs || !data.graphs.latency_history || !data.graphs.inference_by_model) {
                console.error("Dados do gráfico não encontrados no arquivo JSON.");
                return;
            }
            
            // Render Latency Chart
            const latencyData = data.graphs.latency_history;
            if (latencyData && latencyData.length > 0) {
                const avg = latencyData.reduce((a, b) => a + b, 0) / latencyData.length;
                if(avgLatencyEl) avgLatencyEl.textContent = `Média: ${avg.toFixed(0)}ms`;

                let pathData = `M 0,${150 - latencyData[0]}`;
                for (let i = 0; i < latencyData.length - 1; i++) {
                    const x1 = i * (472 / (latencyData.length - 1));
                    const y1 = 150 - latencyData[i];
                    const x2 = (i + 1) * (472 / (latencyData.length - 1));
                    const y2 = 150 - latencyData[i + 1];
                    const cx = (x1 + x2) / 2;
                    const cy = (y1 + y2) / 2;
                    pathData += ` Q ${x1},${y1} ${cx},${cy}`;
                }
                
                const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const areaPathData = `${pathData} V 150 H 0 Z`;

                linePath.setAttribute("d", pathData);
                linePath.setAttribute("stroke", "#4a90e2");
                linePath.setAttribute("stroke-width", "2");
                linePath.setAttribute("fill", "none");
                linePath.setAttribute("stroke-linecap", "round");

                areaPath.setAttribute("d", areaPathData);
                areaPath.setAttribute("fill", "url(#paint0_linear_area)");

                latencyChartSVG.querySelectorAll("path").forEach(p => p.remove());
                latencyChartSVG.appendChild(areaPath);
                latencyChartSVG.appendChild(linePath);

            } else {
                if(avgLatencyEl) avgLatencyEl.textContent = "Média: --ms";
                latencyChartSVG.innerHTML = '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9CA3AF" font-size="14">Sem dados disponíveis</text>';
            }

            // Render Inference Chart
            const inferenceData = data.graphs.inference_by_model;
            if (inferenceData && inferenceData.length > 0) {
                const total = inferenceData.reduce((sum, item) => sum + item.time, 0);
                const avg = total / inferenceData.length;
                if(avgInferenceEl) avgInferenceEl.textContent = `Média: ${avg.toFixed(0)}ms`;

                inferenceChartContainer.innerHTML = "";
                const maxTime = Math.max(...inferenceData.map(d => d.time), 1);
                
                inferenceData.forEach(item => {
                    const barHeight = (item.time / maxTime) * 100;
                    const barHTML = `
              <div class="flex flex-col items-center gap-2">
                  <div class="w-full bg-[#30363d] rounded-t-sm" style="height: 100%;">
                      <div class="h-full w-full bg-[#4a90e2] rounded-t-sm" style="height: ${barHeight}%;"></div>
                  </div>
                  <p class="text-gray-400 text-xs text-center">${item.model}</p>
              </div>
            `;
                    inferenceChartContainer.insertAdjacentHTML("beforeend", barHTML);
                });
            } else {
                if(avgInferenceEl) avgInferenceEl.textContent = "Média: --ms";
                inferenceChartContainer.innerHTML = '<p class="text-gray-400 text-center col-span-5">Sem dados disponíveis</p>';
            }
        };

        fetch(`${baseUrl}uptime-data.json?cache_bust=` + Date.now())
            .then(response => response.ok ? response.json() : Promise.reject("Falha ao carregar dados de uptime."))
            .then(data => renderCharts(data))
            .catch(error => console.error("Erro ao renderizar gráficos:", error));
    }
});
