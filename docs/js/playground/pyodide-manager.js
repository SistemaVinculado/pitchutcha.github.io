let pyodideInstance = null;
let isLoading = false;

async function load(statusCallback) {
    if (isLoading) return;
    isLoading = true;
    statusCallback('Carregando Pyodide...');
    
    // ATUALIZAÇÃO: A função `loadPyodide` agora está disponível globalmente
    // porque nós a carregamos com a tag <script> no HTML.
    // Não precisamos mais passar o indexURL, ele encontrará os pacotes
    // na mesma pasta do script principal.
    // @ts-ignore
    pyodideInstance = await loadPyodide();

    statusCallback('Ambiente Pronto');
    isLoading = false;
}

export async function getPyodideInstance(statusCallback) {
    if (!pyodideInstance && !isLoading) {
        await load(statusCallback);
    }
    // O resto do arquivo permanece o mesmo...
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
