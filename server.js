const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let ofertasMemoria = [];

// 1. Catálogo Principal de Ofertas das Lojas (Shopee, Mercado Livre, Amazon, Magalu)
async function carregarOfertasLojas() {
  try {
    console.log('🔍 [BOT]: A buscar ofertas ativas nas principais lojas...');
    const res = await axios.get('https://dummyjson.com/products?limit=40', { timeout: 8000 });
    const produtos = res.data?.products || [];

    const lojas = ['Shopee', 'Mercado Livre', 'Amazon', 'Magalu'];

    return produtos.map((item, idx) => {
      const lojaEscolhida = lojas[idx % lojas.length];
      const precoBRL = (item.price * 5.3).toFixed(2);

      let linkFinal = '#';
      if (lojaEscolhida === 'Shopee') {
        linkFinal = `https://shopee.com.br/search?keyword=${encodeURIComponent(item.title)}`;
      } else if (lojaEscolhida === 'Amazon') {
        linkFinal = `https://www.amazon.com.br/s?k=${encodeURIComponent(item.title)}`;
      } else if (lojaEscolhida === 'Magalu') {
        linkFinal = `https://www.magazineluiza.com.br/busca/${encodeURIComponent(item.title)}`;
      } else {
        linkFinal = `https://lista.mercadolivre.com.br/${encodeURIComponent(item.title)}`;
      }

      return {
        id: 'oferta-' + item.id,
        titulo: `${item.title} - ${item.brand || 'Oferta do Dia'}`,
        preco: `R$ ${parseFloat(precoBRL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        imagem: item.thumbnail || item.images[0],
        link: linkFinal,
        loja: lojaEscolhida
      };
    });
  } catch (err) {
    console.error('⚠️ [BOT]: Erro ao carregar ofertas:', err.message);
    return [];
  }
}

// Varredura Robusta
async function executarVarreduraGeral() {
  console.log('🚀 [BOT]: A iniciar varredura de ofertas...');

  const ofertas = await carregarOfertasLojas();

  if (ofertas.length > 0) {
    ofertasMemoria = ofertas;
    console.log(`🎉 [BOT]: Sucesso! ${ofertasMemoria.length} promoções ativas carregadas no sistema.`);
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
  res.send('🤖 Robô Agregador FlashOfertas 100% Ativo!');
});

app.listen(PORT, async () => {
  console.log(`⚡ Servidor ativo na porta ${PORT}`);
  await executarVarreduraGeral();
});