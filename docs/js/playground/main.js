import { setupTabs, setupButtons, updatePyodideStatus, getActiveEditor } from './ui.js';
import { initializeEditors, getEditorInstance } from './editor.js';
import { getPyodideInstance } from './pyodide-manager.js';
import { runBenchmark } from './benchmark.js';
import { runVisualizer } from './visualizer.js';
import { saveState, loadState } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeEditors();
    setupTabs();
    
    const initialState = loadState();
    if (initialState) {
        for (const [editorId, code] of Object.entries(initialState)) {
            const editor = getEditorInstance(editorId);
            if (editor) editor.setValue(code);
        }
    }

    setupButtons({
        runSimple: async () => {
            const pyodide = await getPyodideInstance(updatePyodideStatus);
            const output = await pyodide.run(getActiveEditor().getValue());
            document.getElementById('output-panel-simple').textContent = output;
        },
        runBenchmark: async () => {
            const pyodide = await getPyodideInstance(updatePyodideStatus);
            const editorA = getEditorInstance('benchmarkA');
            const editorB = getEditorInstance('benchmarkB');
            runBenchmark(pyodide, editorA.getValue(), editorB.getValue());
        },
        runVisualizer: async () => {
            const pyodide = await getPyodideInstance(updatePyodideStatus);
            const editor = getEditorInstance('visualizer');
            runVisualizer(pyodide, editor.getValue());
        }
    });

    // Salva o estado sempre que o código em qualquer editor é alterado
    ['simple', 'benchmarkA', 'benchmarkB', 'visualizer'].forEach(id => {
        getEditorInstance(id).on('change', () => saveState({
            simple: getEditorInstance('simple').getValue(),
            benchmarkA: getEditorInstance('benchmarkA').getValue(),
            benchmarkB: getEditorInstance('benchmarkB').getValue(),
            visualizer: getEditorInstance('visualizer').getValue(),
        }));
    });
});
