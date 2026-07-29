const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const HEADERS_BROWSER = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*'
};

let ofertasMemoria = [];

// 1. Mercado Livre via API Oficial
async function buscarMercadoLivre() {
  try {
    console.log('🔍 [BOT]: A procurar promoções reais no Mercado Livre...');
    const url = 'https://api.mercadolibre.com/sites/MLB/search?q=oferta%20desconto&limit=25';
    const res = await axios.get(url, { headers: HEADERS_BROWSER, timeout: 8000 });
    const results = res.data?.results || [];

    return results.map(item => {
      let imagemHD = item.thumbnail ? item.thumbnail.replace('-I.jpg', '-O.jpg').replace('-I.webp', '-O.webp') : '';
      if (!imagemHD.startsWith('http')) {
        imagemHD = item.thumbnail;
      }

      return {
        id: 'ml-' + item.id,
        titulo: item.title,
        preco: `R$ ${item.price ? item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'Ver na Loja'}`,
        imagem: imagemHD || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
        link: item.permalink,
        loja: 'Mercado Livre'
      };
    });
  } catch (err) {
    console.error('⚠️ [BOT]: Erro no Mercado Livre:', err.message);
    return [];
  }
}

// 2. Shopee via API de Achadinhos e Destaques
async function buscarShopee() {
  try {
    console.log('🔍 [BOT]: A procurar ofertas e achadinhos na Shopee...');
    const url = 'https://shopee.com.br/api/v4/recommend/recommend?bundle=daily_discover_main&limit=20&offset=0';
    const res = await axios.get(url, { headers: HEADERS_BROWSER, timeout: 8000 });
    
    const items = res.data?.data?.sections?.[0]?.data?.item || [];
    const lista = [];

    items.forEach(item => {
      const titulo = item.name || item.title;
      const precoCentavos = item.price ? (item.price / 100000).toFixed(2) : null;
      const imageHash = item.image;
      const itemId = item.itemid;
      const shopId = item.shopid;

      if (titulo && precoCentavos && imageHash) {
        const imgUrl = `https://down-br.img.susercontent.com/file/${imageHash}`;
        const linkProduto = `https://shopee.com.br/product/${shopId}/${itemId}`;

        lista.push({
          id: 'sp-' + itemId,
          titulo: titulo.length > 90 ? titulo.substring(0, 90) + '...' : titulo,
          preco: `R$ ${parseFloat(precoCentavos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          imagem: imgUrl,
          link: linkProduto,
          loja: 'Shopee'
        });
      }
    });

    return lista;
  } catch (err) {
    console.error('⚠️ [BOT]: Erro na Shopee:', err.message);
    return [];
  }
}

// 3. Pelando via API de Promoções
async function buscarPelando() {
  try {
    console.log('🔍 [BOT]: A procurar promoções no Pelando...');
    const res = await axios.get('https://www.pelando.com.br/api/v2/deals?limit=20', { headers: HEADERS_BROWSER, timeout: 8000 });
    const ofertas = res.data?.data || [];
    
    return ofertas.map(item => ({
      id: 'pl-' + item.id,
      titulo: item.title,
      preco: item.price ? `R$ ${item.price.toFixed(2).replace('.', ',')}` : 'Ver Oferta',
      imagem: item.image?.url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
      link: item.url || item.sourceUrl || 'https://www.pelando.com.br',
      loja: item.store?.name || 'Amazon'
    }));
  } catch (err) {
    console.error('⚠️ [BOT]: Erro no Pelando:', err.message);
    return [];
  }
}

// Varredura Geral
async function executarVarreduraGeral() {
  console.log('🚀 [BOT]: A iniciar varredura em tempo real...');
  
  const [mercadoLivre, shopee, pelando] = await Promise.all([
    buscarMercadoLivre(),
    buscarShopee(),
    buscarPelando()
  ]);

  const combinadas = [...mercadoLivre, ...shopee, ...pelando];

  if (combinadas.length > 0) {
    ofertasMemoria = combinadas;
    console.log(`🎉 [BOT]: Varredura concluída! Total de ${ofertasMemoria.length} promoções reais carregadas.`);
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
  res.send('🤖 Robô Scraper FlashOfertas está 100% Ativo!');
});

app.listen(PORT, async () => {
  console.log(`⚡ Servidor ativo na porta ${PORT}`);
  await executarVarreduraGeral();
});
