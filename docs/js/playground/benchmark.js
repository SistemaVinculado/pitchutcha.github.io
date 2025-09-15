export async function runBenchmark(pyodide, codeA, codeB) {
    const resultsPanel = document.getElementById('benchmark-results-panel');
    resultsPanel.textContent = 'Iniciando benchmark... Isso pode levar alguns segundos.';
    document.getElementById('run-btn-benchmark').disabled = true;

    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        await pyodide.runPythonAsync(`
            import random
            dataset = list(range(1000, 0, -1))
            random.shuffle(dataset)
        `);

        const timeA = await timeExecution(pyodide, codeA);
        const timeB = await timeExecution(pyodide, codeB);

        const faster = Math.min(timeA, timeB);
        const slower = Math.max(timeA, timeB);
        const factor = (slower / faster).toFixed(2);

        let resultText = `--- RESULTADOS ---\n`;
        resultText += `Algoritmo A: ${timeA.toFixed(2)} ms\n`;
        resultText += `Algoritmo B: ${timeB.toFixed(2)} ms\n\n`;
        resultText += (timeA < timeB) ? `Algoritmo A foi ${factor}x mais rápido.` : `Algoritmo B foi ${factor}x mais rápido.`;
        resultsPanel.textContent = resultText;
        
    } catch(error) {
        resultsPanel.textContent = error.toString();
    } finally {
        document.getElementById('run-btn-benchmark').disabled = false;
    }
}

async function timeExecution(pyodide, code) {
    const startTime = performance.now();
    await pyodide.runPythonAsync(`${code}\nsort(dataset.copy())`);
    return performance.now() - startTime;
}
