import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const siteUrl = 'https://sistemavinculado.github.io/pitchutcha.github.io';
const pagesToTest = [
  '/',
  '/docs.html',
  '/algoritmos.html',
  '/estruturas-de-dados.html',
  '/search.html',
  '/status.html',
  '/articles/introduction-to-algorithm-design',
  '/articles/data-structures-overview',
  '/articles/algoritmos-de-busca-linear-vs-binaria'
];

const allDiagnostics = [];

// Função para adicionar um diagnóstico à lista
function addDiagnostic(page, type, severity, title, description, suggestion, selector) {
    allDiagnostics.push({ page, type, severity, title, description, suggestion, selector });
}

async function run() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  for (const path of pagesToTest) {
    const url = `${siteUrl}${path}`;
    const page = await browser.newPage();
    const capturedErrors = [];

    // Captura erros do console da página
    page.on('pageerror', error => capturedErrors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        capturedErrors.push(msg.text());
      }
    });

    try {
      const response = await page.goto(url, { waitUntil: 'networkidle0' });

      // 1. Teste de Disponibilidade e Erros de Console
      if (!response.ok()) {
        addDiagnostic(path, 'Disponibilidade', 'critical', 'Página Não Encontrada ou com Erro', `A página retornou um status HTTP ${response.status()}.`, 'Verifique se a página existe e se o servidor está configurado corretamente.', 'N/A');
        continue; // Pula para a próxima página se esta falhou
      }
      if (capturedErrors.length > 0) {
        addDiagnostic(path, 'Qualidade de Código', 'serious', 'Erros de JavaScript no Console', `Foram encontrados ${capturedErrors.length} erro(s): ${capturedErrors.join(', ')}`, 'Abra o console do navegador nesta página para depurar os erros listados.', 'N/A');
      }

      // 2. Teste de SEO Básico
      const metaInfo = await page.evaluate(() => {
          const title = document.querySelector('title')?.innerText || '';
          const description = document.querySelector('meta[name="description"]')?.content || '';
          return { title, description };
      });
      if (!metaInfo.title) {
          addDiagnostic(path, 'SEO', 'moderate', 'Tag <title> Ausente ou Vazia', 'A página não possui uma tag <title> com conteúdo, o que é crucial para os motores de busca.', 'Adicione uma tag <title> única e descritiva no <head> da página.', 'title');
      }
      if (!metaInfo.description) {
          addDiagnostic(path, 'SEO', 'moderate', 'Meta Description Ausente ou Vazia', 'A página não possui uma meta tag de descrição, o que afeta como ela aparece nos resultados de busca.', 'Adicione `<meta name="description" content="...">` com um resumo da página.', 'meta[name="description"]');
      }

      // 3. Teste de Otimização de Imagens
      const oversizedImages = await page.evaluate(() => 
        Array.from(document.querySelectorAll('img'))
             .map(img => ({ src: img.src, naturalWidth: img.naturalWidth, clientWidth: img.clientWidth }))
             .filter(img => img.clientWidth > 0 && img.naturalWidth > img.clientWidth * 1.5)
      );
      oversizedImages.forEach(img => {
          addDiagnostic(path, 'Performance', 'moderate', 'Imagem com Dimensionamento Incorreto', `A imagem '${img.src.split('/').pop()}' (${img.naturalWidth}px de largura) está sendo exibida em um contêiner de ${img.clientWidth}px.`, 'Redimensione a imagem para um tamanho mais próximo ao de exibição para economizar dados e acelerar o carregamento.', `img[src="${img.src}"]`);
      });

      // 4. Teste de Links Quebrados (amostragem para evitar sobrecarga)
      const links = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]'), a => a.href));
      for (const link of links.slice(0, 20)) { // Limita para 20 links por página
        if (!link.startsWith(siteUrl) && link.startsWith('http')) {
          try {
            const linkResponse = await fetch(link, { method: 'HEAD' });
            if (!linkResponse.ok) {
              addDiagnostic(path, 'Qualidade de Conteúdo', 'serious', 'Link Quebrado Encontrado', `O link externo para '${link}' retornou o status ${linkResponse.status}.`, 'Corrija ou remova o link quebrado para melhorar a experiência do usuário.', `a[href="${link}"]`);
            }
          } catch (e) {
            // Ignora erros de fetch (CORS, etc) que são comuns em checagens automatizadas
          }
        }
      }

    } catch (e) {
      console.error(`Erro ao testar ${url}:`, e.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  await fs.writeFile('docs/diagnostics.json', JSON.stringify(allDiagnostics, null, 2));
  console.log('Arquivo docs/diagnostics.json gerado com sucesso.');
}

run();
