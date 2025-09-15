import { getEditorInstance } from './editor.js';

let editors = {};

export function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
            // Atualiza o layout do editor ativo para garantir a renderização correta
            getActiveEditor()?.refresh();
        });
    });
}

export function setupButtons(actions) {
    document.getElementById('run-btn-simple').addEventListener('click', actions.runSimple);
    document.getElementById('run-btn-benchmark').addEventListener('click', actions.runBenchmark);
    document.getElementById('visualizer-reset-btn').addEventListener('click', actions.runVisualizer);
}

export function updatePyodideStatus(status) {
    const statusEl = document.getElementById('pyodide-status');
    if (statusEl) statusEl.textContent = status;
}

export function getActiveEditor() {
    const activeTab = document.querySelector('.tab-panel.active');
    if (!activeTab) return null;
    const editorId = activeTab.querySelector('.CodeMirror')?.id.replace('editor-container-', '');
    return getEditorInstance(editorId.replace('-a', 'A').replace('-b', 'B'));
}
