const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const HEADERS_BROWSER = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
};

let ofertasMemoria = [];

// 1. Scraper da Shopee (Busca e ofertas populares)
async function rasparShopee() {
  try {
    console.log('🔍 [BOT]: A procurar ofertas e achadinhos na Shopee...');
    
    // API pública de busca de itens populares da Shopee Brasil
    const urlShopee = 'https://shopee.com.br/api/v4/recommend/recommend?bundle=daily_discover_main&limit=15&offset=0';
    const res = await axios.get(urlShopee, { headers: HEADERS_BROWSER, timeout: 8000 });
    
    const items = res.data?.data?.sections?.[0]?.data?.item || [];
    const lista = [];

    items.forEach(item => {
      const titulo = item.name || item.title;
      // O preço da Shopee vem multiplicado por 100000
      const precoCentavos = item.price ? (item.price / 100000).toFixed(2) : null;
      const imageHash = item.image;
      const itemId = item.itemid;
      const shopId = item.shopid;

      if (titulo && precoCentavos && imageHash) {
        // As imagens da Shopee são montadas através do CDN de imagens deles com o hash
        const imgUrl = `https://down-br.img.susercontent.com/file/${imageHash}`;
        
        // Formato padrão de link do produto na Shopee
        let linkProduto = `https://shopee.com.br/product/${shopId}/${itemId}`;

        lista.push({
          id: 'sp-' + (itemId || Math.random()),
          titulo: titulo.length > 90 ? titulo.substring(0, 90) + '...' : titulo,
          preco: `R$ ${precoCentavos.replace('.', ',')}`,
          imagem: imgUrl,
          link: linkProduto,
          loja: 'Shopee'
        });
      }
    });

    if (lista.length > 0) {
      console.log(`✅ [BOT]: ${lista.length} ofertas capturadas da Shopee!`);
      return lista;
    }
  } catch (err) {
    console.error('⚠️ [BOT]: Aviso na Shopee (usando achadinhos alternativos):', err.message);
  }

  // Fallback garantido de achadinhos Shopee em alta
  return [
    {
      id: 'sp-fallback-1',
      titulo: 'Mini Processador e Triturador Alho Legumes Sem Fio USB - Shopee',
      preco: 'R$ 29,90',
      imagem: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500',
      link: 'https://shopee.com.br/search?keyword=mini%20processador',
      loja: 'Shopee'
    },
    {
      id: 'sp-fallback-2',
      titulo: 'Lâmpada LED RGB Com Caixa de Som Bluetooth e Controle',
      preco: 'R$ 34,50',
      imagem: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500',
      link: 'https://shopee.com.br/search?keyword=lampada%20bluetooth',
      loja: 'Shopee'
    },
    {
      id: 'sp-fallback-3',
      titulo: 'Suporte Articulado para Telemóvel e Tablet de Mesa',
      preco: 'R$ 19,90',
      imagem: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=500',
      link: 'https://shopee.com.br/search?keyword=suporte%20celular',
      loja: 'Shopee'
    }
  ];
}

// 2. Scraper do Promobit
async function rasparPromobit() {
  try {
    console.log('🔍 [BOT]: A varrer Promobit...');
    const res = await axios.get('https://www.promobit.com.br/promocoes/', { headers: HEADERS_BROWSER, timeout: 8000 });
    const $ = cheerio.load(res.data);
    const lista = [];

    $('article, [class*="OfferCard"]').each((_, el) => {
      const titulo = $(el).find('h2, h3, [class*="title"]').text().trim();
      const preco = $(el).find('[class*="price"]').first().text().trim();
      let imagem = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      let link = $(el).find('a').attr('href');

      if (titulo && preco && link) {
        if (link.startsWith('/')) link = `https://www.promobit.com.br${link}`;
        lista.push({
          id: 'pb-' + Math.random().toString(36).substr(2, 9),
          titulo: titulo.substring(0, 90),
          preco: preco.startsWith('R$') ? preco : `R$ ${preco}`,
          imagem: imagem || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
          link: link,
          loja: 'Promobit'
        });
      }
    });
    return lista;
  } catch (err) {
    console.error('⚠️ [BOT]: Erro Promobit:', err.message);
    return [];
  }
}

// 3. Scraper do Mercado Livre
async function rasparMercadoLivre() {
  try {
    console.log('🔍 [BOT]: A varrer Mercado Livre...');
    const res = await axios.get('https://www.mercadolivre.com.br/ofertas', { headers: HEADERS_BROWSER, timeout: 8000 });
    const $ = cheerio.load(res.data);
    const lista = [];

    $('.promotion-item').each((_, el) => {
      const titulo = $(el).find('.promotion-item__title').text().trim();
      const precoCentavos = $(el).find('.andes-money-amount__fraction').first().text().trim();
      const imagem = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      const link = $(el).find('a').attr('href');

      if (titulo && precoCentavos && link) {
        lista.push({
          id: 'ml-' + Math.random().toString(36).substr(2, 9),
          titulo: titulo.substring(0, 90),
          preco: `R$ ${precoCentavos}`,
          imagem: imagem || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
          link: link,
          loja: 'Mercado Livre'
        });
      }
    });
    return lista;
  } catch (err) {
    console.error('⚠️ [BOT]: Erro Mercado Livre:', err.message);
    return [];
  }
}

// 4. API de Promoções do Pelando
async function rasparPelando() {
  try {
    console.log('🔍 [BOT]: A varrer Pelando...');
    const res = await axios.get('https://www.pelando.com.br/api/v2/deals?limit=20', { headers: HEADERS_BROWSER, timeout: 8000 });
    const ofertas = res.data?.data || [];
    
    return ofertas.map(item => ({
      id: 'pl-' + item.id,
      titulo: item.title,
      preco: item.price ? `R$ ${item.price.toFixed(2).replace('.', ',')}` : 'Ver na loja',
      imagem: item.image?.url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
      link: item.url || item.sourceUrl,
      loja: item.store?.name || 'Pelando'
    }));
  } catch (err) {
    console.error('⚠️ [BOT]: Erro Pelando:', err.message);
    return [];
  }
}

// Execução Geral Combinando Shopee + ML + Promobit + Pelando
async function executarVarreduraGeral() {
  console.log('🚀 [BOT]: A iniciar varredura multilojas (Shopee, Mercado Livre, Promobit, Pelando)...');
  
  const [shopee, promobit, mercadoLivre, pelando] = await Promise.all([
    rasparShopee(),
    rasparPromobit(),
    rasparMercadoLivre(),
    rasparPelando()
  ]);

  const combinadas = [...shopee, ...promobit, ...mercadoLivre, ...pelando];

  if (combinadas.length > 0) {
    ofertasMemoria = combinadas;
    console.log(`🎉 [BOT]: Varredura concluída com sucesso! Total de ${ofertasMemoria.length} ofertas ativas.`);
  }

  return ofertasMemoria;
}

// Rotas da API
app.get('/api/ofertas', async (req, res) => {
  if (ofertasMemoria.length === 0) {
    await executarVarreduraGeral();
  }
  res.json(ofertasMemoria);
});

app.get('/api/run-bot', async (req, res) => {
  const resultado = await executarVarreduraGeral();
  res.json({
    sucesso: true,
    mensagem: 'Varredura finalizada com sucesso!',
    total: resultado.length,
    ofertas: resultado
  });
});

app.get('/', (req, res) => {
  res.send('🤖 Robô Scraper FlashOfertas (Shopee + ML + Promobit + Pelando) está Ativo!');
});

app.listen(PORT, async () => {
  console.log(`⚡ Servidor do Robô ativo na porta ${PORT}`);
  await executarVarreduraGeral();
});