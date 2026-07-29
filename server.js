const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Cabeçalhos que simulam perfeitamente um navegador acessando do Brasil
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"'
};

let ofertasMemoria = [];

// ==========================================
// 1. MERCADO LIVRE (BUSCA DIRETA NA API REAIS)
// ==========================================
async function buscarMercadoLivre() {
  const termosBusca = ['smartphone promocao', 'notebook ofertas', 'fone bluetooth', 'gamer'];
  let resultadosML = [];

  console.log('🔍 [BOT]: A procurar ofertas diretamente no Mercado Livre...');

  for (const termo of termosBusca) {
    try {
      const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=8`;
      const res = await axios.get(url, { headers: BROWSER_HEADERS, timeout: 7000 });
      const items = res.data?.results || [];

      items.forEach(item => {
        // Converte imagem miniatura para Alta Resolução
        let imgHD = item.thumbnail ? item.thumbnail.replace('-I.jpg', '-O.jpg').replace('-I.webp', '-O.webp') : '';
        if (!imgHD.startsWith('http')) imgHD = item.thumbnail;

        resultadosML.push({
          id: 'ml-' + item.id,
          titulo: item.title,
          preco: `R$ ${item.price ? item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'Ver na Loja'}`,
          imagem: imgHD,
          link: item.permalink,
          loja: 'Mercado Livre'
        });
      });
    } catch (err) {
      console.error(`⚠️ [BOT]: Falha ao buscar "${termo}" no ML:`, err.message);
    }
  }

  console.log(`✅ [BOT]: Mercado Livre retornou ${resultadosML.length} ofertas reais.`);
  return resultadosML;
}

// ==========================================
// 2. SHOPEE (BUSCA DIRETA NOS ITENS DA SHOPEE BRASIL)
// ==========================================
async function buscarShopee() {
  let resultadosShopee = [];
  console.log('🔍 [BOT]: A procurar ofertas diretamente na Shopee...');

  try {
    const url = 'https://shopee.com.br/api/v4/recommend/recommend?bundle=daily_discover_main&limit=20&offset=0';
    const headersShopee = {
      ...BROWSER_HEADERS,
      'Referer': 'https://shopee.com.br/',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Shopee-Language': 'pt-BR'
    };

    const res = await axios.get(url, { headers: headersShopee, timeout: 8000 });
    const items = res.data?.data?.sections?.[0]?.data?.item || [];

    items.forEach(item => {
      const titulo = item.name || item.title;
      // Na Shopee o preço vem multiplicado por 100000
      const precoCalculado = item.price ? (item.price / 100000).toFixed(2) : null;
      const imageHash = item.image;
      const itemId = item.itemid;
      const shopId = item.shopid;

      if (titulo && precoCalculado && imageHash) {
        const imgUrl = `https://down-br.img.susercontent.com/file/${imageHash}`;
        const linkProduto = `https://shopee.com.br/product/${shopId}/${itemId}`;

        resultadosShopee.push({
          id: 'sp-' + itemId,
          titulo: titulo.length > 95 ? titulo.substring(0, 95) + '...' : titulo,
          preco: `R$ ${parseFloat(precoCalculado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          imagem: imgUrl,
          link: linkProduto,
          loja: 'Shopee'
        });
      }
    });
  } catch (err) {
    console.error('⚠️ [BOT]: Erro ao conectar com Shopee:', err.message);
  }

  console.log(`✅ [BOT]: Shopee retornou ${resultadosShopee.length} ofertas reais.`);
  return resultadosShopee;
}

// ==========================================
// VARREDURA UNIFICADA
// ==========================================
async function executarVarreduraGeral() {
  console.log('🚀 [BOT]: A iniciar varredura direta (Mercado Livre + Shopee)...');

  const [ml, shopee] = await Promise.all([
    buscarMercadoLivre(),
    buscarShopee()
  ]);

  const ofertasTotais = [...ml, ...shopee];

  if (ofertasTotais.length > 0) {
    ofertasMemoria = ofertasTotais;
    console.log(`🎉 [BOT]: Sucesso total! ${ofertasMemoria.length} promoções carregadas na memória.`);
  } else {
    console.log('⚠️ [BOT]: Nenhuma oferta foi retornada nesta tentativa.');
  }

  return ofertasMemoria;
}

// ==========================================
// ROTAS DA API
// ==========================================
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
    mensagem: 'Varredura direta concluída com sucesso!',
    total: resultado.length,
    ofertas: resultado
  });
});

app.get('/', (req, res) => {
  res.send('🤖 Robô Agregador Mercado Livre & Shopee ativo!');
});

app.listen(PORT, async () => {
  console.log(`⚡ Servidor ativo na porta ${PORT}`);
  await executarVarreduraGeral();
});
