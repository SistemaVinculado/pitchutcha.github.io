let pyodideInstance = null;
let isLoading = false;

async function load(statusCallback) {
    if (isLoading) return;
    isLoading = true;
    statusCallback('Carregando Pyodide...');
    
    // @ts-ignore
    pyodideInstance = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/"
    });

    statusCallback('Ambiente Pronto');
    isLoading = false;
}

export async function getPyodideInstance(statusCallback) {
    if (!pyodideInstance && !isLoading) {
        await load(statusCallback);
    }
    return {
        run: async (code) => {
            if (!pyodideInstance) return "Pyodide não carregado.";
            try {
                let capturedOutput = '';
                pyodideInstance.setStdout({ batched: (str) => capturedOutput += str + '\n' });
                pyodideInstance.setStderr({ batched: (str) => capturedOutput += `[ERRO] ${str}\n` });
                await pyodideInstance.runPythonAsync(code);
                return capturedOutput || 'Código executado sem saída.';
            } catch (error) {
                return error.toString();
            }
        },
        get: (name) => pyodideInstance.globals.get(name),
        runPythonAsync: (code) => pyodideInstance.runPythonAsync(code),
    };
}
