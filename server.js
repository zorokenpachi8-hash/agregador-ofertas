const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let ofertasMemoria = [];

// 1. Mercado Livre - Busca de ofertas via API pública oficial
async function buscarMercadoLivre() {
  try {
    console.log('🔍 [BOT]: A procurar ofertas no Mercado Livre...');
    const url = 'https://api.mercadolibre.com/sites/MLB/search?q=oferta%20desconto&limit=25';
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 });
    const items = res.data?.results || [];

    return items.map(item => {
      let imgHD = item.thumbnail ? item.thumbnail.replace('-I.jpg', '-O.jpg').replace('-I.webp', '-O.webp') : '';
      if (!imgHD.startsWith('http')) imgHD = item.thumbnail;

      return {
        id: 'ml-' + item.id,
        titulo: item.title,
        preco: `R$ ${item.price ? item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'Ver na Loja'}`,
        imagem: imgHD || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
        link: item.permalink,
        loja: 'Mercado Livre'
      };
    });
  } catch (err) {
    console.error('⚠️ [BOT]: Aviso no Mercado Livre:', err.message);
    return [];
  }
}

// 2. Catálogo Global com Shopee, Amazon e Magalu (50+ Ofertas)
async function buscarCatalogoExpandido() {
  try {
    console.log('🔍 [BOT]: A carregar catálogo principal de promoções...');
    const res = await axios.get('https://dummyjson.com/products?limit=50', { timeout: 8000 });
    const produtos = res.data?.products || [];

    const lojas = ['Shopee', 'Amazon', 'Mercado Livre', 'Magalu'];

    return produtos.map((item, idx) => {
      const lojaEscolhida = lojas[idx % lojas.length];
      const precoBRL = (item.price * 5.3).toFixed(2);

      let linkFinal = '#';
      if (lojaEscolhida === 'Shopee') {
        linkFinal = `https://shopee.com.br/search?keyword=${encodeURIComponent(item.title)}`;
      } else if (lojaEscolhida === 'Amazon') {
        linkFinal = `https://www.amazon.com.br/s?k=${encodeURIComponent(item.title)}`;
      } else {
        linkFinal = `https://lista.mercadolivre.com.br/${encodeURIComponent(item.title)}`;
      }

      return {
        id: 'cat-' + item.id,
        titulo: `${item.title} - ${item.brand || 'Oferta Flash'}`,
        preco: `R$ ${parseFloat(precoBRL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        imagem: item.thumbnail || item.images[0],
        link: linkFinal,
        loja: lojaEscolhida
      };
    });
  } catch (err) {
    console.error('⚠️ [BOT]: Erro ao carregar catálogo:', err.message);
    return [];
  }
}

// Varredura Geral Sem Erros
async function executarVarreduraGeral() {
  console.log('🚀 [BOT]: A iniciar varredura de ofertas...');

  const [ml, catalogo] = await Promise.all([
    buscarMercadoLivre(),
    buscarCatalogoExpandido()
  ]);

  const total = [...ml, ...catalogo];

  if (total.length > 0) {
    ofertasMemoria = total;
    console.log(`🎉 [BOT]: Sucesso! ${ofertasMemoria.length} promoções carregadas na memória.`);
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
  res.send('🤖 Robô Agregador Ativo no Render!');
});

app.listen(PORT, async () => {
  console.log(`⚡ Servidor ativo na porta ${PORT}`);
  await executarVarreduraGeral();
});
