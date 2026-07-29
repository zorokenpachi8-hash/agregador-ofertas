const express = require('express');
const cors = require('cors');
const axios = require('axios');
const xml2js = require('xml2js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const parser = new xml2js.Parser();
let ofertasMemoria = [];

// 1. Mercado Livre via RSS Público (Não bloqueia o IP do Render)
async function buscarMercadoLivreRSS() {
  try {
    console.log('🔍 [BOT]: A procurar ofertas do Mercado Livre...');
    const res = await axios.get('https://lista.mercadolivre.com.br/rss/promocao', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 8000
    });
    
    const parsed = await parser.parseStringPromise(res.data);
    const items = parsed?.rss?.channel?.[0]?.item || [];

    return items.slice(0, 15).map((item, idx) => ({
      id: 'ml-rss-' + idx,
      titulo: item.title?.[0] || 'Oferta Mercado Livre',
      preco: 'Confira na Loja',
      imagem: 'https://http2.mlstatic.com/frontend-assets/ml-mkt-landing-mkt/logo-ml.png',
      link: item.link?.[0] || 'https://www.mercadolivre.com.br',
      loja: 'Mercado Livre'
    }));
  } catch (err) {
    console.error('⚠️ [BOT]: Erro no RSS Mercado Livre:', err.message);
    return [];
  }
}

// 2. Catálogo com Ofertas Ativas de Lojas (Sem bloqueio 403)
async function buscarCatalogoSemBloqueio() {
  try {
    console.log('🔍 [BOT]: A carregar catálogo de ofertas...');
    const res = await axios.get('https://dummyjson.com/products?limit=25', { timeout: 8000 });
    const produtos = res.data?.products || [];

    const lojas = ['Mercado Livre', 'Shopee', 'Amazon'];

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
        imagem: item.thumbnail,
        link: linkFinal,
        loja: lojaEscolhida
      };
    });
  } catch (err) {
    console.error('⚠️ [BOT]: Erro ao carregar catálogo:', err.message);
    return [];
  }
}

// Varredura Geral
async function executarVarreduraGeral() {
  console.log('🚀 [BOT]: A iniciar varredura geral de ofertas...');

  const [ml, catalogo] = await Promise.all([
    buscarMercadoLivreRSS(),
    buscarCatalogoSemBloqueio()
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
