const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

// Tag de Afiliado padrão (substitua pela sua tag da Amazon)
const AMAZON_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'seu_id_amazon-20';

// Lista de produtos em promoção com seus links de afiliado
let ofertasCapturadas = [
  {
    id: '1',
    title: 'Smartphone Samsung Galaxy S23 Ultra 5G 256GB',
    category: 'Eletrônicos',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500',
    price: 899.00,
    oldPrice: 1399.00,
    store: 'Amazon',
    affiliateUrl: `https://www.amazon.com.br/dp/B08N5WRWNW?tag=${AMAZON_TAG}`,
    isFlashSale: true,
    expiresInMinutes: 45
  },
  {
    id: '2',
    title: 'Fritadeira Elétrica Air Fryer 4L Digital',
    category: 'Casa',
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500',
    price: 249.90,
    oldPrice: 499.00,
    store: 'Shopee',
    affiliateUrl: 'https://shopee.com.br',
    isFlashSale: true,
    expiresInMinutes: 30
  }
];

// Função do Bot de Varredura
async function rodarBotVarredura() {
  console.log('🤖 [ROBÔ] Varrendo ofertas e atualizando links de afiliados...');
  // Aqui o bot faz a varredura automática nas lojas
}

// Executa a varredura a cada 15 minutos
cron.schedule('*/15 * * * *', () => {
  rodarBotVarredura();
});

// Rota de API consumida pelo site
app.get('/api/ofertas', (req, res) => {
  res.json(ofertasCapturadas);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor e Robô rodando na porta ${PORT}`);
  rodarBotVarredura();
});
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Título da página</title>
</head>
<body>
    
</body>
</html>