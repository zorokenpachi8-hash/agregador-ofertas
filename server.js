const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilita CORS para qualquer origem poder acessar a API do robô
app.use(cors());
app.use(express.json());

// Cabeçalhos HTTP para simular um navegador real e evitar bloqueios antibot
const HEADERS_BROWSER = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache'
};

// Armazenamento em memória das ofertas raspadas
let ofertasMemoria = [
  {
    id: 1,
    titulo: 'Smartphone Samsung Galaxy S23 Ultra 5G 256GB',
    preco: 'R$ 4.899,00',
    imagem: 'https://m.media-amazon.com/images/I/61VfL-ai9WL._AC_SL1000_.jpg',
    link: 'https://www.amazon.com.br',
    loja: 'Amazon'
  }
];

// Função Scraper: Raspa ofertas do Promobit
async function rasparPromobit() {
  try {
    console.log('🔍 [BOT]: Raspando ofertas do Promobit...');
    const response = await axios.get('https://www.promobit.com.br/promocoes/', {
      headers: HEADERS_BROWSER,
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const novasOfertas = [];

    $('article, .pr-card, [data-testid="offer-card"]').each((index, el) => {
      if (novasOfertas.length >= 12) return;

      const titulo = $(el).find('h2, h3, .title, [class*="title"]').text().trim();
      const preco = $(el).find('[class*="price"], .price, strong').first().text().trim();
      let imagem = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      let link = $(el).find('a').attr('href');

      if (titulo && preco && link) {
        if (link.startsWith('/')) {
          link = `https://www.promobit.com.br${link}`;
        }

        novasOfertas.push({
          id: Date.now() + Math.random(),
          titulo: titulo.substring(0, 90),
          preco: preco.startsWith('R$') ? preco : `R$ ${preco}`,
          imagem: imagem || 'https://via.placeholder.com/300?text=Sem+Imagem',
          link: link,
          loja: 'Promobit'
        });
      }
    });

    if (novasOfertas.length > 0) {
      console.log(`✅ [BOT]: ${novasOfertas.length} ofertas capturadas do Promobit!`);
      return novasOfertas;
    }
  } catch (error) {
    console.error('⚠️ [BOT]: Erro ao raspar Promobit:', error.message);
  }
  return [];
}

// Função Scraper: Raspa ofertas do Mercado Livre
async function rasparMercadoLivre() {
  try {
    console.log('🔍 [BOT]: Raspando ofertas do Mercado Livre...');
    const response = await axios.get('https://www.mercadolivre.com.br/ofertas', {
      headers: HEADERS_BROWSER,
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const novasOfertas = [];

    $('.promotion-item, .promotion-item__container').each((index, el) => {
      if (novasOfertas.length >= 10) return;

      const titulo = $(el).find('.promotion-item__title, .promotion-item__link-title').text().trim();
      const precoCentavos = $(el).find('.andes-money-amount__fraction').first().text().trim();
      const imagem = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      const link = $(el).find('a').attr('href');

      if (titulo && precoCentavos && link) {
        novasOfertas.push({
          id: Date.now() + Math.random(),
          titulo: titulo.substring(0, 90),
          preco: `R$ ${precoCentavos}`,
          imagem: imagem || 'https://via.placeholder.com/300?text=Sem+Imagem',
          link: link,
          loja: 'Mercado Livre'
        });
      }
    });

    if (novasOfertas.length > 0) {
      console.log(`✅ [BOT]: ${novasOfertas.length} ofertas capturadas do Mercado Livre!`);
      return novasOfertas;
    }
  } catch (error) {
    console.error('⚠️ [BOT]: Erro ao raspar Mercado Livre:', error.message);
  }
  return [];
}

// Função executora que coordena a busca de todas as fontes
async function executarVarreduraGeral() {
  console.log('🚀 [BOT]: Iniciando ciclo de varredura geral...');
  
  const [promobit, mercadoLivre] = await Promise.all([
    rasparPromobit(),
    rasparMercadoLivre()
  ]);

  const listaCombinada = [...promobit, ...mercadoLivre];

  if (listaCombinada.length > 0) {
    ofertasMemoria = listaCombinada;
    console.log(`🎉 [BOT]: Varredura concluída! Total de ${ofertasMemoria.length} ofertas no ar.`);
  } else {
    console.log('ℹ️ [BOT]: Varredura concluída, mantendo ofertas anteriores.');
  }

  return ofertasMemoria;
}

// ROTA 1: Retorna a lista de ofertas
app.get('/api/ofertas', async (req, res) => {
  if (ofertasMemoria.length <= 1) {
    await executarVarreduraGeral();
  }
  res.json(ofertasMemoria);
});

// ROTA 2: Dispara o robô manualmente
app.get('/api/run-bot', async (req, res) => {
  const resultado = await executarVarreduraGeral();
  res.json({
    sucesso: true,
    mensagem: 'Varredura finalizada com sucesso!',
    total: resultado.length,
    ofertas: resultado
  });
});

// ROTA DE SAÚDE
app.get('/', (req, res) => {
  res.send('🤖 Robô Scraper FlashOfertas está Ativo e Rodando!');
});

// Inicia o Servidor Node.js
app.listen(PORT, () => {
  console.log(`⚡ Servidor do Robô ativo na porta ${PORT}`);
  setTimeout(executarVarreduraGeral, 3000);
});
