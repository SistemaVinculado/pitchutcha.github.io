document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DO DOM ---
    const pyodideStatus = document.getElementById('pyodide-status');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    // Painel Editor Simples
    const editorContainerSimple = document.getElementById('editor-container-simple');
    const runBtnSimple = document.getElementById('run-btn-simple');
    const outputPanelSimple = document.getElementById('output-panel-simple');

    // Painel Benchmark
    const editorContainerBenchmarkA = document.getElementById('editor-container-benchmark-a');
    const editorContainerBenchmarkB = document.getElementById('editor-container-benchmark-b');
    const runBtnBenchmark = document.getElementById('run-btn-benchmark');
    const benchmarkResultsPanel = document.getElementById('benchmark-results-panel');

    // Painel Visualizador
    const editorContainerVisualizer = document.getElementById('editor-container-visualizer');
    const graphicVisualizerPanel = document.getElementById('graphic-visualizer-panel');
    const variablesPanel = document.getElementById('variables-panel');
    const vizResetBtn = document.getElementById('visualizer-reset-btn');
    const vizPrevBtn = document.getElementById('visualizer-prev-btn');
    const vizNextBtn = document.getElementById('visualizer-next-btn');

    // --- ESTADO GLOBAL ---
    let pyodide = null;
    let editorSimple, editorBenchmarkA, editorBenchmarkB, editorVisualizer;
    let executionHistory = [];
    let historyIndex = -1;

    // --- CÓDIGOS DE EXEMPLO ---
    const sampleCodeSimple = `print("Olá, Pitchutcha Playground!")`;
    const sampleCodeBenchmarkA = `# Algoritmo Lento: Bubble Sort
def sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr`;
    const sampleCodeBenchmarkB = `# Algoritmo Rápido: Timsort (nativo do Python)
def sort(arr):
  return sorted(arr)`;
    const sampleCodeVisualizer = `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr

meu_array = [64, 34, 25, 12, 22]
bubble_sort(meu_array)`;


    // --- INICIALIZAÇÃO ---
    async function main() {
        setupTabs();
        setupEditors();
        await loadPyodideRuntime();
        setupEventListeners();
    }

    function setupTabs() {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(`tab-${targetTab}`).classList.add('active');
            });
        });
    }

    function createEditor(container, code) {
        return CodeMirror(container, {
            value: code,
            lineNumbers: true,
            mode: 'python',
            theme: 'material-darker',
            indentUnit: 4,
        });
    }

    function setupEditors() {
        editorSimple = createEditor(editorContainerSimple, sampleCodeSimple);
        editorBenchmarkA = createEditor(editorContainerBenchmarkA, sampleCodeBenchmarkA);
        editorBenchmarkB = createEditor(editorContainerBenchmarkB, sampleCodeBenchmarkB);
        editorVisualizer = createEditor(editorContainerVisualizer, sampleCodeVisualizer);
    }

    async function loadPyodideRuntime() {
        pyodideStatus.textContent = 'Carregando Pyodide...';
        runBtnSimple.disabled = true; runBtnBenchmark.disabled = true; vizResetBtn.disabled = true;
        try {
            pyodide = await loadPyodide();
            pyodideStatus.textContent = 'Ambiente Pronto';
            runBtnSimple.disabled = false; runBtnBenchmark.disabled = false; vizResetBtn.disabled = false;
        } catch (error) {
            pyodideStatus.textContent = 'Erro no Pyodide';
            console.error(error);
        }
    }
    
    function setupEventListeners() {
        runBtnSimple.addEventListener('click', executeSimpleCode);
        runBtnBenchmark.addEventListener('click', executeBenchmark);
        vizResetBtn.addEventListener('click', runVisualizer);
        vizNextBtn.addEventListener('click', () => navigateHistory(1));
        vizPrevBtn.addEventListener('click', () => navigateHistory(-1));
    }
    
    // --- LÓGICA DO EDITOR SIMPLES ---
    async function executeSimpleCode() {
        const code = editorSimple.getValue();
        outputPanelSimple.textContent = 'Executando...';
        try {
            let capturedOutput = '';
            pyodide.setStdout({ batched: (str) => capturedOutput += str + '\n' });
            await pyodide.runPythonAsync(code);
            outputPanelSimple.textContent = capturedOutput || 'Código executado sem saída.';
        } catch (error) {
            outputPanelSimple.textContent = error.toString();
        }
    }

    // --- LÓGICA DO BENCHMARK ---
    async function executeBenchmark() {
        benchmarkResultsPanel.textContent = 'Iniciando benchmark...\nIsso pode levar alguns segundos.';
        runBtnBenchmark.disabled = true;

        await new Promise(resolve => setTimeout(resolve, 50)); // Delay for UI update

        try {
            const codeA = editorBenchmarkA.getValue();
            const codeB = editorBenchmarkB.getValue();
            
            // Cria um dataset grande
            await pyodide.runPythonAsync(`
                import random
                dataset = list(range(1000, 0, -1))
                random.shuffle(dataset)
            `);

            // Executa e cronometra o Algoritmo A
            const timeA_start = performance.now();
            await pyodide.runPythonAsync(`
${codeA}
sort(dataset.copy())`);
            const timeA_end = performance.now();
            const timeA = timeA_end - timeA_start;

            // Executa e cronometra o Algoritmo B
            const timeB_start = performance.now();
            await pyodide.runPythonAsync(`
${codeB}
sort(dataset.copy())`);
            const timeB_end = performance.now();
            const timeB = timeB_end - timeB_start;

            const faster = Math.min(timeA, timeB);
            const slower = Math.max(timeA, timeB);
            const factor = (slower / faster).toFixed(2);

            let resultText = `--- RESULTADOS ---\n`;
            resultText += `Algoritmo A: ${timeA.toFixed(2)} ms\n`;
            resultText += `Algoritmo B: ${timeB.toFixed(2)} ms\n\n`;
            if (timeA < timeB) {
                resultText += `Algoritmo A foi ${factor}x mais rápido.`;
            } else {
                resultText += `Algoritmo B foi ${factor}x mais rápido.`;
            }
            benchmarkResultsPanel.textContent = resultText;
            
        } catch(error) {
            benchmarkResultsPanel.textContent = error.toString();
        } finally {
            runBtnBenchmark.disabled = false;
        }
    }
    
    // --- LÓGICA DO VISUALIZADOR ---
    
    function instrumentCode(code) {
        // Esta é uma "instrumentação" simplificada via Regex.
        // Adiciona uma chamada a `_report_state` em linhas importantes.
        const lines = code.split('\n');
        const instrumentedLines = lines.map((line, index) => {
            const lineNumber = index + 1;
            // Captura atribuições e laços `for`
            if (line.trim().match(/(\w+\s*=\s*.*)|(for\s+\w+\s+in\s+.*:)/) && !line.trim().startsWith('def')) {
                 // Adiciona o report ANTES da linha original, com a indentação correta
                const indentation = line.match(/^\s*/)[0];
                return `${indentation}_report_state(${lineNumber}, locals())\n${line}`;
            }
            return line;
        });
        return instrumentedLines.join('\n');
    }

    async function runVisualizer() {
        const userCode = editorVisualizer.getValue();
        const instrumentedCode = instrumentCode(userCode);

        // Define a função Python que se comunicará com o JavaScript
        const setupCode = `
import json
history_log = []
def _report_state(line, vars):
    # Clona o dicionário e remove itens não serializáveis
    serializable_vars = {k: repr(v) for k, v in vars.items() if not k.startswith('_')}
    history_log.append({'line': line, 'vars': serializable_vars})

# Garante que a função está disponível globalmente
__builtins__._report_state = _report_state
`;
        
        try {
            await pyodide.runPythonAsync(setupCode);
            await pyodide.runPythonAsync(instrumentedCode);
            let rawHistory = pyodide.globals.get('history_log').toJs();
            executionHistory = rawHistory.map(item => ({line: item.line, vars: new Map(Object.entries(item.vars))}));

            historyIndex = 0;
            renderState(historyIndex);
            updateVizButtons();
        } catch (error) {
            alert("Erro ao analisar o código: " + error.message);
        }
    }
    
    function navigateHistory(direction) {
        const newIndex = historyIndex + direction;
        if (newIndex >= 0 && newIndex < executionHistory.length) {
            historyIndex = newIndex;
            renderState(historyIndex);
            updateVizButtons();
        }
    }

    let highlightedLine = null;
    function renderState(index) {
        if (highlightedLine) {
            editorVisualizer.removeLineClass(highlightedLine, 'background', 'line-highlight');
        }

        const state = executionHistory[index];
        const line = state.line - 1; // Ajuste para 0-index
        
        // Destaque da linha
        highlightedLine = editorVisualizer.getLineHandle(line);
        editorVisualizer.addLineClass(highlightedLine, 'background', 'line-highlight');

        // Painel de variáveis
        variablesPanel.textContent = '';
        state.vars.forEach((value, key) => {
            variablesPanel.textContent += `${key}: ${value}\n`;
        });
        
        // Visualizador gráfico (simples, para arrays)
        const arr = state.vars.get('arr') || state.vars.get('meu_array');
        if (arr) {
            try {
                // Tenta avaliar a representação string do array
                const arrayData = JSON.parse(arr.replace(/'/g, '"'));
                if (Array.isArray(arrayData)) {
                    renderArray(arrayData);
                }
            } catch (e) { /* Ignora se não for um array válido */ }
        }
    }
    
    function updateVizButtons() {
        vizResetBtn.disabled = false;
        vizPrevBtn.disabled = historyIndex <= 0;
        vizNextBtn.disabled = historyIndex >= executionHistory.length - 1;
    }

    function renderArray(arr) {
        graphicVisualizerPanel.innerHTML = '';
        const maxVal = Math.max(...arr);
        arr.forEach(val => {
            const bar = document.createElement('div');
            const percentageHeight = (val / maxVal) * 100;
            bar.style.height = `${percentageHeight}%`;
            bar.style.width = `100%`;
            bar.style.backgroundColor = `hsl(${(val/maxVal) * 240}, 80%, 60%)`;
            bar.className = 'transition-all duration-200';
            graphicVisualizerPanel.appendChild(bar);
        });
    }

    // --- INICIALIZA A APLICAÇÃO ---
    main();
});
