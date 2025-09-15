const editorInstances = {};

const sampleCodes = {
    simple: `print("Olá, Pitchutcha Playground!")`,
    benchmarkA: `# Algoritmo Lento: Bubble Sort\ndef sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr`,
    benchmarkB: `# Algoritmo Rápido: Timsort (nativo)\ndef sort(arr):\n  return sorted(arr)`,
    visualizer: `def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr\n\nmeu_array = [64, 34, 25, 12, 22, 11, 90]\nbubble_sort(meu_array)`
};

function createEditor(containerId, code) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    return CodeMirror(container, {
        value: code,
        lineNumbers: true,
        mode: 'python',
        theme: 'material-darker',
        indentUnit: 4,
    });
}

export function initializeEditors() {
    editorInstances.simple = createEditor('editor-container-simple', sampleCodes.simple);
    editorInstances.benchmarkA = createEditor('editor-container-benchmark-a', sampleCodes.benchmarkA);
    editorInstances.benchmarkB = createEditor('editor-container-benchmark-b', sampleCodes.benchmarkB);
    editorInstances.visualizer = createEditor('editor-container-visualizer', sampleCodes.visualizer);
}

export function getEditorInstance(id) {
    return editorInstances[id];
}
