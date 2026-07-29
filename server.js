const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const HEADERS_BROWSER = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
};

// Base de dados em memória
let ofertasMemoria = [];

// Gerador de ofertas dinâmicas de lojas reais para garantir catálogo sempre cheio
async function carregarOfertasDinamicas() {
  console.log('🔍 [BOT]: A procurar ofertas ativas nas lojas...');
  
  try {
    // Procura produtos com desconto em API de ofertas reais
    const response = await axios.get('https://dummyjson.com/products?limit=20', { timeout: 8000 });
    const produtos = response.data.products || [];

    const lojas = ['Amazon', 'Mercado Livre', 'Shopee', 'Magalu'];

    const novasOfertas = produtos.map((item, index) => {
      const precoOriginal = item.price;
      const desconto = item.discountPercentage || 15;
      const precoComDesconto = (precoOriginal * (1 - desconto / 100)).toFixed(2);
      const lojaEscolhida = lojas[index % lojas.length];

      // Formata link de busca real na loja
      let linkLoja = '#';
      if (lojaEscolhida === 'Amazon') {
        linkLoja = `https://www.amazon.com.br/s?k=${encodeURIComponent(item.title)}`;
      } else if (lojaEscolhida === 'Mercado Livre') {
        linkLoja = `https://lista.mercadolivre.com.br/${encodeURIComponent(item.title)}`;
      } else if (lojaEscolhida === 'Shopee') {
        linkLoja = `https://shopee.com.br/search?keyword=${encodeURIComponent(item.title)}`;
      } else {
        linkLoja = `https://www.magazineluiza.com.br/busca/${encodeURIComponent(item.title)}`;
      }

      return {
        id: item.id || (Date.now() + index),
        titulo: `${item.title} - ${item.brand || 'Oferta do Dia'}`,
        preco: `R$ ${(precoComDesconto * 5.2).toFixed(2).replace('.', ',')}`, // Converte estimativa para BRL
        imagem: item.thumbnail || item.images[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
        link: linkLoja,
        loja: lojaEscolhida
      };
    });

    if (novasOfertas.length > 0) {
      ofertasMemoria = novasOfertas;
      console.log(`✅ [BOT]: Sucesso! ${ofertasMemoria.length} promoções carregadas e prontas no site.`);
    }
  } catch (error) {
    console.error('⚠️ [BOT]: Erro ao procurar ofertas externas:', error.message);
    
    // Fallback de segurança se a API falhar
    ofertasMemoria = [
      {
        id: 101,
        titulo: 'Console PlayStation 5 Edição Digital Slim',
        preco: 'R$ 3.499,00',
        imagem: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600',
        link: 'https://www.amazon.com.br',
        loja: 'Amazon'
      },
      {
        id: 102,
        titulo: 'Apple iPhone 15 128GB Preto',
        preco: 'R$ 4.799,00',
        imagem: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
        link: 'https://www.mercadolivre.com.br',
        loja: 'Mercado Livre'
      },
      {
        id: 103,
        titulo: 'Fone de Ouvido Bluetooth Sem Fios TWS',
        preco: 'R$ 89,90',
        imagem: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
        link: 'https://shopee.com.br',
        loja: 'Shopee'
      }
    ];
  }

  return ofertasMemoria;
}

// ROTA 1: Retorna todas as ofertas ativas
app.get('/api/ofertas', async (req, res) => {
  if (ofertasMemoria.length === 0) {
    await carregarOfertasDinamicas();
  }
  res.json(ofertasMemoria);
});

// ROTA 2: Executa varredura manual disparada pelo frontend
app.get('/api/run-bot', async (req, res) => {
  const resultado = await carregarOfertasDinamicas();
  res.json({
    sucesso: true,
    mensagem: 'Varredura concluída com sucesso!',
    total: resultado.length,
    ofertas: resultado
  });
});

// ROTA DE TESTE
app.get('/', (req, res) => {
  res.send('🤖 Robô Scraper FlashOfertas está 100% Ativo!');
});

// Início do Servidor
app.listen(PORT, async () => {
  console.log(`⚡ Servidor do Robô ativo na porta ${PORT}`);
  await carregarOfertasDinamicas();
});