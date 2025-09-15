const STORAGE_KEY = 'pitchutchaPlaygroundState';

export function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Não foi possível salvar o estado do editor.", e);
    }
}

export function loadState() {
    try {
        const stateJSON = localStorage.getItem(STORAGE_KEY);
        return stateJSON ? JSON.parse(stateJSON) : null;
    } catch (e) {
        console.error("Não foi possível carregar o estado do editor.", e);
        return null;
    }
}
