// Este arquivo centraliza todo o código JavaScript do seu site.

// Funcionalidade para trocar o tema (dark mode) vinda do index2.html
const themeToggle = document.getElementById("theme-toggle");
const body = document.body;

// Verifica se o botão de troca de tema existe na página atual antes de adicionar o evento
if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        body.classList.toggle("dark");
    });
}
