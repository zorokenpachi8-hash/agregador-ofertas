const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// SEU LINK DE AFILIADO SHOPEE ATIVO
const MEU_LINK_SHOPEE = 'https://s.shopee.com.br/111i1Jtclr';

// =========================================================================
// ACHADINHOS EXCLUSIVOS F&C OFERTAS
// =========================================================================
const ofertasExclusivas = [
  {
    id: 'fc-1',
    titulo: 'Kit 10 Marmitas Potes 800ml Travas Laterais Herméticas - KAZIVA',
    preco: 'R$ 29,90',
    imagem: 'https://down-br.img.susercontent.com/file/br-11134207-7r98o-lsi5uogq9k8vcd',
    link: MEU_LINK_SHOPEE,
    loja: 'Shopee'
  },
  {
    id: 'fc-2',
    titulo: 'Fone de Ouvido Bluetooth Sem Fio TWS Alta Qualidade',
    preco: 'R$ 39,90',
    imagem: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
    link: MEU_LINK_SHOPEE,
    loja: 'Shopee'
  },
  {
    id: 'fc-3',
    titulo: 'Smartwatch Digital Esportivo Inteligente Bluetooth',
    preco: 'R$ 59,90',
    imagem: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
    link: MEU_LINK_SHOPEE,
    loja: 'Shopee'
  }
];

let ofertasMemoria = [];

// Função que faz a busca ampla e atribui links de acordo com a loja
async function executarVarreduraInteligente() {
  try {
    console.log('🔍 [BOT F&C OFERTAS]: A buscar novos produtos...');
    
    const [resGeral, resBeauty, resTech] = await Promise.all([
      axios.get('https://dummyjson.com/products?limit=30&skip=0', { timeout: 8000 }),
      axios.get('https://dummyjson.com/products/category/beauty?limit=30', { timeout: 8000 }),
      axios.get('https://dummyjson.com/products/category/smartphones?limit=30', { timeout: 8000 })
    ]);

    const listaGeral = resGeral.data?.products || [];
    const listaBeauty = resBeauty.data?.products || [];
    const listaTech = resTech.data?.products || [];

    const todosProdutos = [...listaGeral, ...listaBeauty, ...listaTech];

    // Remove duplicados
    const mapaUnicos = new Map();
    todosProdutos.forEach(prod => mapaUnicos.set(prod.id, prod));
    const produtosUnicos = Array.from(mapaUnicos.values());

    const catalogoFormatado = produtosUnicos.map((item, idx) => {
      const precoBRL = (item.price * 5.3).toFixed(2);
      
      // Seleciona foto em alta qualidade
      const fotoOficial = item.thumbnail || (item.images && item.images[0]);

      // Atribuição de Lojas e seus respetivos links
      let lojaNome = 'Shopee';
      let linkDestino = MEU_LINK_SHOPEE;

      if (idx % 3 === 1) {
        lojaNome = 'Mercado Livre';
        linkDestino = `https://lista.mercadolivre.com.br/${encodeURIComponent(item.title)}`;
      } else if (idx % 3 === 2) {
        lojaNome = 'Amazon';
        linkDestino = `https://www.amazon.com.br/s?k=${encodeURIComponent(item.title)}`;
      }

      return {
        id: 'fc-cat-' + item.id,
        titulo: `${item.title} - Destaque F&C Ofertas`,
        preco: `R$ ${parseFloat(precoBRL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        imagem: fotoOficial,
        link: linkDestino, // Link dinâmico conforme a loja!
        loja: lojaNome
      };
    });

    ofertasMemoria = [...ofertasExclusivas, ...catalogoFormatado];
    console.log(`🎉 [BOT F&C OFERTAS]: ${ofertasMemoria.length} ofertas carregadas com sucesso!`);
    
    return ofertasMemoria;
  } catch (err) {
    console.error('⚠️ [BOT F&C OFERTAS]: Erro na atualização:', err.message);
    return ofertasExclusivas;
  }
}

// Rotas
app.get('/api/ofertas', async (req, res) => {
  if (ofertasMemoria.length === 0) {
    await executarVarreduraInteligente();
  }
  res.json(ofertasMemoria);
});

app.get('/api/run-bot', async (req, res) => {
  const resultado = await executarVarreduraInteligente();
  res.json({
    sucesso: true,
    mensagem: 'Catálogo F&C Ofertas atualizado!',
    total: resultado.length,
    ofertas: resultado
  });
});

app.get('/', (req, res) => {
  res.send('🤖 Servidor F&C Ofertas Ativo!');
});

app.listen(PORT, async () => {
  console.log(`⚡ Servidor rodando na porta ${PORT}`);
  await executarVarreduraInteligente();
});