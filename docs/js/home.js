document.addEventListener("DOMContentLoaded", () => {
    const baseUrl = document.querySelector('meta[name="base-url"]')?.content || '';

    // --- LÓGICA DO SELETOR DE TEMA ---
    const themeToggle = document.getElementById('theme-toggle');
    const themeOptions = document.getElementById('theme-options');
    const themeButtons = document.querySelectorAll('[data-theme]');

    if (themeToggle && themeOptions) {
        themeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            themeOptions.classList.toggle('hidden');
        });

        document.addEventListener('click', () => themeOptions.classList.add('hidden'));

        themeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const theme = button.dataset.theme;
                document.documentElement.className = theme;
                localStorage.setItem('theme', theme);
            });
        });
    }
    
    // --- EFEITO DE SCROLL NO CABEÇALHO ---
    const header = document.getElementById('main-header');
    if (header) {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Executa uma vez no carregamento
    }
    
    // --- EFEITO SPOTLIGHT NO CURSOR ---
    const spotlight = document.querySelector('.spotlight');
    if (spotlight) {
        document.addEventListener('mousemove', (e) => {
            spotlight.style.transform = `translate(${e.clientX - spotlight.offsetWidth / 2}px, ${e.clientY - spotlight.offsetHeight / 2}px)`;
        });
        document.addEventListener('mouseleave', () => {
            spotlight.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            spotlight.style.opacity = '1';
        });
    }

    // --- LÓGICA PARA ANIMAÇÃO DE SCROLL ---
    const revealOnScrollElements = document.querySelectorAll(".reveal-on-scroll");
    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    revealOnScrollElements.forEach(element => scrollObserver.observe(element));

    // --- LÓGICA DO VISUALIZADOR DE ALGORITMO ---
    const visualizerContainer = document.getElementById('visualizer-container');
    const sortBtn = document.getElementById('sort-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const explanationEl = document.getElementById('visualizer-explanation');

    if (visualizerContainer && sortBtn && shuffleBtn && explanationEl) {
        let array = [];
        const NUM_BARS = 50;

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const createBars = () => {
            visualizerContainer.innerHTML = '';
            array = [];
            for (let i = 0; i < NUM_BARS; i++) {
                const barHeight = Math.floor(Math.random() * 90) + 10;
                array.push(barHeight);
                const bar = document.createElement('div');
                bar.classList.add('bar');
                bar.style.height = `${barHeight}%`;
                visualizerContainer.appendChild(bar);
            }
        };

        const updateBars = () => {
            const bars = visualizerContainer.children;
            for (let i = 0; i < array.length; i++) {
                if (bars[i]) {
                    bars[i].style.height = `${array[i]}%`;
                }
            }
        };

        const shuffleArray = () => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            const bars = visualizerContainer.children;
            for(let i = 0; i < bars.length; i++) {
                bars[i].classList.remove('sorted', 'comparing', 'swapping');
            }
            updateBars();
            explanationEl.textContent = 'Array embaralhado. Clique em "Ordenar" para começar.';
            sortBtn.disabled = false;
        };

        const bubbleSort = async () => {
            sortBtn.disabled = true;
            shuffleBtn.disabled = true;
            const bars = visualizerContainer.children;
            let n = array.length;
            let swapped;
            do {
                swapped = false;
                for (let i = 0; i < n - 1; i++) {
                    bars[i].classList.add('comparing');
                    bars[i + 1].classList.add('comparing');
                    explanationEl.textContent = `Comparando índice ${i} (valor ${array[i]}) e ${i + 1} (valor ${array[i+1]})...`;
                    await sleep(25);

                    if (array[i] > array[i + 1]) {
                        bars[i].classList.add('swapping');
                        bars[i + 1].classList.add('swapping');
                        explanationEl.textContent = `Trocando ${array[i]} e ${array[i+1]}...`;
                        await sleep(50);
                        
                        [array[i], array[i + 1]] = [array[i + 1], array[i]];
                        updateBars();
                        swapped = true;
                        
                        await sleep(50);
                        bars[i].classList.remove('swapping');
                        bars[i + 1].classList.remove('swapping');
                    }
                    
                    bars[i].classList.remove('comparing');
                    bars[i + 1].classList.remove('comparing');
                }
                if (n > 0 && bars[n - 1]) {
                    bars[n - 1].classList.add('sorted');
                }
                n--;
            } while (swapped);

            for(let i = 0; i < bars.length; i++) {
                bars[i].classList.add('sorted');
            }

            explanationEl.textContent = 'Array ordenado com sucesso!';
            shuffleBtn.disabled = false;
        };

        shuffleBtn.addEventListener('click', shuffleArray);
        sortBtn.addEventListener('click', bubbleSort);

        createBars();
    }
});
