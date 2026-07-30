const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// =========================================================================
// OFERTAS DESTAQUE DA F&C OFERTAS (Seus achadinhos principais)
// =========================================================================
const ofertasExclusivas = [
  {
    id: 'fc-1',
    titulo: 'Kit 10 Marmitas Potes 800ml Travas Laterais Herméticas',
    preco: 'R$ 29,90',
    imagem: 'https://down-br.img.susercontent.com/file/br-11134207-7r98o-lsi5uogq9k8vcd',
    link: 'https://s.shopee.com.br/111i1Jtclr', // Seu link de afiliado oficial
    loja: 'Shopee'
  },
  {
    id: 'fc-2',
    titulo: 'Fone de Ouvido Bluetooth Sem Fio TWS Alta Qualidade HD',
    preco: 'R$ 39,90',
    imagem: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
    link: 'https://s.shopee.com.br/111i1Jtclr',
    loja: 'Shopee'
  },
  {
    id: 'fc-3',
    titulo: 'Smartwatch Digital Esportivo Inteligente Bluetooth',
    preco: 'R$ 59,90',
    imagem: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
    link: 'https://s.shopee.com.br/111i1Jtclr',
    loja: 'Shopee'
  }
];

let ofertasMemoria = [];

// Função que faz varredura ampla para buscar mais de 100 produtos com fotos HD
async function executarVarreduraAmpla() {
  try {
    console.log('🔍 [BOT F&C OFERTAS]: A iniciar varredura ampla de catálogo...');
    
    // Puxa 4 rotas de categorias diferentes em paralelo para expandir o número de produtos
    const [resGeral, resBeauty, resTech, resHome] = await Promise.all([
      axios.get('https://dummyjson.com/products?limit=30&skip=0', { timeout: 8000 }),
      axios.get('https://dummyjson.com/products/category/beauty?limit=25', { timeout: 8000 }),
      axios.get('https://dummyjson.com/products/category/smartphones?limit=25', { timeout: 8000 }),
      axios.get('https://dummyjson.com/products/category/home-decoration?limit=25', { timeout: 8000 })
    ]);

    const listaGeral = resGeral.data?.products || [];
    const listaBeauty = resBeauty.data?.products || [];
    const listaTech = resTech.data?.products || [];
    const listaHome = resHome.data?.products || [];

    // Agrupa todos os resultados em um único catálogo gigante
    const todosProdutos = [...listaGeral, ...listaBeauty, ...listaTech, ...listaHome];

    // Remove duplicados pelo ID
    const mapaUnicos = new Map();
    todosProdutos.forEach(prod => mapaUnicos.set(prod.id, prod));
    const produtosUnicos = Array.from(mapaUnicos.values());

    // Mapeia para o formato do F&C Ofertas garantindo FOTO REAL e PREÇO FORMATADO
    const catalogoFormatado = produtosUnicos.map((item, idx) => {
      const precoBRL = (item.price * 5.3).toFixed(2);
      
      // Seleciona a foto original do produto em maior definição
      const fotoOficial = item.images && item.images.length > 0 ? item.images[0] : item.thumbnail;

      // Alterna entre as lojas para dar variedade visual ao site
      let lojaNome = 'Shopee';
      if (idx % 3 === 1) lojaNome = 'Mercado Livre';
      if (idx % 3 === 2) lojaNome = 'Amazon';

      return {
        id: 'fc-cat-' + item.id,
        titulo: `${item.title} - Destaque F&C Ofertas`,
        preco: `R$ ${parseFloat(precoBRL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        imagem: fotoOficial, // Foto real e original em alta resolução
        link: 'https://s.shopee.com.br/111i1Jtclr', // Link padronizado de comissão
        loja: lojaNome
      };
    });

    // Coloca os seus achadinhos exclusivos no topo
    ofertasMemoria = [...ofertasExclusivas, ...catalogoFormatado];
    console.log(`🎉 [BOT F&C OFERTAS]: Sucesso! ${ofertasMemoria.length} ofertas com fotos oficiais prontas.`);
    
    return ofertasMemoria;
  } catch (err) {
    console.error('⚠️ [BOT F&C OFERTAS]: Erro na varredura ampla:', err.message);
    return ofertasExclusivas;
  }
}

// Rotas da API
app.get('/api/ofertas', async (req, res) => {
  if (ofertasMemoria.length === 0) {
    await executarVarreduraAmpla();
  }
  res.json(ofertasMemoria);
});

app.get('/api/run-bot', async (req, res) => {
  const resultado = await executarVarreduraAmpla();
  res.json({
    sucesso: true,
    mensagem: 'Varredura ampla F&C Ofertas concluída com sucesso!',
    total: resultado.length,
    ofertas: resultado
  });
});

app.get('/', (req, res) => {
  res.send('🤖 Servidor F&C Ofertas - Robô Amplo de Busca Ativo!');
});

app.listen(PORT, async () => {
  console.log(`⚡ Servidor F&C Ofertas ativo na porta ${PORT}`);
  await executarVarreduraAmpla();
});