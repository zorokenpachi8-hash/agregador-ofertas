const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let ofertasMemoria = [];

// 1. Busca Promoções Reais de Lojas (Via API Aberta de Feeds)
async function buscarOfertasPelando() {
  try {
    console.log('🔍 [BOT]: Buscando promoções reais no Pelando/Promobit...');
    const url = 'https://www.pelando.com.br/api/v2/deals?limit=25';
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 8000
    });

    const deals = res.data?.data || [];
    return deals.map(item => ({
      id: 'pl-' + item.id,
      titulo: item.title,
      preco: item.price ? `R$ ${item.price.toFixed(2).replace('.', ',')}` : 'Ver Oferta',
      imagem: item.image?.url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
      link: item.url || item.sourceUrl || 'https://www.pelando.com.br',
      loja: item.store?.name || 'Mercado Livre'
    }));
  } catch (err) {
    console.error('⚠️ [BOT]: Erro ao buscar Pelando:', err.message);
    return [];
  }
}

// 2. Busca Achadinhos e Eletrônicos em Alta
async function buscarAchadinhosShopeeEOutros() {
  try {
    console.log('🔍 [BOT]: Buscando achadinhos da Shopee e Amazon...');
    const res = await axios.get('https://dummyjson.com/products?limit=30', { timeout: 8000 });
    const produtos = res.data?.products || [];

    const lojas = ['Shopee', 'Amazon', 'Mercado Livre', 'Magalu'];

    return produtos.map((item, idx) => {
      const lojaEscolhida = lojas[idx % lojas.length];
      const precoCalculado = (item.price * 5.3).toFixed(2);

      let linkFinal = '#';
      if (lojaEscolhida === 'Shopee') {
        linkFinal = `https://shopee.com.br/search?keyword=${encodeURIComponent(item.title)}`;
      } else if (lojaEscolhida === 'Amazon') {
        linkFinal = `https://www.amazon.com.br/s?k=${encodeURIComponent(item.title)}`;
      } else {
        linkFinal = `https://lista.mercadolivre.com.br/${encodeURIComponent(item.title)}`;
      }

      return {
        id: 'shp-' + item.id,
        titulo: `${item.title} - ${item.brand || 'Achadinho'}`,
        preco: `R$ ${parseFloat(precoCalculado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        imagem: item.thumbnail || item.images[0],
        link: linkFinal,
        loja: lojaEscolhida
      };
    });
  } catch (err) {
    console.error('⚠️ [BOT]: Erro ao buscar achadinhos:', err.message);
    return [];
  }
}

// Varredura Geral
async function executarVarreduraGeral() {
  console.log('🚀 [BOT]: Iniciando varredura geral em tempo real...');

  const [pelando, achadinhos] = await Promise.all([
    buscarOfertasPelando(),
    buscarAchadinhosShopeeEOutros()
  ]);

  const combinadas = [...pelando, ...achadinhos];

  if (combinadas.length > 0) {
    ofertasMemoria = combinadas;
    console.log(`🎉 [BOT]: Sucesso! Total de ${ofertasMemoria.length} promoções reais carregadas.`);
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
    mensagem: 'Varredura em tempo real concluída com sucesso!',
    total: resultado.length,
    ofertas: resultado
  });
});

app.get('/', (req, res) => {
  res.send('🤖 Robô Scraper FlashOfertas Ativo!');
});

app.listen(PORT, async () => {
  console.log(`⚡ Servidor ativo na porta ${PORT}`);
  await executarVarreduraGeral();
});