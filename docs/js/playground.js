document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DO DOM ---
    const editorContainer = document.getElementById('editor-container');
    const outputPanel = document.getElementById('output-panel');
    const diagnosticsPanel = document.getElementById('diagnostics-panel');
    const runBtn = document.getElementById('run-btn');
    const restoreBtn = document.getElementById('restore-btn');
    const copyBtn = document.getElementById('copy-btn');
    const shareBtn = document.getElementById('share-btn');
    
    let editor;
    let originalCode = '';
    let pyodide = null;
    let language = 'python';

    // --- INICIALIZAÇÃO ---

    // 1. Configurar o Editor CodeMirror
    editor = CodeMirror(editorContainer, {
        lineNumbers: true,
        mode: 'python', // Padrão
        theme: 'material-darker',
        indentUnit: 4,
    });

    // 2. Carregar Pyodide (para rodar Python)
    setStatus('Carregando ambiente Python (Pyodide)...');
    runBtn.disabled = true;
    try {
        pyodide = await loadPyodide();
        setStatus('Ambiente pronto.');
        runBtn.disabled = false;
    } catch (error) {
        setStatus('Erro ao carregar o ambiente Python.');
        console.error(error);
    }
    
    // 3. Carregar código da URL
    const urlParams = new URLSearchParams(window.location.search);
    const encodedCode = urlParams.get('code');
    language = urlParams.get('lang') || 'python';

    if (encodedCode) {
        try {
            originalCode = atob(encodedCode);
            editor.setValue(originalCode);
            editor.setOption("mode", language);
        } catch (e) {
            editor.setValue("# Erro: Não foi possível carregar o código da URL.");
        }
    } else {
        originalCode = "# Bem-vindo ao Playground!\n# Cole seu código aqui ou volte e clique em 'Editar' em um artigo.";
        editor.setValue(originalCode);
    }

    // --- FUNÇÕES DOS BOTÕES ---

    runBtn.addEventListener('click', runCode);
    restoreBtn.addEventListener('click', () => editor.setValue(originalCode));
    copyBtn.addEventListener('click', copyCode);
    shareBtn.addEventListener('click', shareCode);

    function setStatus(message) {
        outputPanel.textContent = message;
    }

    async function runCode() {
        if (!pyodide) {
            setStatus('Ambiente Python ainda não está pronto.');
            return;
        }

        const code = editor.getValue();
        setStatus('Executando...');
        runDiagnostics(code);

        try {
            // Redireciona a saída do Python (print) para o nosso painel
            let capturedOutput = '';
            pyodide.setStdout({ batched: (str) => capturedOutput += str + '\n' });
            pyodide.setStderr({ batched: (str) => capturedOutput += `[ERRO] ${str}\n` });
            
            await pyodide.runPythonAsync(code);
            setStatus(capturedOutput || 'Código executado sem saída (output).');
        } catch (error) {
            setStatus(error.toString());
        }
    }
    
    function copyCode() {
        navigator.clipboard.writeText(editor.getValue()).then(() => {
            copyBtn.querySelector('span:last-child').textContent = 'Copiado!';
            setTimeout(() => {
                 copyBtn.querySelector('span:last-child').textContent = 'Copiar';
            }, 2000);
        });
    }

    function shareCode() {
        const code = editor.getValue();
        const encodedCode = btoa(code);
        const url = `${window.location.origin}${window.location.pathname}?code=${encodedCode}&lang=${language}`;
        
        navigator.clipboard.writeText(url).then(() => {
            shareBtn.querySelector('span:last-child').textContent = 'Link Copiado!';
            setTimeout(() => {
                shareBtn.querySelector('span:last-child').textContent = 'Compartilhar';
            }, 2000);
        });
    }
    
    function runDiagnostics(code) {
        diagnosticsPanel.innerHTML = ''; // Limpa diagnósticos anteriores
        let issuesFound = 0;

        // Diagnóstico 1: Verifica se há funções sem docstring
        const functionRegex = /def\s+(\w+)\s*\((.*?)\):(?!\s*("""|'''))/g;
        let match;
        while ((match = functionRegex.exec(code)) !== null) {
            addDiagnostic('info', `Função '${match[1]}' não possui uma docstring.`, 'É uma boa prática documentar funções.');
            issuesFound++;
        }

        // Diagnóstico 2: Verifica se há prints de debug
        if (code.includes('print("debug"') || code.includes("print('debug'")) {
            addDiagnostic('warning', `Encontrado 'print("debug")'.`, 'Lembre-se de remover logs de debug para produção.');
            issuesFound++;
        }
        
        if(issuesFound === 0) {
            diagnosticsPanel.innerHTML = '<p class="text-sm text-green-500 p-2">Nenhum problema simples detectado. Bom trabalho!</p>';
        }
    }
    
    function addDiagnostic(level, title, description) {
        const icons = { info: 'info', warning: 'warning', error: 'error' };
        const colors = { info: 'text-blue-400', warning: 'text-yellow-400', error: 'text-red-500' };

        const diagnosticHTML = `
            <div class="flex items-start gap-3 rounded-md p-2 hover:bg-gray-800">
                <span class="material-symbols-outlined mt-1 ${colors[level]}">${icons[level]}</span>
                <div>
                    <p class="font-medium">${title}</p>
                    <p class="text-sm text-gray-400">${description}</p>
                </div>
            </div>
        `;
        diagnosticsPanel.insertAdjacentHTML('beforeend', diagnosticHTML);
    }
});
